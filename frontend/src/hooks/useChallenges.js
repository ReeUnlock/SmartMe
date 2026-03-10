import { create } from "zustand";
import useCelebration from "./useCelebration";
import {
  todayKey,
  weekKey,
  generateDailyChallenges,
  generateWeeklyChallenges,
  updateChallengeProgress,
  allCompleted,
  DAILY_COMPLETION_BONUS,
  WEEKLY_COMPLETION_BONUS,
} from "../utils/challengeEngine";

const STORAGE_KEY = "smartme_challenges";

function createInitialState() {
  const today = todayKey();
  const week = weekKey();
  return {
    daily: generateDailyChallenges(today),
    weekly: generateWeeklyChallenges(week),
    // Track which days the user was active this week (for active_day challenges)
    weekActiveDays: [],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const today = todayKey();
      const week = weekKey();

      // Regenerate daily if date changed
      let daily = parsed.daily;
      if (!daily || daily.date !== today) {
        daily = generateDailyChallenges(today);
      }

      // Regenerate weekly if week changed
      let weekly = parsed.weekly;
      let weekActiveDays = parsed.weekActiveDays || [];
      if (!weekly || weekly.weekKey !== week) {
        weekly = generateWeeklyChallenges(week);
        weekActiveDays = [];
      }

      return { daily, weekly, weekActiveDays };
    }
  } catch {}
  return createInitialState();
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

const useChallenges = create((set, get) => ({
  ...loadState(),

  // Toast queue for challenge completions
  _challengeToasts: [],

  /**
   * Ensure challenges are fresh for today/this week.
   */
  sync() {
    const current = get();
    const today = todayKey();
    const week = weekKey();
    let changed = false;
    let daily = current.daily;
    let weekly = current.weekly;
    let weekActiveDays = current.weekActiveDays;

    if (daily.date !== today) {
      daily = generateDailyChallenges(today);
      changed = true;
    }

    if (weekly.weekKey !== week) {
      weekly = generateWeeklyChallenges(week);
      weekActiveDays = [];
      changed = true;
    }

    if (changed) {
      const newState = { daily, weekly, weekActiveDays };
      saveState(newState);
      set(newState);
    }
  },

  /**
   * Track a challenge action.
   * @param {string} actionType - mood | affirmation | expense | goal_create | goal_complete
   * @param {Function} [addSparks] - callback to grant sparks
   */
  trackAction(actionType, addSparks) {
    const current = get();
    const toasts = [];

    // Update daily
    const dailyResult = updateChallengeProgress(current.daily.items, actionType);
    const newDaily = { ...current.daily, items: dailyResult.items };

    // Toast for each newly completed daily challenge
    for (const id of dailyResult.newlyCompleted) {
      const item = dailyResult.items.find((i) => i.id === id);
      if (item) {
        toasts.push({
          id: Date.now() + Math.random(),
          isChallengeComplete: true,
          title: item.title,
          icon: item.icon,
          sparks: 0, // sparks are granted on claim
          period: "daily",
        });
      }
    }

    // Update weekly
    const weeklyResult = updateChallengeProgress(current.weekly.items, actionType);
    const newWeekly = { ...current.weekly, items: weeklyResult.items };

    // Track active days for weekly active_day challenges
    let weekActiveDays = [...current.weekActiveDays];
    const today = todayKey();
    if (!weekActiveDays.includes(today)) {
      weekActiveDays.push(today);
      // Update active_day progress in weekly items
      const activeDayResult = updateActiveDayProgress(newWeekly.items, weekActiveDays.length);
      newWeekly.items = activeDayResult.items;
      for (const id of activeDayResult.newlyCompleted) {
        const item = activeDayResult.items.find((i) => i.id === id);
        if (item) {
          toasts.push({
            id: Date.now() + Math.random(),
            isChallengeComplete: true,
            title: item.title,
            icon: item.icon,
            sparks: 0,
            period: "weekly",
          });
        }
      }
    }

    // Toast for newly completed weekly challenges
    for (const id of weeklyResult.newlyCompleted) {
      const item = weeklyResult.items.find((i) => i.id === id);
      if (item) {
        toasts.push({
          id: Date.now() + Math.random(),
          isChallengeComplete: true,
          title: item.title,
          icon: item.icon,
          sparks: 0,
          period: "weekly",
        });
      }
    }

    // Check for all-daily-completed toast
    if (
      !current.daily.allCompletedClaimed &&
      !newDaily.allCompletedClaimed &&
      allCompleted(newDaily.items) &&
      !allCompleted(current.daily.items)
    ) {
      toasts.push({
        id: Date.now() + Math.random(),
        isAllComplete: true,
        period: "daily",
        title: "Wszystkie dzisiejsze wyzwania!",
        icon: "🌟",
        sparks: 0,
      });
    }

    // Check for all-weekly-completed toast
    if (
      !current.weekly.allCompletedClaimed &&
      !newWeekly.allCompletedClaimed &&
      allCompleted(newWeekly.items) &&
      !allCompleted(current.weekly.items)
    ) {
      toasts.push({
        id: Date.now() + Math.random(),
        isAllComplete: true,
        period: "weekly",
        title: "Cały tygodniowy zestaw!",
        icon: "👑",
        sparks: 0,
      });
    }

    // Trigger progress celebration for newly completed challenges
    const hasNewCompletion =
      dailyResult.newlyCompleted.length > 0 ||
      weeklyResult.newlyCompleted.length > 0;
    if (hasNewCompletion) {
      useCelebration.getState().celebrate("progress", { originY: 55 });
    }

    const newState = { daily: newDaily, weekly: newWeekly, weekActiveDays };
    saveState(newState);
    set({
      ...newState,
      _challengeToasts: [...current._challengeToasts, ...toasts],
    });
  },

  /**
   * Claim reward for a single challenge.
   */
  claimReward(challengeId, period, addSparks) {
    const current = get();
    const key = period === "daily" ? "daily" : "weekly";
    const challenges = current[key];

    let claimed = false;
    const updatedItems = challenges.items.map((item) => {
      if (item.id !== challengeId || !item.completed || item.claimed) return item;
      if (addSparks && item.reward > 0) addSparks(item.reward);
      claimed = true;
      return { ...item, claimed: true };
    });

    if (claimed) {
      useCelebration.getState().celebrate("reward", { originY: 60 });
    }

    const updated = { ...challenges, items: updatedItems };
    const newState = { ...current, [key]: updated };
    saveState(newState);
    set(newState);
  },

  /**
   * Claim the all-completed bonus for daily or weekly.
   */
  claimAllBonus(period, addSparks) {
    const current = get();
    const key = period === "daily" ? "daily" : "weekly";
    const challenges = current[key];

    if (challenges.allCompletedClaimed) return;
    if (!allCompleted(challenges.items)) return;

    const bonus = period === "daily" ? DAILY_COMPLETION_BONUS : WEEKLY_COMPLETION_BONUS;
    if (addSparks && bonus > 0) addSparks(bonus);
    useCelebration.getState().celebrate("reward", { originY: 40, intensity: 1.3 });

    const updated = { ...challenges, allCompletedClaimed: true };
    const newState = { ...current, [key]: updated };
    saveState(newState);
    set({
      ...newState,
      _challengeToasts: [
        ...current._challengeToasts,
        {
          id: Date.now() + Math.random(),
          isBonusClaim: true,
          period,
          title: period === "daily" ? "Bonus dzienny" : "Bonus tygodniowy",
          icon: period === "daily" ? "🌟" : "👑",
          sparks: bonus,
        },
      ],
    });
  },

  dismissChallengeToast(id) {
    set((s) => ({
      _challengeToasts: s._challengeToasts.filter((t) => t.id !== id),
    }));
  },
}));

/**
 * Update active_day type challenges with the current active day count.
 * This is different from regular progress — it sets progress to the count directly.
 */
function updateActiveDayProgress(items, activeDayCount) {
  const newlyCompleted = [];
  const updatedItems = items.map((item) => {
    if (item.type !== "active_day" || item.completed) return item;
    const isNowComplete = activeDayCount >= item.target;
    if (isNowComplete) newlyCompleted.push(item.id);
    return {
      ...item,
      progress: Math.min(activeDayCount, item.target),
      completed: isNowComplete,
    };
  });
  return { items: updatedItems, newlyCompleted };
}

export default useChallenges;
