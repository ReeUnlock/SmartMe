// ─── Shared item input parsing ─────────────────────────────────
// Parses strings like "2 kg ziemniaki", "3 szt jabłka", "1 l mleko"

export function parseItemInput(input) {
  const match = input.match(/^(\d+[.,]?\d*)\s*(kg|g|l|ml|szt|x|op|opak)?\s+(.+)$/i);
  if (match) {
    return {
      quantity: parseFloat(match[1].replace(",", ".")),
      unit: match[2]?.toLowerCase() || "szt",
      name: match[3],
    };
  }
  return { name: input, quantity: null, unit: null };
}

// ─── Weighted auto-categorization ──────────────────────────────
// Each keyword has a weight (1–3). Higher weight = more specific match.
//   3 = exact/highly specific (e.g. "jogurt" → Nabiał)
//   2 = strong stem match (e.g. "jabłk" → Owoce)
//   1 = weak/ambiguous (e.g. "woda" could be Napoje or Chemia)
// Multi-word keywords get a bonus for specificity.
// Category names must match the default categories from the backend.

const CATEGORY_RULES = [
  {
    category: "Owoce i warzywa",
    keywords: [
      // Fruits — high confidence
      { kw: "jabłk", w: 3 }, { kw: "banan", w: 3 }, { kw: "pomarańcz", w: 3 },
      { kw: "cytryn", w: 3 }, { kw: "grejpfrut", w: 3 }, { kw: "mandarynk", w: 3 },
      { kw: "kiwi", w: 3 }, { kw: "truskawk", w: 3 }, { kw: "maliny", w: 3 },
      { kw: "jagod", w: 3 }, { kw: "borówk", w: 3 }, { kw: "winogrono", w: 3 },
      { kw: "gruszk", w: 3 }, { kw: "śliwk", w: 3 }, { kw: "brzoskwini", w: 3 },
      { kw: "nektaryn", w: 3 }, { kw: "arbuz", w: 3 }, { kw: "melon", w: 3 },
      { kw: "ananas", w: 3 }, { kw: "mango", w: 3 }, { kw: "awokado", w: 3 },
      // Vegetables — high confidence
      { kw: "pomidor", w: 3 }, { kw: "ogórek", w: 3 }, { kw: "ziemniak", w: 3 },
      { kw: "marchew", w: 3 }, { kw: "cebul", w: 3 }, { kw: "czosnek", w: 3 },
      { kw: "kapust", w: 3 }, { kw: "brokuł", w: 3 }, { kw: "kalafior", w: 3 },
      { kw: "szpinak", w: 3 }, { kw: "groszek", w: 3 }, { kw: "fasol", w: 3 },
      { kw: "cukin", w: 3 }, { kw: "bakłażan", w: 3 }, { kw: "rzodkiew", w: 3 },
      { kw: "burak", w: 3 }, { kw: "seler", w: 2 }, { kw: "dyni", w: 3 },
      { kw: "papryk", w: 3 }, { kw: "pieczark", w: 3 }, { kw: "grzyb", w: 2 },
      // Herbs & greens
      { kw: "sałat", w: 3 }, { kw: "pietruszk", w: 3 }, { kw: "koper", w: 2 },
      { kw: "szczypior", w: 3 }, { kw: "natk", w: 2 }, { kw: "por", w: 2 },
      { kw: "rukola", w: 3 }, { kw: "bazylia", w: 3 },
      // Generic
      { kw: "owoce", w: 3 }, { kw: "warzywa", w: 3 }, { kw: "oliwk", w: 2 },
    ],
  },
  {
    category: "Nabiał",
    keywords: [
      { kw: "mleko", w: 3 }, { kw: "mlek", w: 3 },
      { kw: "jogurt", w: 3 }, { kw: "kefir", w: 3 },
      { kw: "śmietan", w: 3 }, { kw: "masło", w: 3 }, { kw: "masł", w: 3 },
      { kw: "serek", w: 3 }, { kw: "twaróg", w: 3 }, { kw: "twarożek", w: 3 },
      { kw: "mozzarell", w: 3 }, { kw: "ricotta", w: 3 },
      { kw: "parmezan", w: 3 }, { kw: "gouda", w: 3 }, { kw: "cheddar", w: 3 },
      { kw: "camembert", w: 3 }, { kw: "feta", w: 3 }, { kw: "brie", w: 3 },
      { kw: "jajk", w: 3 }, { kw: "jajec", w: 3 }, { kw: "jaj", w: 2 },
      { kw: "kremówk", w: 2 },
      // "ser" is tricky — could match "serwetki". Use word-boundary-aware match.
      { kw: "ser ", w: 3 }, { kw: "ser\u00f3w", w: 3 }, // serów
      { kw: "bez laktozy", w: 2 },
    ],
  },
  {
    category: "Pieczywo",
    keywords: [
      { kw: "chleb", w: 3 }, { kw: "bułk", w: 3 }, { kw: "bagietk", w: 3 },
      { kw: "croissant", w: 3 }, { kw: "rogal", w: 3 }, { kw: "kajzerk", w: 3 },
      { kw: "tortill", w: 3 }, { kw: "pita", w: 2 }, { kw: "chałk", w: 3 },
      { kw: "drożdżów", w: 3 }, { kw: "pieczywo", w: 3 }, { kw: "graham", w: 3 },
      { kw: "tostow", w: 3 }, { kw: "tost", w: 2 },
      { kw: "wafle ryżow", w: 3 },
    ],
  },
  {
    category: "Mięso i ryby",
    keywords: [
      { kw: "kurczak", w: 3 }, { kw: "pierś kurczak", w: 3 },
      { kw: "udko", w: 3 }, { kw: "skrzydełk", w: 3 },
      { kw: "indyk", w: 3 }, { kw: "wołowin", w: 3 },
      { kw: "wieprzow", w: 3 }, { kw: "mielon", w: 3 },
      { kw: "karkówk", w: 3 }, { kw: "schab", w: 3 }, { kw: "polędwic", w: 3 },
      { kw: "boczek", w: 3 },
      { kw: "kiełbas", w: 3 }, { kw: "parówk", w: 3 }, { kw: "szynk", w: 3 },
      { kw: "salami", w: 3 }, { kw: "kabanos", w: 3 },
      { kw: "łosoś", w: 3 }, { kw: "dorsz", w: 3 }, { kw: "tuńczyk", w: 3 },
      { kw: "krewetk", w: 3 }, { kw: "śledź", w: 3 }, { kw: "makrela", w: 3 },
      { kw: "ryba", w: 3 }, { kw: "mięso", w: 3 }, { kw: "mięs", w: 2 },
      { kw: "wędlin", w: 3 }, { kw: "pierś", w: 2 },
    ],
  },
  {
    category: "Napoje",
    keywords: [
      { kw: "cola", w: 3 }, { kw: "pepsi", w: 3 }, { kw: "fanta", w: 3 },
      { kw: "sprite", w: 3 }, { kw: "napój", w: 3 },
      { kw: "piwo", w: 3 }, { kw: "wino", w: 3 }, { kw: "wódka", w: 3 },
      { kw: "whisky", w: 3 }, { kw: "szampan", w: 3 },
      { kw: "kawa", w: 3 }, { kw: "herbat", w: 3 },
      { kw: "sok", w: 2 }, { kw: "woda", w: 2 },
      { kw: "energetyk", w: 3 }, { kw: "red bull", w: 3 },
      { kw: "kompot", w: 3 }, { kw: "nektar", w: 2 }, { kw: "lemoniada", w: 3 },
      { kw: "tonic", w: 3 }, { kw: "kakao", w: 2 },
      // Multi-word specifics — high confidence
      { kw: "woda mineraln", w: 3 }, { kw: "woda gazowan", w: 3 },
      { kw: "woda niegazowan", w: 3 },
      { kw: "sok pomarańcz", w: 3 }, { kw: "sok jabłk", w: 3 },
    ],
  },
  {
    category: "Chemia",
    keywords: [
      // Multi-word phrases — very high confidence
      { kw: "płyn do", w: 3 }, { kw: "proszek do", w: 3 },
      { kw: "żel pod prysznic", w: 3 }, { kw: "pasta do", w: 3 },
      { kw: "nić dent", w: 3 }, { kw: "papier toalet", w: 3 },
      { kw: "ręcznik papier", w: 3 }, { kw: "worki na śmiec", w: 3 },
      // Single-word strong
      { kw: "szampon", w: 3 }, { kw: "odżywk", w: 2 }, { kw: "mydło", w: 3 },
      { kw: "dezodorant", w: 3 }, { kw: "szczoteczk", w: 3 },
      { kw: "odplamiacz", w: 3 }, { kw: "wybielacz", w: 3 },
      { kw: "chusteczk", w: 2 }, { kw: "gąbk", w: 2 },
      { kw: "ściereczk", w: 3 }, { kw: "folia", w: 2 }, { kw: "aluminiow", w: 2 },
      { kw: "zmywak", w: 3 }, { kw: "serwetk", w: 3 },
      { kw: "pranie", w: 3 }, { kw: "płukania", w: 3 },
      { kw: "tabletk do zmywark", w: 3 }, { kw: "kapsułk", w: 2 },
    ],
  },
  {
    category: "Przekąski",
    keywords: [
      { kw: "chips", w: 3 }, { kw: "czips", w: 3 },
      { kw: "paluszk", w: 3 }, { kw: "orzech", w: 3 }, { kw: "orzeszk", w: 3 },
      { kw: "krakers", w: 3 }, { kw: "ciastk", w: 3 }, { kw: "herbatnik", w: 3 },
      { kw: "baton", w: 2 }, { kw: "wafle", w: 2 },
      { kw: "cukierk", w: 3 }, { kw: "żelk", w: 3 }, { kw: "draże", w: 3 },
      { kw: "popcorn", w: 3 }, { kw: "nachos", w: 3 }, { kw: "precel", w: 3 },
      { kw: "mieszanka studenc", w: 3 },
      // Multi-word specifics
      { kw: "baton proteinow", w: 3 }, { kw: "baton energetyczn", w: 3 },
      { kw: "czekolad", w: 2 }, // could be Napoje (kakao/czekolada do picia)
    ],
  },
];

// Minimum total score to accept a categorization
const MIN_SCORE = 2;

/**
 * Get the "Inne" fallback category ID from the categories list.
 */
export function getInneCategoryId(categories) {
  if (!categories?.length) return null;
  const inne = categories.find((c) => c.name === "Inne");
  return inne?.id ?? null;
}

/**
 * Infer the best category ID for an item name using weighted scoring.
 * Falls back to "Inne" category when no confident match is found.
 *
 * @param {string} itemName - The item name to categorize
 * @param {Array<{id: number, name: string}>} categories - Available categories from backend
 * @returns {number|null} category_id (always returns a value if categories are loaded)
 */
export function inferCategoryId(itemName, categories) {
  const fallback = getInneCategoryId(categories);
  if (!itemName || !categories?.length) return fallback;

  const lower = itemName.toLowerCase();

  // Build a map from category name → category id
  const catIdMap = new Map();
  for (const cat of categories) {
    catIdMap.set(cat.name, cat.id);
  }

  // Score each category
  const scores = new Map();

  for (const rule of CATEGORY_RULES) {
    const catId = catIdMap.get(rule.category);
    if (!catId) continue;

    let score = 0;
    for (const { kw, w } of rule.keywords) {
      if (lower.includes(kw)) {
        // Multi-word keywords get a specificity bonus
        const bonus = kw.includes(" ") ? 1 : 0;
        score += w + bonus;
      }
    }

    if (score > 0) {
      scores.set(catId, score);
    }
  }

  if (scores.size === 0) return fallback;

  // Find the best category
  let bestId = null;
  let bestScore = 0;
  let tied = false;

  for (const [catId, score] of scores) {
    if (score > bestScore) {
      bestScore = score;
      bestId = catId;
      tied = false;
    } else if (score === bestScore) {
      tied = true;
    }
  }

  // Reject if score too low or ambiguous tie — use fallback
  if (bestScore < MIN_SCORE || tied) return fallback;

  return bestId;
}
