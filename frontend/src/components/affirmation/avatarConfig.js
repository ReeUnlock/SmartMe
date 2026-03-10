import SolSun from "./avatars/SolSun";
import NoxMoon from "./avatars/NoxMoon";
import BloomFlower from "./avatars/BloomFlower";
import AuraOrb from "./avatars/AuraOrb";

const AVATAR_CONFIG = [
  {
    key: "sol",
    name: "Sol",
    description: "Ciep\u0142e s\u0142oneczko pe\u0142ne lekko\u015bci i energii",
    requiredLevel: 1,
    component: SolSun,
    theme: "peach",
    icon: "\u2600\uFE0F",
  },
  {
    key: "nox",
    name: "Nox",
    description: "Spokojny ksi\u0119\u017cyc otulony mi\u0119kkim blaskiem",
    requiredLevel: 1,
    component: NoxMoon,
    theme: "lavender",
    icon: "\u{1F319}",
  },
  {
    key: "bloom",
    name: "Bloom",
    description: "Kwiat afirmacji, kt\u00f3ry rozkwita razem z Tob\u0105",
    requiredLevel: 5,
    component: BloomFlower,
    theme: "pink",
    icon: "\u{1F338}",
  },
  {
    key: "aura",
    name: "Aura",
    description: "\u015awietlista kula energii i wewn\u0119trznego blasku",
    requiredLevel: 10,
    component: AuraOrb,
    theme: "lavender",
    icon: "\u{1F52E}",
  },
];

export const AVATAR_STORAGE_KEY = "smartme_avatar";
export const AVATAR_UNLOCK_STORAGE_KEY = "smartme_seen_avatar_unlocks";

/**
 * Get avatar config by key.
 */
export function getAvatarConfig(key) {
  return AVATAR_CONFIG.find((a) => a.key === key);
}

/**
 * Get the component map { key: Component } for quick lookup.
 */
export function getAvatarComponents() {
  const map = {};
  for (const a of AVATAR_CONFIG) {
    map[a.key] = a.component;
  }
  return map;
}

/**
 * Get the selected avatar key from localStorage, with level-based fallback.
 * If the stored avatar is locked at the user's level, falls back to the
 * highest unlocked avatar.
 */
export function getSelectedAvatar(level) {
  let saved = null;
  try {
    saved = localStorage.getItem(AVATAR_STORAGE_KEY);
  } catch {}

  // Migrate: if user had "luna" selected, switch to "sol"
  if (saved === "luna") {
    try { localStorage.setItem(AVATAR_STORAGE_KEY, "sol"); } catch {}
    return "sol";
  }

  // Check if saved avatar is valid and unlocked
  if (saved) {
    const config = getAvatarConfig(saved);
    if (config && level >= config.requiredLevel) {
      return saved;
    }
  }

  // Fallback: default avatar (sol)
  return "sol";
}

/**
 * Save avatar selection to localStorage.
 */
export function saveSelectedAvatar(key) {
  try {
    localStorage.setItem(AVATAR_STORAGE_KEY, key);
  } catch {}
}

/**
 * Get which avatar unlock notifications have been seen.
 */
export function getSeenAvatarUnlocks() {
  try {
    const raw = localStorage.getItem(AVATAR_UNLOCK_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

/**
 * Mark an avatar unlock as seen.
 */
export function markAvatarUnlockSeen(key) {
  try {
    const seen = getSeenAvatarUnlocks();
    if (!seen.includes(key)) {
      localStorage.setItem(AVATAR_UNLOCK_STORAGE_KEY, JSON.stringify([...seen, key]));
    }
  } catch {}
}

/**
 * Check which avatars are newly unlocked (unlocked at level but not yet seen).
 * Returns array of avatar config objects.
 */
export function getNewlyUnlockedAvatars(level) {
  const seen = getSeenAvatarUnlocks();
  return AVATAR_CONFIG.filter(
    (a) => a.requiredLevel > 1 && level >= a.requiredLevel && !seen.includes(a.key)
  );
}

export default AVATAR_CONFIG;
