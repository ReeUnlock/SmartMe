import { create } from "zustand";

const MAX_UNDO = 5;

/**
 * Expense undo store.
 *
 * Action types:
 *   { type: "create", expense }        — undo = delete expense.id
 *   { type: "delete", expense }        — undo = re-create from expense data
 *   { type: "update", expense, prev }  — undo = update with prev data
 */
const useExpenseUndo = create((set) => ({
  stack: [],

  push(action) {
    set((s) => ({
      stack: [action, ...s.stack].slice(0, MAX_UNDO),
    }));
  },

  pop() {
    let top = null;
    set((s) => {
      if (s.stack.length === 0) return s;
      [top] = s.stack;
      return { stack: s.stack.slice(1) };
    });
    return top;
  },

  clear() {
    set({ stack: [] });
  },
}));

export default useExpenseUndo;
