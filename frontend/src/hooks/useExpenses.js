import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getExpenses, createExpense, updateExpense, deleteExpense,
  getExpenseCategories,
  getMembers, createMember, updateMember, deleteMember,
  getRecurring, createRecurring, updateRecurring, deleteRecurring,
  getBudget, setBudget,
  getSummary, getComparison,
} from "../api/expenses";

const KEYS = {
  expenses: "expenses",
  categories: "expense-categories",
  members: "household-members",
  recurring: "recurring-expenses",
  budget: "expense-budget",
  summary: "expense-summary",
  comparison: "expense-comparison",
};

// ─── Expenses ───────────────────────────────────────────────

export function useExpenses(filters = {}) {
  return useQuery({
    queryKey: [KEYS.expenses, filters],
    queryFn: () => getExpenses(filters),
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEYS.expenses] });
      qc.invalidateQueries({ queryKey: [KEYS.summary] });
      qc.invalidateQueries({ queryKey: [KEYS.comparison] });
    },
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateExpense(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEYS.expenses] });
      qc.invalidateQueries({ queryKey: [KEYS.summary] });
      qc.invalidateQueries({ queryKey: [KEYS.comparison] });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEYS.expenses] });
      qc.invalidateQueries({ queryKey: [KEYS.summary] });
      qc.invalidateQueries({ queryKey: [KEYS.comparison] });
    },
  });
}

// ─── Categories ─────────────────────────────────────────────

export function useExpenseCategories() {
  return useQuery({
    queryKey: [KEYS.categories],
    queryFn: getExpenseCategories,
  });
}

// ─── Household Members ─────────────────────────────────────

export function useMembers() {
  return useQuery({
    queryKey: [KEYS.members],
    queryFn: getMembers,
  });
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createMember,
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.members] }),
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateMember(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.members] }),
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteMember,
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEYS.members] }),
  });
}

// ─── Recurring ──────────────────────────────────────────────

export function useRecurring() {
  return useQuery({
    queryKey: [KEYS.recurring],
    queryFn: getRecurring,
  });
}

export function useCreateRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createRecurring,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEYS.recurring] });
      qc.invalidateQueries({ queryKey: [KEYS.summary] });
    },
  });
}

export function useUpdateRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateRecurring(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEYS.recurring] });
      qc.invalidateQueries({ queryKey: [KEYS.summary] });
    },
  });
}

export function useDeleteRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteRecurring,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEYS.recurring] });
      qc.invalidateQueries({ queryKey: [KEYS.summary] });
    },
  });
}

// ─── Budget ─────────────────────────────────────────────────

export function useBudget(year, month) {
  return useQuery({
    queryKey: [KEYS.budget, year, month],
    queryFn: () => getBudget(year, month),
    enabled: !!year && !!month,
  });
}

export function useSetBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ year, month, data }) => setBudget(year, month, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEYS.budget] });
      qc.invalidateQueries({ queryKey: [KEYS.summary] });
    },
  });
}

// ─── Summary & Comparison ───────────────────────────────────

export function useSummary(year, month) {
  return useQuery({
    queryKey: [KEYS.summary, year, month],
    queryFn: () => getSummary(year, month),
    enabled: !!year && !!month,
  });
}

export function useComparison(year, month) {
  return useQuery({
    queryKey: [KEYS.comparison, year, month],
    queryFn: () => getComparison(year, month),
    enabled: !!year && !!month,
  });
}
