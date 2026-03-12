import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(isoWeek);

// --- Challenge pool definitions ---

/**
 * Each challenge template:
 *   type → maps to progress key (affirmation, expense, goal_create, goal_complete, active_day)
 *   target → number to reach
 *   reward → bonus sparks
 *   title → Polish display text
 *   description → Polish description
 *   icon → emoji
 */

const DAILY_POOL = [
  {
    type: "affirmation",
    target: 1,
    reward: 8,
    title: "Słowo dnia",
    description: "Przeczytaj afirmację",
    icon: "🌸",
  },
  {
    type: "affirmation",
    target: 2,
    reward: 12,
    title: "Podwójna dawka",
    description: "Przeczytaj 2 afirmacje",
    icon: "💫",
  },
  {
    type: "expense",
    target: 1,
    reward: 8,
    title: "Świadomy wydatek",
    description: "Zapisz jeden wydatek",
    icon: "💰",
  },
  {
    type: "expense",
    target: 2,
    reward: 10,
    title: "Porządek w finansach",
    description: "Zapisz 2 wydatki",
    icon: "📊",
  },
  {
    type: "goal_create",
    target: 1,
    reward: 10,
    title: "Nowa wizja",
    description: "Dodaj nowy cel",
    icon: "🎯",
  },
  {
    type: "goal_complete",
    target: 1,
    reward: 12,
    title: "Cel osiągnięty",
    description: "Ukończ jeden cel",
    icon: "🏆",
  },
];

const WEEKLY_POOL = [
  {
    type: "affirmation",
    target: 4,
    reward: 35,
    title: "Siła słów",
    description: "Przeczytaj 4 afirmacje",
    icon: "🌸",
  },
  {
    type: "affirmation",
    target: 7,
    reward: 50,
    title: "Afirmacja na każdy dzień",
    description: "Przeczytaj 7 afirmacji",
    icon: "💫",
  },
  {
    type: "expense",
    target: 5,
    reward: 35,
    title: "Budżetowy tydzień",
    description: "Zapisz 5 wydatków",
    icon: "💎",
  },
  {
    type: "expense",
    target: 10,
    reward: 50,
    title: "Finansowa dyscyplina",
    description: "Zapisz 10 wydatków",
    icon: "📊",
  },
  {
    type: "goal_create",
    target: 2,
    reward: 35,
    title: "Dwie nowe drogi",
    description: "Dodaj 2 cele",
    icon: "🎯",
  },
  {
    type: "goal_complete",
    target: 2,
    reward: 50,
    title: "Podwójne osiągnięcie",
    description: "Ukończ 2 cele",
    icon: "🏆",
  },
  {
    type: "active_day",
    target: 4,
    reward: 35,
    title: "Aktywny tydzień",
    description: "Bądź aktywna przez 4 dni",
    icon: "🔥",
  },
  {
    type: "active_day",
    target: 6,
    reward: 50,
    title: "Prawie codziennie",
    description: "Bądź aktywna przez 6 dni",
    icon: "💪",
  },
];

const DAILY_COMPLETION_BONUS = 20;
const WEEKLY_COMPLETION_BONUS = 80;

// --- Date helpers ---

export function todayKey() {
  return dayjs().format("YYYY-MM-DD");
}

export function weekKey() {
  const d = dayjs();
  return `${d.isoWeekYear()}-W${String(d.isoWeek()).padStart(2, "0")}`;
}

// --- Seeded random (deterministic per day/week) ---

function seededRandom(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return function () {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return h / 0x7fffffff;
  };
}

/**
 * Pick N items from pool using deterministic seed, ensuring type diversity.
 */
function pickChallenges(pool, count, seed) {
  const rng = seededRandom(seed);

  // Shuffle pool deterministically
  const shuffled = [...pool]
    .map((item) => ({ item, sort: rng() }))
    .sort((a, b) => a.sort - b.sort)
    .map((x) => x.item);

  // Pick with type diversity — avoid picking 2 of the exact same type+target
  const picked = [];
  const usedKeys = new Set();

  for (const item of shuffled) {
    if (picked.length >= count) break;
    const key = `${item.type}_${item.target}`;
    if (usedKeys.has(key)) continue;
    // Also avoid too many of the same type
    const sameTypeCount = picked.filter((p) => p.type === item.type).length;
    if (sameTypeCount >= 2) continue;
    usedKeys.add(key);
    picked.push(item);
  }

  // Fallback if we didn't get enough
  for (const item of shuffled) {
    if (picked.length >= count) break;
    const key = `${item.type}_${item.target}`;
    if (!usedKeys.has(key)) {
      usedKeys.add(key);
      picked.push(item);
    }
  }

  return picked;
}

/**
 * Generate daily challenges for today.
 */
export function generateDailyChallenges(dateKey) {
  const templates = pickChallenges(DAILY_POOL, 3, `daily_${dateKey}`);
  return {
    date: dateKey,
    items: templates.map((t, i) => ({
      id: `d_${dateKey}_${t.type}_${t.target}_${i}`,
      type: t.type,
      target: t.target,
      progress: 0,
      reward: t.reward,
      completed: false,
      claimed: false,
      title: t.title,
      description: t.description,
      icon: t.icon,
    })),
    allCompletedClaimed: false,
  };
}

/**
 * Generate weekly challenges for this week.
 */
export function generateWeeklyChallenges(wKey) {
  const templates = pickChallenges(WEEKLY_POOL, 3, `weekly_${wKey}`);
  return {
    weekKey: wKey,
    items: templates.map((t, i) => ({
      id: `w_${wKey}_${t.type}_${t.target}_${i}`,
      type: t.type,
      target: t.target,
      progress: 0,
      reward: t.reward,
      completed: false,
      claimed: false,
      title: t.title,
      description: t.description,
      icon: t.icon,
    })),
    allCompletedClaimed: false,
  };
}

/**
 * Map action types to challenge types.
 */
const ACTION_TO_CHALLENGE_TYPE = {
  affirmation: "affirmation",
  expense: "expense",
  goal_create: "goal_create",
  goal_complete: "goal_complete",
  active_day: "active_day",
};

/**
 * Update challenge progress for a given action.
 * Returns { items, newlyCompleted[] }.
 */
export function updateChallengeProgress(items, actionType) {
  const challengeType = ACTION_TO_CHALLENGE_TYPE[actionType];
  if (!challengeType) return { items, newlyCompleted: [] };

  const newlyCompleted = [];
  const updatedItems = items.map((item) => {
    if (item.type !== challengeType || item.completed) return item;
    const newProgress = item.progress + 1;
    const isNowComplete = newProgress >= item.target;
    if (isNowComplete) newlyCompleted.push(item.id);
    return {
      ...item,
      progress: newProgress,
      completed: isNowComplete,
    };
  });

  return { items: updatedItems, newlyCompleted };
}

/**
 * Check if all items in a set are completed.
 */
export function allCompleted(items) {
  return items.length > 0 && items.every((i) => i.completed);
}

/**
 * Check if all items are claimed.
 */
export function allClaimed(items) {
  return items.length > 0 && items.every((i) => i.claimed);
}

export { DAILY_COMPLETION_BONUS, WEEKLY_COMPLETION_BONUS };
