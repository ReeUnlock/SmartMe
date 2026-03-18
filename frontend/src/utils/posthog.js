import posthog from "posthog-js";
import { isIOS } from "./platform";

let initialized = false;

export function initPostHog() {
  if (initialized) return;
  if (isIOS()) return;
  const key = import.meta.env.VITE_POSTHOG_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST || "https://eu.i.posthog.com";
  if (!key) return;
  posthog.init(key, {
    api_host: host,
    autocapture: true,
    capture_pageview: true,
    persistence: "localStorage",
  });
  initialized = true;
}

export function trackEvent(name, properties) {
  if (initialized) {
    posthog.capture(name, properties);
  }
}

export { posthog };
