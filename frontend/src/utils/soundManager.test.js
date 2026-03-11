import { describe, it, expect, beforeEach, afterEach } from "vitest";

// ─── Mock localStorage before importing the module ────────────────
const store = {};
globalThis.localStorage = {
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};

// ─── Mock Audio (soundManager creates Audio elements on import) ───
globalThis.Audio = class {
  constructor() { this.preload = ""; this.volume = 1; this.currentTime = 0; }
  play() { return Promise.resolve(); }
  addEventListener() {}
};

// Import after mocks are in place
const { playSound, _testing } = await import("./soundManager");

// ─── Helpers ──────────────────────────────────────────────────────

/** Collect all keys that win a flush via the _testing.onPlay hook. */
function collectPlayed() {
  const played = [];
  _testing.onPlay = (key) => played.push(key);
  return played;
}

/** Wait for a single microtask flush (one queueMicrotask cycle). */
const flush = () => new Promise((r) => queueMicrotask(r));

/** Wait for a full event-loop turn (setTimeout 0). */
const nextTurn = () => new Promise((r) => setTimeout(r, 0));

// ─── Setup / teardown ─────────────────────────────────────────────

beforeEach(() => {
  _testing.reset();
  // Ensure sounds are "enabled"
  store.smartme_sound_settings = JSON.stringify({ enabled: true, volume: 0.5 });
});

afterEach(() => {
  _testing.onPlay = null;
  delete store.smartme_sound_settings;
});

// ─── Tests ────────────────────────────────────────────────────────

describe("soundManager batching", () => {
  it("plays the highest-priority sound when multiple fire in the same sync block", async () => {
    const played = collectPlayed();

    // Simulate the affirmation cascade: sparksGained(2) then affirmationOpen(7)
    playSound("sparksGained");
    playSound("affirmationOpen");

    await flush();

    expect(played).toEqual(["affirmationOpen"]);
  });

  it("highest priority wins regardless of call order", async () => {
    const played = collectPlayed();

    // Action sound first, then reaction sound — action should still win
    playSound("expenseAdded"); // pri 6
    playSound("sparksGained"); // pri 2

    await flush();

    expect(played).toEqual(["expenseAdded"]);
  });

  it("levelUp overrides everything in a cascade", async () => {
    const played = collectPlayed();

    playSound("sparksGained");       // pri 2
    playSound("levelUp");            // pri 9
    playSound("affirmationOpen");    // pri 7

    await flush();

    expect(played).toEqual(["levelUp"]);
  });

  it("achievementUnlocked overrides action sounds", async () => {
    const played = collectPlayed();

    playSound("expenseAdded");         // pri 6
    playSound("sparksGained");         // pri 2
    playSound("achievementUnlocked");  // pri 8

    await flush();

    expect(played).toEqual(["achievementUnlocked"]);
  });

  it("same key called twice in one sync block produces one play", async () => {
    const played = collectPlayed();

    playSound("taskComplete");
    playSound("taskComplete");

    await flush();

    expect(played).toEqual(["taskComplete"]);
  });

  it("two separate event-loop turns produce two independent plays", async () => {
    const played = collectPlayed();

    // Turn 1
    playSound("taskComplete");
    await flush();

    // Turn 2 — new sync block, previous batch fully drained
    playSound("taskComplete");
    await flush();

    expect(played).toEqual(["taskComplete", "taskComplete"]);
  });

  it("separate turns are not batched — both play independently", async () => {
    const played = collectPlayed();

    // Turn 1: voice stop
    playSound("voiceStop");
    await flush();

    // Turn 2: expense (with cascade)
    playSound("expenseAdded");
    playSound("sparksGained");
    await flush();

    // Both turns produced a sound; cascade within turn 2 was resolved
    expect(played).toEqual(["voiceStop", "expenseAdded"]);
  });

  it("unknown sound key does not crash", async () => {
    const played = collectPlayed();

    expect(() => playSound("nonexistent")).not.toThrow();

    await flush();

    // The key is passed through (doPlay will handle the missing pool gracefully)
    expect(played).toEqual(["nonexistent"]);
  });

  it("does not play when sounds are disabled", async () => {
    const played = collectPlayed();

    store.smartme_sound_settings = JSON.stringify({ enabled: false, volume: 0.5 });

    playSound("taskComplete");
    await flush();

    expect(played).toEqual([]);
  });

  it("standalone sound plays without suppression", async () => {
    const played = collectPlayed();

    playSound("voiceStart");
    await flush();

    expect(played).toEqual(["voiceStart"]);
  });

  it("full affirmation cascade: sparks + achievement + affirmation → achievement wins", async () => {
    const played = collectPlayed();

    // Exact order from AffirmationAvatar useEffect:
    // grantReward → sparksGained
    // trackProgress → achievementUnlocked (when an achievement is unlocked)
    // playSound("affirmationOpen")
    playSound("sparksGained");         // pri 2
    playSound("achievementUnlocked");  // pri 8
    playSound("affirmationOpen");      // pri 7

    await flush();

    expect(played).toEqual(["achievementUnlocked"]);
  });

  it("full expense cascade: expense + sparks + level up → levelUp wins", async () => {
    const played = collectPlayed();

    // Order from ExpensesList/QuickAdd:
    playSound("expenseAdded");   // pri 6
    playSound("sparksGained");   // pri 2
    playSound("levelUp");        // pri 9

    await flush();

    expect(played).toEqual(["levelUp"]);
  });

  it("rapid independent actions across turns all play", async () => {
    const played = collectPlayed();

    // Simulate rapid bucket-list toggles (each is a separate click event)
    playSound("taskComplete");
    await nextTurn();

    playSound("taskComplete");
    await nextTurn();

    playSound("taskComplete");
    await nextTurn();

    expect(played).toEqual(["taskComplete", "taskComplete", "taskComplete"]);
  });
});
