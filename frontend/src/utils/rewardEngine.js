import dayjs from "dayjs";

// --- Level thresholds ---
// Each entry = sparks needed to advance from level N to N+1
const LEVEL_THRESHOLDS = [
  40, 60, 80, 110, 140, 180, 220, 260, 300, 350,     // 1→2 ... 10→11
  400, 450, 500, 550, 600, 650, 700, 760, 820, 900,   // 11→12 ... 20→21
  980, 1060, 1150, 1240, 1340, 1450, 1560, 1680, 1800, // 21→22 ... 29→30
];

/**
 * Calculate level, current XP, and XP-to-next from total sparks.
 * Beyond level 30, extrapolates with +150 per additional level.
 */
export function calculateLevel(totalSparks) {
  let level = 1;
  let remaining = totalSparks;

  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (remaining < LEVEL_THRESHOLDS[i]) {
      return { level, xp: remaining, xpToNextLevel: LEVEL_THRESHOLDS[i] };
    }
    remaining -= LEVEL_THRESHOLDS[i];
    level++;
  }

  // Beyond defined levels
  const lastThreshold = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  while (true) {
    const next = lastThreshold + (level - 30) * 150;
    if (remaining < next) {
      return { level, xp: remaining, xpToNextLevel: next };
    }
    remaining -= next;
    level++;
  }
}

// --- Date helpers ---
// All date comparisons use local calendar days to avoid timezone drift.

function todayStr() {
  return dayjs().format("YYYY-MM-DD");
}

/**
 * Cooldown check: returns true if fewer than `hours` have passed since `lastTime`.
 * Uses exact elapsed time (not calendar boundaries) for sub-day cooldowns.
 */
function isCooldownActive(lastTime, hours) {
  if (!lastTime) return false;
  return dayjs().diff(dayjs(lastTime), "hour", true) < hours;
}

// --- Daily reset ---
// Resets per-day caps (expense points, goal reward) when the calendar day changes.

export function ensureDailyReset(state) {
  const today = todayStr();
  if (state.lastDailyReset === today) return state;
  return {
    ...state,
    dailyExpensePoints: 0,
    dailyGoalRewardDate: null,
    lastDailyReset: today,
  };
}

// --- Streak logic ---
// Streak increments once per calendar day on the first rewarded action.
// Missing more than 1 calendar day resets the streak to 1.

export function processStreak(state) {
  const today = todayStr();
  const last = state.lastActiveDate;

  // Already counted today — no duplicate streak increment
  if (last === today) {
    return { state, streakReward: 0, superStreakReward: 0 };
  }

  let newStreak;
  if (!last) {
    newStreak = 1;
  } else {
    const diff = dayjs(today).diff(dayjs(last), "day");
    if (diff === 1) {
      newStreak = state.streakDays + 1;
    } else {
      // Skipped >1 day — reset streak
      newStreak = 1;
    }
  }

  let streakReward = 0;
  let superStreakReward = 0;

  // Phase 1 (days 1–10): +5 every day
  // Phase 2 (days 11–30): +18 every 2 days (at 12, 14, 16…)
  // Phase 3 (days 31+): +25 every 3 days (at 33, 36, 39…)
  if (newStreak <= 10) {
    streakReward = 5;
  } else if (newStreak <= 30) {
    if ((newStreak - 10) % 2 === 0) streakReward = 18;
  } else {
    if ((newStreak - 30) % 3 === 0) streakReward = 25;
  }

  // Super streak: +50 at every full 10 days (10, 20, 30, 40…).
  // We store only the last rewarded milestone to keep state compact.
  if (newStreak >= 10 && newStreak % 10 === 0) {
    const lastMilestone = state.lastSuperStreakMilestone || 0;
    if (newStreak > lastMilestone) {
      superStreakReward = 50;
      state = { ...state, lastSuperStreakMilestone: newStreak };
    }
  }

  // When streak resets, clear the milestone tracker so it can fire again
  if (newStreak === 1) {
    state = { ...state, lastSuperStreakMilestone: 0 };
  }

  return {
    state: {
      ...state,
      streakDays: newStreak,
      lastActiveDate: today,
    },
    streakReward,
    superStreakReward,
  };
}

// --- Reward rules ---

const REWARD_RULES = {
  mood: {
    sparks: 3,
    validate(state) {
      // 6-hour rolling cooldown
      if (isCooldownActive(state.lastMoodTime, 6)) {
        return { ok: false, reason: "cooldown" };
      }
      return { ok: true };
    },
    apply(state) {
      return { ...state, lastMoodTime: dayjs().toISOString() };
    },
  },

  affirmation: {
    sparks: 5,
    validate(state) {
      // 6-hour rolling cooldown
      if (isCooldownActive(state.lastAffirmationTime, 6)) {
        return { ok: false, reason: "cooldown" };
      }
      return { ok: true };
    },
    apply(state) {
      return { ...state, lastAffirmationTime: dayjs().toISOString() };
    },
  },

  expense_added: {
    sparks: 2,
    validate(state) {
      // Daily cap: max 10 points (= 5 rewarded expenses)
      if (state.dailyExpensePoints >= 10) {
        return { ok: false, reason: "daily_limit" };
      }
      return { ok: true };
    },
    apply(state) {
      return { ...state, dailyExpensePoints: state.dailyExpensePoints + 2 };
    },
  },

  goal_created: {
    sparks: 5,
    validate(state) {
      // Only first goal creation per calendar day is rewarded
      if (state.dailyGoalRewardDate === todayStr()) {
        return { ok: false, reason: "daily_limit" };
      }
      return { ok: true };
    },
    apply(state) {
      return { ...state, dailyGoalRewardDate: todayStr() };
    },
  },
};

/**
 * Process a reward action.
 *
 * @returns {{ newState: object, result: RewardResult }}
 *
 * RewardResult: {
 *   granted: boolean,
 *   sparksGained: number,  // total including streak bonuses
 *   actionSparks: number,  // base reward only
 *   reason: string,
 *   streakReward: number,
 *   superStreakReward: number,
 *   levelUp: boolean,
 *   newLevel: number | null,
 * }
 */
export function grantReward(rawState, action) {
  const rule = REWARD_RULES[action];
  const noResult = { granted: false, sparksGained: 0, actionSparks: 0, reason: "unknown_action", streakReward: 0, superStreakReward: 0, levelUp: false, newLevel: null };

  if (!rule) {
    return { newState: rawState, result: noResult };
  }

  // 1. Ensure daily counters are fresh
  let state = ensureDailyReset(rawState);

  // 2. Check eligibility (cooldown / daily limit)
  const validation = rule.validate(state);
  if (!validation.ok) {
    return {
      newState: state,
      result: { ...noResult, reason: validation.reason },
    };
  }

  // 3. Apply rule-specific state changes (timestamps, counters)
  state = rule.apply(state);

  // 4. Process streak (increments once per calendar day)
  const { state: streakState, streakReward, superStreakReward } = processStreak(state);
  state = streakState;

  // 5. Calculate total sparks and check for level-up
  const totalGained = rule.sparks + streakReward + superStreakReward;
  const oldLevel = calculateLevel(state.sparks).level;
  state = { ...state, sparks: state.sparks + totalGained };
  const newLevelInfo = calculateLevel(state.sparks);
  const levelUp = newLevelInfo.level > oldLevel;

  // 6. Sync derived level fields
  state = {
    ...state,
    level: newLevelInfo.level,
    xp: newLevelInfo.xp,
    xpToNextLevel: newLevelInfo.xpToNextLevel,
  };

  return {
    newState: state,
    result: {
      granted: true,
      sparksGained: totalGained,
      actionSparks: rule.sparks,
      reason: "granted",
      streakReward,
      superStreakReward,
      levelUp,
      newLevel: levelUp ? newLevelInfo.level : null,
    },
  };
}

/**
 * Create a fresh initial state.
 */
export function createInitialState() {
  return {
    sparks: 0,
    level: 1,
    xp: 0,
    xpToNextLevel: 40,
    streakDays: 0,
    lastActiveDate: null,
    lastMoodTime: null,
    lastAffirmationTime: null,
    dailyExpensePoints: 0,
    dailyGoalRewardDate: null,
    lastDailyReset: null,
    lastSuperStreakMilestone: 0,
  };
}
