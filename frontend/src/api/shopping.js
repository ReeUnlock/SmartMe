import { apiFetch } from "./client";

// ─── Lists ─────────────────────────────────────────

export function getLists() {
  return apiFetch("/shopping/lists");
}

export function getList(id) {
  return apiFetch(`/shopping/lists/${id}`);
}

export function createList(data) {
  return apiFetch("/shopping/lists", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateList(id, data) {
  return apiFetch(`/shopping/lists/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteList(id) {
  return apiFetch(`/shopping/lists/${id}`, { method: "DELETE" });
}

// ─── Items ─────────────────────────────────────────

export function addItem(listId, data) {
  return apiFetch(`/shopping/lists/${listId}/items`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateItem(id, data) {
  return apiFetch(`/shopping/items/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function toggleItem(id) {
  return apiFetch(`/shopping/items/${id}/toggle`, { method: "PATCH" });
}

export function deleteItem(id) {
  return apiFetch(`/shopping/items/${id}`, { method: "DELETE" });
}

export function reorderItems(listId, items) {
  return apiFetch(`/shopping/lists/${listId}/reorder`, {
    method: "PUT",
    body: JSON.stringify(items),
  });
}

// ─── Categories ────────────────────────────────────

export function getCategories() {
  return apiFetch("/shopping/categories");
}

export function createCategory(data) {
  return apiFetch("/shopping/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Shopping → Expense bridge ─────────────────────

export function saveListAsExpense(listId, data) {
  return apiFetch(`/shopping/lists/${listId}/to-expense`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
