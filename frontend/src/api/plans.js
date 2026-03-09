import { apiFetch } from "./client";

// ─── Summary ──────────────────────────────────────

export function getPlansSummary() {
  return apiFetch("/plans/summary");
}

// ─── Goals ────────────────────────────────────────

export function getGoals() {
  return apiFetch("/plans/goals");
}

export function getGoal(id) {
  return apiFetch(`/plans/goals/${id}`);
}

export function createGoal(data) {
  return apiFetch("/plans/goals", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateGoal(id, data) {
  return apiFetch(`/plans/goals/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteGoal(id) {
  return apiFetch(`/plans/goals/${id}`, { method: "DELETE" });
}

// ─── Milestones ───────────────────────────────────

export function addMilestone(goalId, data) {
  return apiFetch(`/plans/goals/${goalId}/milestones`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateMilestone(id, data) {
  return apiFetch(`/plans/milestones/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function toggleMilestone(id) {
  return apiFetch(`/plans/milestones/${id}/toggle`, { method: "PATCH" });
}

export function deleteMilestone(id) {
  return apiFetch(`/plans/milestones/${id}`, { method: "DELETE" });
}

// ─── Bucket List ──────────────────────────────────

export function getBucketItems() {
  return apiFetch("/plans/bucket");
}

export function createBucketItem(data) {
  return apiFetch("/plans/bucket", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateBucketItem(id, data) {
  return apiFetch(`/plans/bucket/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteBucketItem(id) {
  return apiFetch(`/plans/bucket/${id}`, { method: "DELETE" });
}

export function toggleBucketItem(id) {
  return apiFetch(`/plans/bucket/${id}/toggle`, { method: "PATCH" });
}
