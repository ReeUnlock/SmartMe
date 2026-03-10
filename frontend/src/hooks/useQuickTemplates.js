import { create } from "zustand";

const STORAGE_KEY = "anelka_quick_templates";
const MAX_CUSTOM_TEMPLATES = 12;

function loadTemplates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTemplates(templates) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch {
    // ignore quota errors
  }
}

// Built-in template titles — skip these
const BUILTIN_TITLES = new Set(["Szpital", "Klinika", "Dzieci", "Trening", "Dy\u017cur", "Zejście", "Wolne"]);

export const useQuickTemplates = create((set, get) => ({
  templates: loadTemplates(),

  addTemplate: (eventData) => {
    const { title, color, icon, all_day, start_at, end_at } = eventData;
    if (!title || !title.trim()) return;

    // Don't duplicate built-in templates
    if (BUILTIN_TITLES.has(title.trim())) return;

    const existing = get().templates;
    // Don't add if already exists with the same title
    if (existing.some((t) => t.title === title.trim())) return;

    // Extract time from start_at / end_at
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
      custom: true,
    };

    const updated = [...existing, template].slice(-MAX_CUSTOM_TEMPLATES);
    saveTemplates(updated);
    set({ templates: updated });
  },

  removeTemplate: (id) => {
    const updated = get().templates.filter((t) => t.id !== id);
    saveTemplates(updated);
    set({ templates: updated });
  },
}));
