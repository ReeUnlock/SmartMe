import { create } from "zustand";

/**
 * Celebration types (lowest → highest priority):
 *   "progress"    — very subtle pulse, small sparkles
 *   "affirmation" — soft sparkle bloom
 *   "reward"      — satisfying sparkle burst + glow
 *   "achievement" — ceremonial badge glow + particle halo
 *   "levelup"     — biggest moment, full halo expansion
 *
 * API: celebrate(type, options?)
 *   options.originX — origin X in viewport % (default 50)
 *   options.originY — origin Y in viewport % (default 50)
 *   options.intensity — multiplier 0-2 (default 1)
 */

const PRIORITY = {
  progress: 0,
  affirmation: 1,
  reward: 2,
  achievement: 3,
  levelup: 4,
};

// Throttle cooldowns per type (ms) — prevents spam for low-priority events
const COOLDOWNS = {
  progress: 3000,
  affirmation: 2000,
  reward: 1500,
  achievement: 0, // never suppress
  levelup: 0, // never suppress
};

const useCelebration = create((set, get) => ({
  active: null, // { type, id, options }
  _lastFired: {}, // { [type]: timestamp } for throttling

  celebrate(type, options = {}) {
    const now = Date.now();
    const current = get();

    // Throttle low-priority events
    const cooldown = COOLDOWNS[type] ?? 0;
    if (cooldown > 0) {
      const lastFired = current._lastFired[type] || 0;
      if (now - lastFired < cooldown) return;
    }

    // Priority check: don't interrupt higher-priority active celebration
    if (current.active) {
      const activePriority = PRIORITY[current.active.type] ?? 0;
      const newPriority = PRIORITY[type] ?? 0;
      if (newPriority < activePriority) return; // ignore lower-priority
    }

    set({
      active: { type, id: now, options },
      _lastFired: { ...current._lastFired, [type]: now },
    });
  },

  dismiss() {
    set({ active: null });
  },
}));

export default useCelebration;
