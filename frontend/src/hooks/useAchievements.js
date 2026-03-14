import { create } from "zustand";
import {
  checkAchievements,
  getAchievementSparks,
  getAchievement,
  checkLevelMilestones,
  LEVEL_MILESTONES,
} from "../utils/achievementEngine";
import { playSound } from "../utils/soundManager";
import useCelebration from "./useCelebration";
import { getUserStorage, setUserStorage } from "../utils/storage";
import { patchRewards } from "../api/rewards";
import { debounce } from "../utils/debounce";

const STORAGE_KEY = "smartme_achievements";

function createInitialState() {
  return {
    unlocked: [],
    progress: {
      affirmations_read: 0,
      max_streak: 0,
      expenses_logged: 0,
      goals_created: 0,
      goals_completed: 0,
    },
    unlockedFeatures: {
      affirmationAnimations: ["sparkles"],
      cloudThemes: ["default"],
    },
    lastCheckedLevel: 1,
  };
}

function loadState() {
  try {
    const raw = getUserStorage(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...createInitialState(), ...parsed };
    }
  } catch {}
  return createInitialState();
}

function saveState(state) {
  try {
    setUserStorage(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function getAchievementsPayload(state) {
  return {
    unlocked: state.unlocked,
    progress: state.progress,
    unlockedFeatures: state.unlockedFeatures,
    lastCheckedLevel: state.lastCheckedLevel,
  };
}

const syncAchievementsToServer = debounce((state) => {
  patchRewards({ achievements: getAchievementsPayload(state) }).catch(() => {});
}, 800);

const useAchievements = create((set, get) => ({
  ...loadState(),

  // Queue for achievement celebration toasts
  _achievementToasts: [],

  /**
   * Track a progress event. Automatically checks for new achievements.
   * @param {string} key - progress key (e.g. "expenses_logged", "goals_created")
   * @param {number} [increment=1] - how much to increment
   * @param {Function} [addSparks] - callback to add bonus sparks (from useRewards)
   */
  trackProgress(key, increment = 1, addSparks) {
    const current = get();
    const newProgress = {
      ...current.progress,
      [key]: (current.progress[key] || 0) + increment,
    };

    // Check for new achievements
    const newlyUnlocked = checkAchievements(newProgress, current.unlocked);
    const newUnlockedList = [...current.unlocked, ...newlyUnlocked];

    // Build toasts for newly unlocked achievements
    const toasts = newlyUnlocked.map((id) => {
      const achievement = getAchievement(id);
      return {
        id: Date.now() + Math.random(),
        achievementId: id,
        title: achievement?.title || id,
        icon: achievement?.icon || "🏅",
        sparks: getAchievementSparks(id),
      };
    });

    // Grant bonus sparks for each unlocked achievement
    if (addSparks) {
      for (const id of newlyUnlocked) {
        const bonus = getAchievementSparks(id);
        if (bonus > 0) addSparks(bonus);
      }
    }

    // Trigger celebration animation for new achievements
    if (newlyUnlocked.length > 0) {
      useCelebration.getState().celebrate("achievement", { originY: 30 });
      playSound("achievementUnlocked");
    }

    const newState = {
      progress: newProgress,
      unlocked: newUnlockedList,
    };
    const merged = { ...current, ...newState, _achievementToasts: undefined };
    saveState(merged);
    syncAchievementsToServer(merged);
    set({
      ...newState,
      _achievementToasts: [...current._achievementToasts, ...toasts],
    });
  },

  /**
   * Update max streak if current streak is higher.
   */
  updateMaxStreak(streakDays) {
    const current = get();
    if (streakDays <= (current.progress.max_streak || 0)) return;

    const newProgress = {
      ...current.progress,
      max_streak: streakDays,
    };

    // Check for streak achievements
    const newlyUnlocked = checkAchievements(newProgress, current.unlocked);
    const newUnlockedList = [...current.unlocked, ...newlyUnlocked];

    const toasts = newlyUnlocked.map((id) => {
      const achievement = getAchievement(id);
      return {
        id: Date.now() + Math.random(),
        achievementId: id,
        title: achievement?.title || id,
        icon: achievement?.icon || "🏅",
        sparks: getAchievementSparks(id),
      };
    });

    const newState = {
      progress: newProgress,
      unlocked: newUnlockedList,
    };
    const merged2 = { ...current, ...newState, _achievementToasts: undefined };
    saveState(merged2);
    syncAchievementsToServer(merged2);
    set({
      ...newState,
      _achievementToasts: [...current._achievementToasts, ...toasts],
    });
  },

  /**
   * Check level milestones and unlock features.
   */
  checkLevelRewards(level) {
    const current = get();
    if (level <= current.lastCheckedLevel) return;

    const newFeatures = checkLevelMilestones(level, current.unlockedFeatures);
    if (newFeatures.length === 0) {
      const updated = { ...current, lastCheckedLevel: level, _achievementToasts: undefined };
      saveState(updated);
      syncAchievementsToServer(updated);
      set({ lastCheckedLevel: level });
      return;
    }

    // Merge new features
    const updatedFeatures = { ...current.unlockedFeatures };
    const toasts = [];
    for (const feature of newFeatures) {
      const arr = updatedFeatures[feature.feature] || [];
      if (!arr.includes(feature.value)) {
        updatedFeatures[feature.feature] = [...arr, feature.value];
        toasts.push({
          id: Date.now() + Math.random(),
          isFeatureUnlock: true,
          title: feature.label,
          icon: "🎁",
          sparks: 0,
        });
      }
    }

    const newState = {
      unlockedFeatures: updatedFeatures,
      lastCheckedLevel: level,
    };
    const merged3 = { ...current, ...newState, _achievementToasts: undefined };
    saveState(merged3);
    syncAchievementsToServer(merged3);
    set({
      ...newState,
      _achievementToasts: [...current._achievementToasts, ...toasts],
    });
  },

  /**
   * Run initial check — unlocks any achievements whose conditions are already met.
   */
  initialCheck(addSparks) {
    const current = get();
    const newlyUnlocked = checkAchievements(current.progress, current.unlocked);
    if (newlyUnlocked.length === 0) return;

    const newUnlockedList = [...current.unlocked, ...newlyUnlocked];

    if (addSparks) {
      for (const id of newlyUnlocked) {
        const bonus = getAchievementSparks(id);
        if (bonus > 0) addSparks(bonus);
      }
    }

    const toasts = newlyUnlocked.map((id) => {
      const achievement = getAchievement(id);
      return {
        id: Date.now() + Math.random(),
        achievementId: id,
        title: achievement?.title || id,
        icon: achievement?.icon || "🏅",
        sparks: getAchievementSparks(id),
      };
    });

    const newState = { unlocked: newUnlockedList };
    const merged4 = { ...current, ...newState, _achievementToasts: undefined };
    saveState(merged4);
    syncAchievementsToServer(merged4);
    set({
      ...newState,
      _achievementToasts: [...current._achievementToasts, ...toasts],
    });
  },

  dismissAchievementToast(id) {
    set((s) => ({
      _achievementToasts: s._achievementToasts.filter((t) => t.id !== id),
    }));
  },

  // Hydrate store from server data
  hydrate(data) {
    if (!data || typeof data !== "object") return;
    const hydrated = {
      unlocked: data.unlocked ?? [],
      progress: { ...createInitialState().progress, ...(data.progress || {}) },
      unlockedFeatures: { ...createInitialState().unlockedFeatures, ...(data.unlockedFeatures || {}) },
      lastCheckedLevel: data.lastCheckedLevel ?? 1,
    };
    saveState(hydrated);
    set(hydrated);
  },
}));

export default useAchievements;
