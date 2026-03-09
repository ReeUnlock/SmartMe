import { create } from "zustand";

const MAX_HISTORY = 3;

/**
 * Undo/redo history for calendar events.
 * Each entry stores: { type: "create"|"update"|"delete", eventData, previousData? }
 */
export const useEventHistory = create((set, get) => ({
  past: [],      // stack of actions (max 3)
  future: [],    // stack for redo

  pushAction: (action) =>
    set((state) => ({
      past: [...state.past, action].slice(-MAX_HISTORY),
      future: [],
    })),

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  popUndo: () => {
    const { past } = get();
    if (past.length === 0) return null;
    const action = past[past.length - 1];
    set((state) => ({
      past: state.past.slice(0, -1),
      future: [...state.future, action].slice(-MAX_HISTORY),
    }));
    return action;
  },

  popRedo: () => {
    const { future } = get();
    if (future.length === 0) return null;
    const action = future[future.length - 1];
    set((state) => ({
      future: state.future.slice(0, -1),
      past: [...state.past, action].slice(-MAX_HISTORY),
    }));
    return action;
  },
}));
