import { create } from "zustand";

const STORAGE_KEY = "smartme_sound_settings";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { enabled: true, volume: 0.5 };
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      enabled: state.enabled,
      volume: state.volume,
    }));
  } catch {}
}

const useSoundSettings = create((set, get) => ({
  ...loadState(),

  setEnabled(enabled) {
    set({ enabled });
    saveState(get());
  },

  setVolume(volume) {
    const clamped = Math.max(0, Math.min(1, volume));
    set({ volume: clamped });
    saveState(get());
  },

  toggle() {
    const next = !get().enabled;
    set({ enabled: next });
    saveState(get());
  },
}));

export default useSoundSettings;
