"""
Email service — Resend integration.
Graceful no-op when RESEND_API_KEY is empty (dev mode).
"""
import logging

from app.config import settings

logger = logging.getLogger(__name__)

_resend = None


def _get_resend():
    global _resend
    if _resend is None:
        if not settings.RESEND_API_KEY:
            return None
        import resend
        resend.api_key = settings.RESEND_API_KEY
        _resend = resend
    return _resend


def _send(to: str, subject: str, html: str) -> bool:
    """Send email via Resend. Returns True on success, False on failure or no-op."""
    r = _get_resend()
    if r is None:
        logger.info("Email skipped (no RESEND_API_KEY): %s → %s", subject, to)
        return False
    try:
        r.Emails.send({
            "from": settings.RESEND_FROM_EMAIL,
            "to": [to],
            "subject": subject,
            "html": html,
        })
        logger.info("Email sent: %s → %s", subject, to)
        return True
    except Exception as e:
        logger.error("Email send failed: %s — %s", subject, e)
        return False


def _wrap_html(content: str) -> str:
    """Wrap content in SmartMe branded email template."""
    return f"""<!DOCTYPE html>
<html lang="pl">
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#FBF8F9;font-family:'Inter',Arial,sans-serif;color:#3B4A63;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-family:'Nunito',sans-serif;font-size:28px;font-weight:900;color:#F783AC;">SmartMe</span>
    </div>
    <div style="background:#fff;border-radius:16px;padding:32px;border:1px solid #F0F0F0;">
      {content}
    </div>
    <p style="text-align:center;font-size:12px;color:#8294AA;margin-top:24px;">
      © 2026 SmartMe · <a href="https://smartme.life/privacy.html" style="color:#8294AA;">Polityka prywatności</a>
    </p>
  </div>
</body>
</html>"""


def send_welcome(to: str, name: str) -> bool:
    """Send welcome email after registration."""
    html = _wrap_html(f"""
        <h2 style="font-family:'Nunito',sans-serif;font-size:22px;margin:0 0 16px;">Witaj w SmartMe, {name}! 🎉</h2>
        <p style="line-height:1.7;color:#5A6B82;">
            Twoje konto zostało utworzone. Możesz teraz zarządzać wydatkami, zakupami,
            kalendarzem i celami — wszystko w jednym miejscu.
        </p>
        <div style="text-align:center;margin-top:24px;">
            <a href="https://app.smartme.life" style="display:inline-block;padding:12px 32px;
               background:linear-gradient(135deg,#F783AC,#F9915E);color:#fff;
               border-radius:9999px;font-weight:700;text-decoration:none;">
                Otwórz SmartMe
            </a>
        </div>
    """)
    return _send(to, "Witaj w SmartMe! 🎉", html)


def send_upgrade_confirmation(to: str, name: str) -> bool:
    """Send email after successful Pro upgrade."""
    html = _wrap_html(f"""
        <h2 style="font-family:'Nunito',sans-serif;font-size:22px;margin:0 0 16px;">Masz teraz SmartMe Pro! ✨</h2>
        <p style="line-height:1.7;color:#5A6B82;">
            Cześć {name}! Twoja subskrypcja Pro jest aktywna. Wszystkie limity zostały usunięte —
            korzystaj bez ograniczeń.
        </p>
        <p style="line-height:1.7;color:#5A6B82;">
            Możesz zarządzać subskrypcją w Ustawieniach → Subskrypcja.
        </p>
    """)
    return _send(to, "SmartMe Pro aktywny! ✨", html)


def send_downgrade_notice(to: str, name: str) -> bool:
    """Send email when subscription is canceled/expired."""
    html = _wrap_html(f"""
        <h2 style="font-family:'Nunito',sans-serif;font-size:22px;margin:0 0 16px;">Subskrypcja Pro wygasła</h2>
        <p style="line-height:1.7;color:#5A6B82;">
            Cześć {name}, Twoja subskrypcja Pro została anulowana. Twoje konto zostało przełączone
            na plan Free z limitami.
        </p>
        <p style="line-height:1.7;color:#5A6B82;">
            Wszystkie Twoje dane są bezpieczne. Możesz wrócić na Pro w dowolnym momencie.
        </p>
    """)
    return _send(to, "Subskrypcja Pro wygasła", html)


def send_support_message(from_email: str, message: str) -> bool:
    """Forward support/contact message to support@smartme.life."""
    r = _get_resend()
    if r is None:
        logger.info("Support email skipped (no RESEND_API_KEY): %s", from_email)
        return False
    try:
        r.Emails.send({
            "from": settings.RESEND_FROM_EMAIL,
            "to": ["support@smartme.life"],
            "reply_to": from_email,
            "subject": f"SmartMe Support: wiadomość od {from_email}",
            "html": _wrap_html(f"""
                <h2 style="font-family:'Nunito',sans-serif;font-size:18px;margin:0 0 16px;">
                    Wiadomość od: {from_email}
                </h2>
                <p style="line-height:1.7;color:#5A6B82;white-space:pre-wrap;">{message}</p>
            """),
        })
        return True
    except Exception as e:
        logger.error("Support email failed: %s", e)
        return False
