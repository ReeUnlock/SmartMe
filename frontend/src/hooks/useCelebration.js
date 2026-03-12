import { create } from "zustand";
import {
  CELEBRATION_PRIORITY,
  CELEBRATION_COOLDOWNS,
} from "../config/motionConfig";

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

const useCelebration = create((set, get) => ({
  active: null, // { type, id, options }
  _lastFired: {}, // { [type]: timestamp } for throttling

  celebrate(type, options = {}) {
    const now = Date.now();
    const current = get();

    // Throttle low-priority events
    const cooldown = CELEBRATION_COOLDOWNS[type] ?? 0;
    if (cooldown > 0) {
      const lastFired = current._lastFired[type] || 0;
      if (now - lastFired < cooldown) return;
    }

    // Priority check: don't interrupt higher-priority active celebration
    if (current.active) {
      const activePriority = CELEBRATION_PRIORITY[current.active.type] ?? 0;
      const newPriority = CELEBRATION_PRIORITY[type] ?? 0;
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
