import { create } from "zustand";
import { grantReward, createInitialState, ensureDailyReset, calculateLevel } from "../utils/rewardEngine";
import { playSound } from "../utils/soundManager";
import useCelebration from "./useCelebration";
import useAvatarReaction from "./useAvatarReaction";
import { getUserStorage, setUserStorage } from "../utils/storage";
import { patchRewards } from "../api/rewards";
import { debounce } from "../utils/debounce";

const STORAGE_KEY = "smartme_rewards";

function loadState() {
  try {
    const raw = getUserStorage(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Re-sync level info from total sparks (safe if thresholds change)
      const levelInfo = calculateLevel(parsed.sparks || 0);
      // Migrate: drop old rewardedDates if present
      const { rewardedDates, ...rest } = parsed;
      return {
        ...createInitialState(),
        ...rest,
        level: levelInfo.level,
        xp: levelInfo.xp,
        xpToNextLevel: levelInfo.xpToNextLevel,
      };
    }
  } catch {}
  return createInitialState();
}

function saveState(state) {
  try {
    setUserStorage(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

const syncToServer = debounce((state) => {
  patchRewards({
    sparks: state.sparks,
    level: state.level,
    streak: state.streakDays ?? state.streak ?? 0,
    xp: state.xp,
    streak_last_date: state.lastActiveDate || null,
  }).catch(() => {});
}, 800);

const useRewards = create((set, get) => ({
  ...loadState(),

  // Toast queue — batched per action, not per reward line
  _toasts: [],

  reward(action) {
    const current = get();
    // Extract only persistent reward state (exclude store methods and toasts)
    const { reward: _, syncDaily: _s, dismissToast: _d, addBonusSparks: _a, hydrate: _h, _toasts, ...stateOnly } = current;
    const { newState, result } = grantReward(stateOnly, action);

    const toasts = [];
    if (result.granted && result.sparksGained > 0) {
      // Batch all sparks from a single action into one toast
      const parts = [];
      if (result.streakReward > 0) parts.push("Seria");
      if (result.superStreakReward > 0) parts.push("Super Seria");

      toasts.push({
        id: Date.now(),
        sparks: result.sparksGained,
        subtitle: parts.length > 0 ? parts.join(" + ") : null,
      });
      playSound("sparksGained");

      // Separate level-up toast (this one is special enough to stand alone)
      if (result.levelUp) {
        toasts.push({
          id: Date.now() + 1,
          sparks: 0,
          label: `Poziom ${result.newLevel}!`,
          isLevelUp: true,
        });
        useCelebration.getState().celebrate("levelup", { originY: 15 });
        useAvatarReaction.getState().react("level_up");
        playSound("levelUp");
      }
    }

    saveState(newState);
    set({ ...newState, _toasts: [...current._toasts, ...toasts] });
    syncToServer(newState);
    return result;
  },

  dismissToast(id) {
    set((s) => ({ _toasts: s._toasts.filter((t) => t.id !== id) }));
  },

  // Add bonus sparks (used by achievement system)
  addBonusSparks(amount) {
    const current = get();
    const { reward: _, syncDaily: _s, dismissToast: _d, addBonusSparks: _a, hydrate: _h, _toasts, ...stateOnly } = current;
    const newSparks = (stateOnly.sparks || 0) + amount;
    const levelInfo = calculateLevel(newSparks);
    const updated = {
      ...stateOnly,
      sparks: newSparks,
      level: levelInfo.level,
      xp: levelInfo.xp,
      xpToNextLevel: levelInfo.xpToNextLevel,
    };
    saveState(updated);
    set(updated);
    syncToServer(updated);
  },

  // Apply daily reset on app load without triggering toasts
  syncDaily() {
    const current = get();
    const { reward: _, syncDaily: _s, dismissToast: _d, addBonusSparks: _a, hydrate: _h, _toasts, ...stateOnly } = current;
    const synced = ensureDailyReset(stateOnly);
    if (synced !== stateOnly) {
      saveState(synced);
      set(synced);
      syncToServer(synced);
    }
  },

  // Hydrate store from server data
  hydrate(data) {
    const levelInfo = calculateLevel(data.sparks || 0);
    const hydrated = {
      sparks: data.sparks,
      level: levelInfo.level,
      xp: levelInfo.xp,
      xpToNextLevel: levelInfo.xpToNextLevel,
      streakDays: data.streak,
      lastActiveDate: data.streak_last_date,
    };
    saveState(hydrated);
    set(hydrated);
  },
}));

export default useRewards;
