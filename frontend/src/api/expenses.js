import { apiFetch } from "./client";

// ─── Expenses ───────────────────────────────────────────────

export function getExpenses({ year, month, category_id, paid_by_id } = {}) {
  const params = new URLSearchParams();
  if (year) params.set("year", year);
  if (month) params.set("month", month);
  if (category_id) params.set("category_id", category_id);
  if (paid_by_id) params.set("paid_by_id", paid_by_id);
  const qs = params.toString();
  return apiFetch(`/expenses/${qs ? `?${qs}` : ""}`);
}

export function getExpense(id) {
  return apiFetch(`/expenses/${id}`);
}

export function createExpense(data) {
  return apiFetch("/expenses/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateExpense(id, data) {
  return apiFetch(`/expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteExpense(id) {
  return apiFetch(`/expenses/${id}`, { method: "DELETE" });
}

// ─── Categories ─────────────────────────────────────────────

export function getExpenseCategories() {
  return apiFetch("/expenses/categories");
}

export function createExpenseCategory(data) {
  return apiFetch("/expenses/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Household Members ─────────────────────────────────────

export function getMembers() {
  return apiFetch("/expenses/members");
}

export function createMember(data) {
  return apiFetch("/expenses/members", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateMember(id, data) {
  return apiFetch(`/expenses/members/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteMember(id) {
  return apiFetch(`/expenses/members/${id}`, { method: "DELETE" });
}

// ─── Recurring Expenses ─────────────────────────────────────

export function getRecurring() {
  return apiFetch("/expenses/recurring/list");
}

export function createRecurring(data) {
  return apiFetch("/expenses/recurring", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateRecurring(id, data) {
  return apiFetch(`/expenses/recurring/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteRecurring(id) {
  return apiFetch(`/expenses/recurring/${id}`, { method: "DELETE" });
}

// ─── Budget ─────────────────────────────────────────────────

export function getBudget(year, month) {
  return apiFetch(`/expenses/budget/${year}/${month}`);
}

export function setBudget(year, month, data) {
  return apiFetch(`/expenses/budget/${year}/${month}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ─── Summary & Comparison ───────────────────────────────────

export function getSummary(year, month) {
  return apiFetch(`/expenses/summary/${year}/${month}`);
}

export function getComparison(year, month) {
  return apiFetch(`/expenses/comparison/${year}/${month}`);
}
