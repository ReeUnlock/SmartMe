/**
 * SmartMe Motion Config — single source of truth for all animation tokens.
 *
 * Import from here instead of hardcoding easing, durations, z-index, or
 * celebration parameters across the codebase.
 */

// ─── Easing ──────────────────────────────────────────────────────
export const EASING = {
  /** Signature SmartMe ease — fast start, silky deceleration */
  out: "cubic-bezier(0.22, 1, 0.36, 1)",
  /** Standard ease for hover/active micro-interactions */
  standard: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  /** Overshoot bounce — for playful micro-feedback (scale pops) */
  bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  /** Linear — spinners, continuous rotation */
  linear: "linear",
};

// ─── Duration (ms) ───────────────────────────────────────────────
export const DURATION = {
  /** Micro-interaction: checkbox, toggle, button press */
  micro: 150,
  /** Fast: card enter, expand, collapse */
  fast: 200,
  /** Toast entrance/exit */
  toast: 350,
  /** Tab content switch */
  tab: 420,
  /** Page transition */
  page: 620,
  /** Avatar activate */
  activate: 900,
};

// CSS-compatible duration strings
export const DURATION_CSS = {
  micro: "150ms",
  fast: "200ms",
  toast: "350ms",
  tab: "420ms",
  page: "620ms",
  activate: "900ms",
};

// ─── Z-Index layers ──────────────────────────────────────────────
export const Z = {
  background: 0,
  content: 1,
  stickyControls: 10,
  bottomNav: 200,
  undoBar: 250,
  voiceFab: 300,
  dialogBackdrop: 400,
  dialogContent: 401,
  affirmationOverlay: 450,
  toast: 500,
  celebrationGlow: 599,
  celebrationParticle: 600,
};

// ─── Celebration presets ─────────────────────────────────────────
export const CELEBRATION_TYPES = {
  progress: {
    count: 3,
    duration: 500,
    glow: false,
    glowColor: "200,180,230",
    glowSize: 0,
    glowOpacity: 0,
    particleSpread: 40,
    particleSizeMin: 2,
    particleSizeMax: 3.5,
    particleOpacity: 0.5,
  },
  affirmation: {
    count: 6,
    duration: 800,
    glow: true,
    glowColor: "252,194,215",
    glowSize: 60,
    glowOpacity: 0.4,
    particleSpread: 70,
    particleSizeMin: 2.5,
    particleSizeMax: 5,
    particleOpacity: 0.7,
  },
  reward: {
    count: 10,
    duration: 1000,
    glow: true,
    glowColor: "253,208,177",
    glowSize: 100,
    glowOpacity: 0.55,
    particleSpread: 110,
    particleSizeMin: 3,
    particleSizeMax: 6,
    particleOpacity: 0.8,
  },
  achievement: {
    count: 14,
    duration: 1200,
    glow: true,
    glowColor: "252,194,215",
    glowSize: 120,
    glowOpacity: 0.6,
    particleSpread: 130,
    particleSizeMin: 3,
    particleSizeMax: 7,
    particleOpacity: 0.85,
  },
  levelup: {
    count: 20,
    duration: 1500,
    glow: true,
    glowColor: "249,145,94",
    glowSize: 180,
    glowOpacity: 0.7,
    particleSpread: 170,
    particleSizeMin: 3.5,
    particleSizeMax: 8,
    particleOpacity: 0.9,
  },
};

export const CELEBRATION_PALETTES = {
  progress: [
    "rgba(200,180,230,0.6)",
    "rgba(232,213,245,0.5)",
    "rgba(255,255,255,0.5)",
  ],
  affirmation: [
    "rgba(252,194,215,0.8)",
    "rgba(253,208,177,0.7)",
    "rgba(255,255,255,0.85)",
    "rgba(232,191,232,0.6)",
  ],
  reward: [
    "rgba(253,208,177,0.85)",
    "rgba(255,223,107,0.7)",
    "rgba(252,194,215,0.75)",
    "rgba(255,255,255,0.9)",
    "rgba(200,230,201,0.6)",
  ],
  achievement: [
    "rgba(252,194,215,0.9)",
    "rgba(232,191,232,0.8)",
    "rgba(255,255,255,0.9)",
    "rgba(253,208,177,0.7)",
    "rgba(255,223,107,0.65)",
  ],
  levelup: [
    "rgba(249,145,94,0.85)",
    "rgba(252,194,215,0.9)",
    "rgba(255,223,107,0.8)",
    "rgba(253,208,177,0.85)",
    "rgba(255,255,255,0.95)",
    "rgba(232,191,232,0.7)",
  ],
};

export const CELEBRATION_PRIORITY = {
  progress: 0,
  affirmation: 1,
  reward: 2,
  achievement: 3,
  levelup: 4,
};

export const CELEBRATION_COOLDOWNS = {
  progress: 3000,
  affirmation: 2000,
  reward: 1500,
  achievement: 0,
  levelup: 0,
};

// ─── Micro-feedback presets ──────────────────────────────────────
export const MICRO = {
  /** Checkbox / toggle completion */
  complete: {
    scale: [1, 1.2, 0.95, 1],
    duration: 350,
    easing: EASING.bounce,
  },
  /** Item added to list */
  add: {
    scale: [0.92, 1.04, 1],
    duration: 300,
    easing: EASING.out,
  },
  /** Button press depth */
  press: {
    scale: 0.95,
    duration: 120,
    easing: EASING.standard,
  },
  /** Soft pop for reward claim */
  pop: {
    scale: [1, 1.15, 0.97, 1],
    duration: 400,
    easing: EASING.bounce,
  },
  /** Gentle shake for error / validation */
  shake: {
    translateX: [0, -4, 4, -3, 3, 0],
    duration: 400,
    easing: EASING.out,
  },
};

// ─── Module motion themes ────────────────────────────────────────
export const MODULE_THEME = {
  dashboard: { accent: "rose", glow: "rgba(249,168,212,0.12)" },
  calendar: { accent: "sky", glow: "rgba(116,192,252,0.12)" },
  shopping: { accent: "sage", glow: "rgba(99,230,190,0.10)" },
  expenses: { accent: "peach", glow: "rgba(253,186,116,0.12)" },
  plans: { accent: "rose", glow: "rgba(250,162,193,0.10)" },
  chores: { accent: "lavender", glow: "rgba(177,151,252,0.10)" },
};

// ─── Ambient presets ─────────────────────────────────────────────
export const AMBIENT = {
  /** AppShell background blob drift */
  blobDrift: {
    duration: "25s",
    distance: "12px",
    scale: [0.97, 1.03],
  },
};

// ─── Safety ──────────────────────────────────────────────────────
/** Max time (ms) any DOM particle should live before forced cleanup */
export const PARTICLE_SAFETY_TIMEOUT = 5000;
