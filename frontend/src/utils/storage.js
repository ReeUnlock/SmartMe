/**
 * Per-user localStorage scoping for multi-user support.
 * Global keys (token, cookie consent) are NOT scoped.
 * All other keys are prefixed with `user_{userId}_`.
 */

const GLOBAL_KEYS = new Set(["smartme_cookie_consent", "token"]);

/**
 * Get the user ID from the auth store without creating a circular dependency.
 * Falls back to "anonymous" if no user is logged in.
 */
function getCurrentUserId() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return "anonymous";
    // Parse JWT to get user ID from sub claim
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub || "anonymous";
  } catch {
    return "anonymous";
  }
}

export function getStorageKey(key, userId) {
  if (GLOBAL_KEYS.has(key)) return key;
  const id = userId ?? getCurrentUserId();
  return `user_${id}_${key}`;
}

export function getUserStorage(key, userId) {
  return localStorage.getItem(getStorageKey(key, userId));
}

export function setUserStorage(key, value, userId) {
  localStorage.setItem(getStorageKey(key, userId), value);
}

export function removeUserStorage(key, userId) {
  localStorage.removeItem(getStorageKey(key, userId));
}

/**
 * Migrate existing localStorage data from un-scoped keys to scoped keys.
 * Called once after login for existing users.
 */
const MIGRATABLE_KEYS = [
  "smartme_rewards",
  "smartme_achievements",
  "smartme_challenges",
  "smartme_avatar",
  "smartme_seen_avatar_unlocks",
  "smartme_sound_settings",
  "anelka_quick_templates",
  "anelka_shopping_templates",
  "anelka_item_history",
  "smartme_tile_order",
];

export function migrateStorageForUser(userId) {
  for (const key of MIGRATABLE_KEYS) {
    const scopedKey = `user_${userId}_${key}`;
    // Only migrate if old key exists and scoped key doesn't
    const oldValue = localStorage.getItem(key);
    if (oldValue !== null && localStorage.getItem(scopedKey) === null) {
      localStorage.setItem(scopedKey, oldValue);
    }
  }
}
