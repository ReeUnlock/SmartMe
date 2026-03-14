import { apiFetch } from "./client";

export const getRewards = () => apiFetch("/rewards");

export const patchRewards = (data) =>
  apiFetch("/rewards", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
