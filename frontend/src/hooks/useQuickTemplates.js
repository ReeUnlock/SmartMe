import { create } from "zustand";
import { getUserStorage, setUserStorage } from "../utils/storage";

const STORAGE_KEY = "anelka_quick_templates";
const MAX_TEMPLATES = 12;

// Default starter templates — used on first launch
const DEFAULT_TEMPLATES = [
  { id: "d_szpital", label: "Szpital", title: "Szpital", icon: "hospital", color: "sky", startH: "08:00", endH: "15:30", allDay: false },
  { id: "d_klinika", label: "Klinika", title: "Klinika", icon: "stethoscope", color: "yellow", startH: "16:00", endH: "20:00", allDay: false },
  { id: "d_dzieci", label: "Dzieci", title: "Dzieci", icon: "baby", color: "peach", startH: "10:00", endH: "12:00", allDay: false },
  { id: "d_trening", label: "Trening", title: "Trening", icon: "gym", color: "lavender", startH: "18:00", endH: "19:30", allDay: false },
  { id: "d_dyzur", label: "Dy\u017cur", title: "Dy\u017cur", icon: "siren", color: "red", startH: "07:30", endH: "07:30", duration24: true, allDay: false },
  { id: "d_zejscie", label: "Zejście", title: "Zejście", icon: "coffee", color: "green", startH: "07:30", endH: "07:30", duration24: true, allDay: false },
  { id: "d_wolne", label: "Wolne", title: "Wolne", icon: "flower", color: "pink", startH: null, endH: null, allDay: true },
];

function loadTemplates() {
  try {
    const raw = getUserStorage(STORAGE_KEY);
    if (!raw) {
      // First launch — seed with defaults
      saveTemplates(DEFAULT_TEMPLATES);
      return DEFAULT_TEMPLATES;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      saveTemplates(DEFAULT_TEMPLATES);
      return DEFAULT_TEMPLATES;
    }

    // Empty stored array (old format user who never added customs) → seed defaults
    if (parsed.length === 0) {
      saveTemplates(DEFAULT_TEMPLATES);
      return DEFAULT_TEMPLATES;
    }

    // New unified format — at least one item has a d_ prefixed id
    if (parsed.some((t) => t.id && t.id.startsWith("d_"))) {
      return parsed;
    }

    // Old custom-only format — merge defaults + old customs, dedup by title
    const defaultTitles = new Set(DEFAULT_TEMPLATES.map((t) => t.title));
    const uniqueCustoms = parsed.filter((t) => !defaultTitles.has(t.title));
    const merged = [...DEFAULT_TEMPLATES, ...uniqueCustoms].slice(0, MAX_TEMPLATES);
    saveTemplates(merged);
    return merged;
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

function saveTemplates(templates) {
  try {
    setUserStorage(STORAGE_KEY, JSON.stringify(templates));
  } catch {
    // ignore quota errors
  }
}

export const useQuickTemplates = create((set, get) => ({
  templates: loadTemplates(),

  /** Add a new template (from EventFormDrawer template mode) */
  addTemplate: (eventData) => {
    const { title, color, icon, all_day, start_at, end_at } = eventData;
    if (!title || !title.trim()) return;

    const existing = get().templates;
    if (existing.length >= MAX_TEMPLATES) return;

    // Don't add if already exists with the same title
    if (existing.some((t) => t.title === title.trim())) return;

    let startH = null;
    let endH = null;
    if (!all_day && start_at) {
      const match = String(start_at).match(/T(\d{2}:\d{2})/);
      if (match) startH = match[1];
    }
    if (!all_day && end_at) {
      const match = String(end_at).match(/T(\d{2}:\d{2})/);
      if (match) endH = match[1];
    }

    const template = {
      id: Date.now().toString(36),
      label: title.trim(),
      title: title.trim(),
      color: color || "sky",
      icon: icon || null,
      startH,
      endH,
      allDay: !!all_day,
    };

    const updated = [...existing, template];
    saveTemplates(updated);
    set({ templates: updated });
  },

  /** Remove a template by id */
  removeTemplate: (id) => {
    const updated = get().templates.filter((t) => t.id !== id);
    saveTemplates(updated);
    set({ templates: updated });
  },

  /** Update a template (partial fields) */
  updateTemplate: (id, changes) => {
    const updated = get().templates.map((t) => {
      if (t.id !== id) return t;
      const merged = { ...t, ...changes };
      // Keep label in sync with title
      if (changes.title) merged.label = changes.title;
      if (changes.label) merged.title = changes.label;
      return merged;
    });
    saveTemplates(updated);
    set({ templates: updated });
  },

  /** Move a template up or down */
  reorderTemplate: (id, direction) => {
    const list = [...get().templates];
    const idx = list.findIndex((t) => t.id === id);
    if (idx < 0) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    [list[idx], list[targetIdx]] = [list[targetIdx], list[idx]];
    saveTemplates(list);
    set({ templates: list });
  },

  /** Replace all templates at once (used by editor save) */
  setTemplates: (templates) => {
    const capped = templates.slice(0, MAX_TEMPLATES);
    saveTemplates(capped);
    set({ templates: capped });
  },

  /** Reset to factory defaults */
  resetToDefaults: () => {
    saveTemplates(DEFAULT_TEMPLATES);
    set({ templates: DEFAULT_TEMPLATES });
  },
}));

export { MAX_TEMPLATES, DEFAULT_TEMPLATES };
