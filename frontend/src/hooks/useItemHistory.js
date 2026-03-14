import { create } from "zustand";
import { getUserStorage, setUserStorage } from "../utils/storage";

const STORAGE_KEY = "anelka_item_history";
const MAX_ITEMS = 100;

function loadHistory() {
  try {
    const raw = getUserStorage(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveHistory(history) {
  try {
    setUserStorage(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // ignore quota errors
  }
}

/**
 * Lightweight item usage history for future autocomplete/suggestions.
 *
 * Storage shape (keyed by normalized item name):
 * {
 *   "mleko": { count: 5, last: 1710000000000, category_id: 2 },
 *   "chleb tostowy": { count: 3, last: 1709900000000, category_id: 3 },
 * }
 *
 * - count: how many times the item was manually added
 * - last: timestamp of last use
 * - category_id: most recently used category (for future pre-fill)
 */
export const useItemHistory = create((set, get) => ({
  history: loadHistory(),

  /**
   * Record that an item was added (manually).
   * @param {string} name — item name (will be normalized)
   * @param {number|null} categoryId — category used
   */
  recordItem: (name, categoryId = null) => {
    if (!name?.trim()) return;

    const key = name.trim().toLowerCase();
    const current = get().history;
    const entry = current[key] || { count: 0, last: 0, category_id: null };

    const updated = {
      ...current,
      [key]: {
        count: entry.count + 1,
        last: Date.now(),
        category_id: categoryId ?? entry.category_id,
      },
    };

    // Prune if over limit: remove least-recently-used entries
    const keys = Object.keys(updated);
    if (keys.length > MAX_ITEMS) {
      const sorted = keys
        .map((k) => ({ key: k, last: updated[k].last }))
        .sort((a, b) => a.last - b.last);
      const toRemove = sorted.slice(0, keys.length - MAX_ITEMS);
      for (const { key: k } of toRemove) {
        delete updated[k];
      }
    }

    saveHistory(updated);
    set({ history: updated });
  },

  /**
   * Get top N most-used items, sorted by count (desc), then recency (desc).
   * @param {number} limit
   * @returns {Array<{name: string, count: number, category_id: number|null}>}
   */
  getTopItems: (limit = 20) => {
    const history = get().history;
    return Object.entries(history)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count || b.last - a.last)
      .slice(0, limit);
  },
}));
