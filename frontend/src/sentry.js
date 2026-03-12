import * as Sentry from "@sentry/react";

const DSN = import.meta.env.VITE_SENTRY_DSN;

// Detect platform: capacitor-ios, capacitor-android, or web
function detectPlatform() {
  if (typeof window !== "undefined" && window.Capacitor) {
    const platform = window.Capacitor.getPlatform?.();
    if (platform) return `capacitor-${platform}`;
    return "capacitor";
  }
  return "web";
}

export function initSentry() {
  if (!DSN) {
    if (import.meta.env.DEV) {
      console.log("[Sentry] DSN not configured — skipping init (dev mode)");
    }
    return;
  }

  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE || "production",
    release: import.meta.env.VITE_SENTRY_RELEASE || `smartme@${import.meta.env.VITE_APP_VERSION || "1.0.0"}`,

    // Conservative tracing — just enough to see slow page loads
    tracesSampleRate: 0.1,

    // No session replay for now
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,

    // Filter noisy/irrelevant errors
    beforeSend(event) {
      const message = event.exception?.values?.[0]?.value || "";

      // Don't send auth redirects as errors
      if (message === "Nieautoryzowany") return null;

      // Don't send network errors from offline users
      if (message.includes("połączenie z internetem")) return null;

      return event;
    },

    // Tag with platform info
    initialScope: {
      tags: {
        platform: detectPlatform(),
      },
    },
  });
}

// Set user context after login — call from auth flow
export function setSentryUser(user) {
  if (!DSN) return;
  if (user) {
    Sentry.setUser({
      id: user.id ? String(user.id) : undefined,
      username: user.username || undefined,
    });
  } else {
    Sentry.setUser(null);
  }
}

export { Sentry };
