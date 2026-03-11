/**
 * SoundManager — lightweight UI sound effects system.
 *
 * Features:
 *   - Microtask batching: when multiple sounds are triggered in the same
 *     synchronous block (e.g., action + reward + achievement cascade), only
 *     the highest-priority sound plays. This prevents overlapping audio from
 *     simultaneous cascade triggers.
 *   - Audio pool: each sound has multiple HTMLAudioElement instances to allow
 *     the same sound to overlap on rapid repeated triggers (e.g., checking
 *     off several items quickly).
 *
 * How batching works:
 *   Each playSound() call within one synchronous block competes by priority.
 *   A queueMicrotask flush runs after the sync block completes and plays only
 *   the winner. Separate user actions (separate event-loop turns) each get
 *   their own batch — they never suppress each other.
 *
 * Usage:
 *   import { playSound } from "../utils/soundManager";
 *   playSound("taskComplete");
 *
 * Sound files live in /public/sounds/ with Polish filenames.
 * Settings (enabled, volume) are read from localStorage (synced by useSoundSettings).
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

/**
 * Sound priority — when multiple sounds fire in the same synchronous block,
 * the highest priority wins.
 *
 * Priority guide:
 *   - Reaction sounds (sparksGained) = lowest, always accompanies a primary action
 *   - UI feedback (voice) = medium
 *   - Action sounds (expense, goal, task) = high
 *   - Affirmation = high (primary action)
 *   - Rare events (achievement, level up) = highest (override action sounds)
 */
const SOUND_PRIORITY = {
  sparksGained: 2,
  voiceStart: 5,
  voiceStop: 5,
  taskComplete: 6,
  goalAdded: 6,
  expenseAdded: 6,
  affirmationOpen: 7,
  achievementUnlocked: 8,
  levelUp: 9,
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

// ─── Batching state ──────────────────────────────────────────────
/** @type {{ key: string, priority: number } | null} */
let pendingSound = null;
let flushScheduled = false;

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
 * Actually play a sound from the pool (no priority/batching checks).
 */
function doPlay(key) {
  let volume = 0.5;

  try {
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
 * Flush the pending sound batch (called via queueMicrotask).
 */
function flushPending() {
  flushScheduled = false;
  const sound = pendingSound;
  pendingSound = null;

  if (!sound) return;
  if (_testing.onPlay) _testing.onPlay(sound.key);
  else doPlay(sound.key);
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
 * Multiple calls in the same synchronous block are batched — only the
 * highest-priority sound actually plays. This prevents reward/achievement
 * cascade sounds from overlapping with the primary action sound.
 *
 * Calls from separate event-loop turns (separate user actions) are never
 * batched together — each action gets its own sound.
 *
 * @param {keyof typeof SOUND_MAP} key
 */
export function playSound(key) {
  // Early exit if sounds are disabled
  try {
    const raw = localStorage.getItem("smartme_sound_settings");
    if (raw) {
      const settings = JSON.parse(raw);
      if (settings.enabled === false) return;
    }
  } catch {
    // Fallback: proceed with play
  }

  const priority = SOUND_PRIORITY[key] ?? 3;

  // Batch: keep the highest-priority sound in the current synchronous block
  if (!pendingSound || priority > pendingSound.priority) {
    pendingSound = { key, priority };
  }

  // Schedule flush via microtask (runs after all synchronous code completes)
  if (!flushScheduled) {
    flushScheduled = true;
    queueMicrotask(flushPending);
  }
}

/**
 * All available sound keys, useful for tooling / debug.
 */
export const SOUND_KEYS = Object.keys(SOUND_MAP);

/**
 * Test-only hooks. Not used in production.
 * - onPlay: if set, called instead of doPlay so tests can observe which key won.
 * - reset(): clears batching state between tests.
 */
export const _testing = {
  onPlay: null,
  reset() {
    pendingSound = null;
    flushScheduled = false;
  },
};
