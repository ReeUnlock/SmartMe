import { create } from "zustand";
import { getUserStorage, setUserStorage } from "../utils/storage";

const STORAGE_KEY = "anelka_shopping_templates";
const MAX_TEMPLATES = 20;

function loadTemplates() {
  try {
    const raw = getUserStorage(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTemplates(templates) {
  try {
    setUserStorage(STORAGE_KEY, JSON.stringify(templates));
  } catch {
    // ignore quota errors
  }
}

/**
 * Shopping list templates store.
 *
 * Template shape:
 * {
 *   id: string,
 *   name: string,          — template display name (e.g. "Tygodniowe zakupy")
 *   store_name: string|null,
 *   items: [{ name, quantity, unit, category_id }],
 *   created_at: number,    — timestamp
 * }
 */
export const useShoppingTemplates = create((set, get) => ({
  templates: loadTemplates(),

  /**
   * Save a template from an existing list's items.
   * Only saves unchecked items by default. Returns false if no items to save.
   * @param {string} name — template name
   * @param {Array} items — array of item objects (name, quantity, unit, category_id, is_checked)
   * @param {string|null} storeName — optional store context
   * @returns {boolean} whether the template was saved
   */
  saveTemplate: (name, items, storeName = null) => {
    if (!name?.trim() || !items?.length) return false;

    const existing = get().templates;
    // Don't duplicate by name
    if (existing.some((t) => t.name === name.trim())) return false;

    // Only save unchecked items — checked items are "done" and not useful in templates
    const uncheckedItems = items.filter((i) => !i.is_checked);
    if (uncheckedItems.length === 0) return false;

    const template = {
      id: Date.now().toString(36),
      name: name.trim(),
      store_name: storeName || null,
      items: uncheckedItems.map(({ name: n, quantity, unit, category_id }) => ({
        name: n,
        quantity: quantity || null,
        unit: unit || null,
        category_id: category_id || null,
      })),
      created_at: Date.now(),
    };

    const updated = [...existing, template].slice(-MAX_TEMPLATES);
    saveTemplates(updated);
    set({ templates: updated });
    return true;
  },

  removeTemplate: (id) => {
    const updated = get().templates.filter((t) => t.id !== id);
    saveTemplates(updated);
    set({ templates: updated });
  },
}));
