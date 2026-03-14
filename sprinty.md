# SmartMe — Plan Sprintów (Produkcja SaaS)

> Wynik audytu produkcyjnego z 2026-03-14. Sprinty priorytetyzowane wg ryzyka biznesowego.

---

## Sprint 1 — Bezpieczeństwo płatności i auth (krytyczne)
**Cel**: Zabezpieczyć ścieżkę płatności i auth przed pierwszym płacącym klientem.
**Szacowany czas**: 3-4 dni

### Zadania
- [ ] **Egzekwowanie limitów Free/Pro** — middleware `check_limit(feature, user)` w endpointach:
  - Shopping: max 10 list
  - Expenses: max 100/miesiąc
  - Calendar: max 50 eventów
  - Goals: max 5
  - Voice: max 20/dzień
  - Receipts: max 10 skanów/miesiąc
  - HTTP 402 z komunikatem o upgrade do Pro
- [ ] **Webhook `payment_failed`** — ustawić `user.plan = "free"` gdy płatność nie przejdzie (obecnie brak reakcji)
- [ ] **Weryfikacja emaila przy reset hasła** — dodać token emailowy zamiast bezpośredniego resetu
  - Nowa tabela `password_reset_tokens` (token, user_id, expires_at)
  - Endpoint `POST /auth/forgot-password` wysyła link z tokenem
  - Endpoint `POST /auth/reset-password` weryfikuje token i zmienia hasło
- [ ] **Refresh tokens** — dodać `POST /auth/refresh` z krótszym access_token (15min) i dłuższym refresh_token (30 dni)
- [ ] **Rate limiting na billing** — dodać limit na `/billing/checkout` (3/min)

### Definicja ukończenia
- Testy manualne: upgrade → downgrade → payment_failed → limity działają
- Forgot-password flow działa end-to-end z emailem

---

## Sprint 2 — Infrastruktura i stabilność
**Cel**: Backup danych, bezpieczna konfiguracja, monitoring.
**Szacowany czas**: 2-3 dni

### Zadania
- [ ] **Backup PostgreSQL** — cron na VPS:
  - `pg_dump` codziennie o 3:00
  - Rotacja: 7 dziennych + 4 tygodniowe
  - Opcjonalnie: upload do S3/Backblaze B2
- [ ] **`.env.example`** — szablon z wszystkimi zmiennymi (bez wartości):
  ```
  SECRET_KEY=
  DATABASE_URL=
  STRIPE_SECRET_KEY=
  STRIPE_WEBHOOK_SECRET=
  STRIPE_PRICE_ID=
  RESEND_API_KEY=
  OPENAI_API_KEY=
  SENTRY_DSN=
  VITE_POSTHOG_KEY=
  ```
- [ ] **Dockerfile.prod dla backendu** — multi-stage build, non-root user, health check
- [ ] **Rotacja kluczy API** — procedura i dokumentacja dla: SECRET_KEY, Stripe keys, Resend, OpenAI
- [ ] **Health check rozszerzony** — dodać check Stripe connectivity i Resend

### Definicja ukończenia
- Backup działa automatycznie, sprawdzony restore
- `.env.example` w repo, prod `.env` ma wszystkie zmienne

---

## Sprint 3 — Testy i monitoring
**Cel**: Pokrycie testami krytycznych ścieżek, monitoring błędów na backendzie.
**Szacowany czas**: 3-4 dni

### Zadania
- [ ] **Testy auth** — pytest:
  - Setup flow (happy path + duplicate 403)
  - Login (success + wrong password)
  - Token expiry
  - Password change
  - Account reset (cascade delete)
- [ ] **Testy billing** — pytest z mockiem Stripe:
  - Checkout session creation
  - Webhook: checkout.completed → plan=pro
  - Webhook: subscription.deleted → plan=free
  - Webhook: payment_failed → plan=free
  - Duplicate webhook idempotency
- [ ] **Testy expenses** — pytest:
  - CRUD
  - Summary aggregation (NULL + "Inne" merge)
  - Recurring generation (no duplicates)
  - Bulk delete
  - Feature limit enforcement (402)
- [ ] **Sentry na backendzie** — `sentry-sdk[fastapi]`:
  - Inicjalizacja w `main.py`
  - Env var `SENTRY_DSN_BACKEND`
  - Filtrowanie healthcheck i webhook noise
- [ ] **CSP header** — nginx `Content-Security-Policy`:
  - `default-src 'self'`
  - `script-src 'self' eu.posthog.com`
  - `connect-src 'self' eu.posthog.com *.stripe.com *.sentry.io`
  - `img-src 'self' data: blob:`
  - `style-src 'self' 'unsafe-inline'` (Chakra wymaga)

### Definicja ukończenia
- CI przechodzi z testami (min 80% coverage na auth + billing)
- Sentry łapie błędy z produkcji
- CSP blokuje XSS bez łamania funkcjonalności

---

## Sprint 4 — Billing hardening i audit
**Cel**: Odporność webhooków, audit trail, uptime monitoring.
**Szacowany czas**: 2 dni

### Zadania
- [ ] **Idempotency webhooków** — `processed_stripe_events` tabela:
  - Kolumny: event_id (unique), event_type, processed_at
  - Sprawdzenie przed przetworzeniem
  - Zapobiega duplikatom przy retry Stripe
- [ ] **Billing audit log** — `billing_events` tabela:
  - Kolumny: user_id, event_type, stripe_event_id, old_plan, new_plan, amount, created_at
  - Zapis przy każdej zmianie planu
  - Endpoint `GET /billing/history` dla admina/użytkownika
- [ ] **Uptime monitoring** — UptimeRobot lub Betterstack:
  - Monitor `/api/health` co 5 min
  - Alert email + Slack przy downtime
- [ ] **Stripe test mode → live mode** — checklist:
  - Zmienić klucze w `.env` prod
  - Webhook endpoint w Stripe Dashboard → `https://smartme.life/api/billing/webhooks/stripe`
  - Test mode checkout → live checkout
  - Weryfikacja first real payment

### Definicja ukończenia
- Webhook retry nie tworzy duplikatów
- Pełna historia zmian planu w DB
- Alerty o downtime działają

---

## Sprint 5 — UX i onboarding Pro
**Cel**: Płynne doświadczenie dla płacących użytkowników.
**Szacowany czas**: 2-3 dni

### Zadania
- [ ] **Limit warnings w UI** — komunikaty gdy zbliżasz się do limitu:
  - 80% limitu → żółty banner "Pozostało X"
  - 100% limitu → blokada + CTA upgrade
  - Konsystentny design per moduł (kolor modułu)
- [ ] **Onboarding Pro** — po udanym checkout:
  - Success page z confetti (CelebrationOverlay `levelup`)
  - "Witaj w Pro!" banner w dashboard (jednorazowy)
  - Email powitalny Pro z listą benefitów
- [ ] **Subscription status w UI** — widoczny plan:
  - Badge "Pro" w Header/Sidebar
  - Badge "Pro" na AffirmationAvatar
  - Dashboard widget z datą następnej płatności
- [ ] **Cancellation flow** — Stripe portal + in-app:
  - Przycisk "Zarządzaj subskrypcją" → Stripe portal
  - Po anulowaniu: "Pro do końca okresu" status
  - Downgrade banner z datą
- [ ] **Invoice/receipt** — email z fakturą po każdej płatności (Stripe automatic receipts)

### Definicja ukończenia
- User journey: free → upgrade → manage → cancel działa bez bugów
- Limity widoczne i zrozumiałe dla użytkownika

---

## Sprint 6 — Push Notifications (Faza 7)
**Cel**: Web push + natywne powiadomienia.
**Szacowany czas**: 3-4 dni

### Zadania
- [ ] **VAPID key generation** — `pywebpush` (już zainstalowany)
- [ ] **Service Worker** — rejestracja, push event handler
- [ ] **Subscription management** — tabela `push_subscriptions`, endpoint `/api/notifications/subscribe`
- [ ] **Triggers**:
  - Przypomnienie o wydarzeniu (15 min przed)
  - Cykliczny wydatek do dodania (1-szy dzień miesiąca)
  - Wyzwanie dnia (rano)
  - Cel bliski ukończenia (90%+)
- [ ] **Capacitor push** — `@capacitor/push-notifications` dla natywnych
- [ ] **Settings UI** — toggle per typ powiadomienia w Ustawieniach

### Definicja ukończenia
- Push działa na web, Android i iOS
- Użytkownik kontroluje typy powiadomień

---

## Sprint 7 — AI i polish (Faza 8-9)
**Cel**: Inteligentne sugestie, Google Calendar sync.
**Szacowany czas**: 4-5 dni

### Zadania
- [ ] **AI sugestie wydatków** — GPT analiza wzorców:
  - "W tym miesiącu wydajesz 30% więcej na jedzenie"
  - "Rozważ budżet na transport — rośnie trend"
- [ ] **AI chat** — prosty asystent w apce:
  - Kontekst: wydatki, cele, kalendarz
  - "Ile wydałam w lutym na jedzenie?"
  - "Kiedy osiągnę cel oszczędnościowy?"
- [ ] **Google Calendar sync** — OAuth2 + Calendar API:
  - Import eventów z Google
  - Export eventów do Google
  - Two-way sync (opcjonalnie)
- [ ] **PWA improvements**:
  - Offline support (Service Worker cache)
  - Install prompt
  - Background sync

### Definicja ukończenia
- AI sugestie pojawiają się w dashboardzie
- Google Calendar sync działa bidirectionally

---

## Priorytety i kolejność

```
Sprint 1 ──▶ Sprint 2 ──▶ Sprint 3 ──▶ Sprint 4
(krytyczne)   (infra)      (testy)      (billing)
                                            │
Sprint 5 ◀─────────────────────────────────┘
(UX Pro)
    │
Sprint 6 ──▶ Sprint 7
(push)        (AI/polish)
```

**Blokery przed pierwszym płacącym klientem**: Sprint 1 + Sprint 2 + Sprint 4 (Stripe live mode)

---

## Znane problemy (z audytu)

| Problem | Ryzyko | Sprint |
|---------|--------|--------|
| Brak egzekwowania limitów Free/Pro | Krytyczne — free users mają nieograniczony dostęp | 1 |
| `payment_failed` nie zmienia planu | Krytyczne — user płaci free ale ma Pro | 1 |
| Reset hasła bez weryfikacji email | Wysokie — każdy znający email może zresetować | 1 |
| Brak refresh tokens | Średnie — 30-dniowy token = duże okno ataku | 1 |
| Brak backupu DB | Krytyczne — utrata danych = utrata klientów | 2 |
| Brak `.env.example` | Średnie — trudny onboarding nowego dewelopera | 2 |
| Backend bez Sentry | Wysokie — błędy produkcyjne niewidoczne | 3 |
| Brak testów | Wysokie — regresje przy zmianach | 3 |
| Brak CSP header | Średnie — podatność na XSS | 3 |
| Webhook duplikaty | Średnie — podwójne zmiany planu | 4 |
| Brak audit log billing | Średnie — brak historii zmian | 4 |
| Brak uptime monitoring | Średnie — downtime niewidoczny | 4 |
