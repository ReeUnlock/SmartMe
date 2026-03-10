/**
 * Achievement Engine — Phase 2 of SmartMe Reward System
 *
 * Achievements unlock automatically when conditions are met.
 * Each achievement grants bonus sparks and triggers a celebration toast.
 */

// --- Achievement definitions ---

export const ACHIEVEMENT_CATEGORIES = {
  selfcare: { label: "Dbanie o siebie", color: "lavender" },
  finance: { label: "Finanse", color: "peach" },
  growth: { label: "Rozwój", color: "rose" },
};

// tier → bonus sparks
const TIER_SPARKS = {
  small: 20,
  medium: 40,
  large: 80,
};

/**
 * Each achievement:
 *   id, category, tier, title, description, icon,
 *   check(progress) → boolean
 *   progressKey → key in progress object
 *   target → numeric target for progress display
 */
export const ACHIEVEMENTS = [
  // ── Self-care ──
  {
    id: "first_mood",
    category: "selfcare",
    tier: "small",
    title: "Pierwsza chwila dla siebie",
    description: "Zapisz swój nastrój po raz pierwszy",
    icon: "✨",
    progressKey: "moods_logged",
    target: 1,
    check: (p) => (p.moods_logged || 0) >= 1,
  },
  {
    id: "affirmation_reader_10",
    category: "selfcare",
    tier: "small",
    title: "Miłośniczka afirmacji",
    description: "Przeczytaj 10 afirmacji",
    icon: "🌸",
    progressKey: "affirmations_read",
    target: 10,
    check: (p) => (p.affirmations_read || 0) >= 10,
  },
  {
    id: "affirmation_reader_50",
    category: "selfcare",
    tier: "medium",
    title: "Słowa mocy",
    description: "Przeczytaj 50 afirmacji",
    icon: "💫",
    progressKey: "affirmations_read",
    target: 50,
    check: (p) => (p.affirmations_read || 0) >= 50,
  },
  {
    id: "seven_day_streak",
    category: "selfcare",
    tier: "medium",
    title: "Tydzień dla siebie",
    description: "Utrzymaj serię 7 dni z rzędu",
    icon: "🔥",
    progressKey: "max_streak",
    target: 7,
    check: (p) => (p.max_streak || 0) >= 7,
  },
  {
    id: "thirty_day_streak",
    category: "selfcare",
    tier: "large",
    title: "Mistrzyni rytuałów",
    description: "Utrzymaj serię 30 dni z rzędu",
    icon: "👑",
    progressKey: "max_streak",
    target: 30,
    check: (p) => (p.max_streak || 0) >= 30,
  },

  // ── Finance ──
  {
    id: "first_expense",
    category: "finance",
    tier: "small",
    title: "Pierwszy zapis",
    description: "Dodaj swój pierwszy wydatek",
    icon: "💰",
    progressKey: "expenses_logged",
    target: 1,
    check: (p) => (p.expenses_logged || 0) >= 1,
  },
  {
    id: "ten_expenses",
    category: "finance",
    tier: "small",
    title: "Świadome wydatki",
    description: "Zapisz 10 wydatków",
    icon: "📊",
    progressKey: "expenses_logged",
    target: 10,
    check: (p) => (p.expenses_logged || 0) >= 10,
  },
  {
    id: "fifty_expenses",
    category: "finance",
    tier: "medium",
    title: "Finansowa uważność",
    description: "Zapisz 50 wydatków",
    icon: "💎",
    progressKey: "expenses_logged",
    target: 50,
    check: (p) => (p.expenses_logged || 0) >= 50,
  },
  {
    id: "hundred_expenses",
    category: "finance",
    tier: "large",
    title: "Mistrzyni budżetu",
    description: "Zapisz 100 wydatków",
    icon: "🏆",
    progressKey: "expenses_logged",
    target: 100,
    check: (p) => (p.expenses_logged || 0) >= 100,
  },

  // ── Growth ──
  {
    id: "first_goal",
    category: "growth",
    tier: "small",
    title: "Pierwszy krok",
    description: "Dodaj swój pierwszy cel",
    icon: "🎯",
    progressKey: "goals_created",
    target: 1,
    check: (p) => (p.goals_created || 0) >= 1,
  },
  {
    id: "five_goals",
    category: "growth",
    tier: "small",
    title: "Buduję swoją drogę",
    description: "Dodaj 5 celów",
    icon: "🌱",
    progressKey: "goals_created",
    target: 5,
    check: (p) => (p.goals_created || 0) >= 5,
  },
  {
    id: "ten_goals",
    category: "growth",
    tier: "medium",
    title: "Realizatorka",
    description: "Dodaj 10 celów",
    icon: "🌟",
    progressKey: "goals_created",
    target: 10,
    check: (p) => (p.goals_created || 0) >= 10,
  },
  {
    id: "goals_completed_5",
    category: "growth",
    tier: "medium",
    title: "Kończę to, co zaczynam",
    description: "Ukończ 5 celów",
    icon: "🎉",
    progressKey: "goals_completed",
    target: 5,
    check: (p) => (p.goals_completed || 0) >= 5,
  },
  {
    id: "goals_completed_20",
    category: "growth",
    tier: "large",
    title: "Niezłomna",
    description: "Ukończ 20 celów",
    icon: "💪",
    progressKey: "goals_completed",
    target: 20,
    check: (p) => (p.goals_completed || 0) >= 20,
  },
];

// --- Level milestone definitions ---

export const LEVEL_MILESTONES = [
  {
    level: 3,
    feature: "affirmationAnimations",
    value: "hearts",
    label: "Nowa animacja afirmacji",
    description: "Serduszka",
  },
  {
    level: 5,
    feature: "avatarUnlock",
    value: "bloom",
    label: "Nowa posta\u0107: Bloom",
    description: "Kwiat afirmacji",
  },
  {
    level: 5,
    feature: "cloudThemes",
    value: "sunrise",
    label: "Nowy styl chmurki",
    description: "Wsch\u00f3d s\u0142o\u0144ca",
  },
  {
    level: 8,
    feature: "moodEmojis",
    value: "pastel",
    label: "Nowe emoji nastrojów",
    description: "Pastelowe",
  },
  {
    level: 10,
    feature: "avatarUnlock",
    value: "aura",
    label: "Nowa posta\u0107: Aura",
    description: "\u015awietlista kula energii",
  },
  {
    level: 10,
    feature: "specialBadge",
    value: "level10",
    label: "Odznaka specjalna",
    description: "Poziom 10",
  },
  {
    level: 15,
    feature: "affirmationPack",
    value: "premium",
    label: "Pakiet afirmacji",
    description: "Afirmacje premium",
  },
];

/**
 * Check all achievements against current progress.
 * Returns list of newly unlocked achievement IDs.
 */
export function checkAchievements(progress, alreadyUnlocked) {
  const unlockedSet = new Set(alreadyUnlocked || []);
  const newlyUnlocked = [];

  for (const achievement of ACHIEVEMENTS) {
    if (unlockedSet.has(achievement.id)) continue;
    if (achievement.check(progress)) {
      newlyUnlocked.push(achievement.id);
    }
  }

  return newlyUnlocked;
}

/**
 * Get bonus sparks for an achievement by ID.
 */
export function getAchievementSparks(achievementId) {
  const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
  if (!achievement) return 0;
  return TIER_SPARKS[achievement.tier] || 0;
}

/**
 * Get achievement definition by ID.
 */
export function getAchievement(id) {
  return ACHIEVEMENTS.find((a) => a.id === id) || null;
}

/**
 * Check level milestones and return newly unlocked features.
 */
export function checkLevelMilestones(level, unlockedFeatures) {
  const newFeatures = [];
  for (const milestone of LEVEL_MILESTONES) {
    if (level >= milestone.level) {
      const current = unlockedFeatures[milestone.feature] || [];
      if (!current.includes(milestone.value)) {
        newFeatures.push(milestone);
      }
    }
  }
  return newFeatures;
}
