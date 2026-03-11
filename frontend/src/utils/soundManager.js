/**
 * SoundManager — lightweight UI sound effects system.
 *
 * Usage:
 *   import { playSound } from "../utils/soundManager";
 *   playSound("taskComplete");
 *
 * Sound files live in /public/sounds/ with Polish filenames.
 * Settings (enabled, volume) are read from the useSoundSettings store.
 */

const SOUND_MAP = {
  taskComplete: "ukonczenie-zadania.mp3",
  goalAdded: "dodanie-celu.mp3",
  affirmationOpen: "otwarcie-afirmacji.mp3",
  achievementUnlocked: "odblokowanie-osiagniecia.mp3",
  sparksGained: "zdobycie-iskier.mp3",
  voiceStart: "start-nagrywania-glosu.mp3",
  voiceStop: "stop-nagrywania-glosu.mp3",
  // dailyCheckIn: "codzienne-powitanie.mp3", — file not yet created
  levelUp: "nowy-poziom.mp3",
  expenseAdded: "dodano-wydatek.mp3",
};

const BASE_PATH = "/sounds/";

// Pool size per sound key — allows overlapping playback of the same sound
const POOL_SIZE = 3;

/** @type {Map<string, HTMLAudioElement[]>} */
const pools = new Map();

/** @type {Map<string, number>} index into each pool */
const poolIndex = new Map();

/** Whether preloading has been attempted */
let preloaded = false;

/**
 * Get or create the audio pool for a given key.
 * Returns an empty array if the key is unknown.
 */
function getPool(key) {
  if (pools.has(key)) return pools.get(key);

  const filename = SOUND_MAP[key];
  if (!filename) return [];

  const src = BASE_PATH + filename;
  const elements = [];

  for (let i = 0; i < POOL_SIZE; i++) {
    const audio = new Audio(src);
    audio.preload = "auto";
    // Swallow load errors silently — file may not exist yet
    audio.addEventListener("error", () => {}, { once: true });
    elements.push(audio);
  }

  pools.set(key, elements);
  poolIndex.set(key, 0);
  return elements;
}

/**
 * Preload all sounds so first playback has no delay.
 * Safe to call multiple times — only runs once.
 */
export function preloadSounds() {
  if (preloaded) return;
  preloaded = true;

  for (const key of Object.keys(SOUND_MAP)) {
    getPool(key);
  }
}

/**
 * Play a sound by key.
 *
 * Reads enabled/volume from useSoundSettings store (lazy import to avoid
 * circular deps). Falls back gracefully if the file is missing or playback
 * fails.
 *
 * @param {keyof typeof SOUND_MAP} key
 */
export function playSound(key) {
  // Lazy-read settings to avoid import-order issues
  let enabled = true;
  let volume = 0.5;

  try {
    // Dynamic require would break bundlers, so we read from localStorage
    // directly for zero-dep access. The zustand store syncs to the same key.
    const raw = localStorage.getItem("smartme_sound_settings");
    if (raw) {
      const settings = JSON.parse(raw);
      if (settings.enabled === false) return;
      if (typeof settings.volume === "number") volume = settings.volume;
    }
  } catch {
    // Fallback: play with defaults
  }

  const pool = getPool(key);
  if (pool.length === 0) return;

  const idx = poolIndex.get(key) || 0;
  const audio = pool[idx];
  poolIndex.set(key, (idx + 1) % pool.length);

  audio.volume = Math.max(0, Math.min(1, volume));
  audio.currentTime = 0;

  // Fire-and-forget — never block the UI
  audio.play().catch(() => {
    // Autoplay blocked or file missing — silently ignore
  });
}

/**
 * All available sound keys, useful for tooling / debug.
 */
export const SOUND_KEYS = Object.keys(SOUND_MAP);
