import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getGoals, getGoal, createGoal, updateGoal, deleteGoal,
  addMilestone, updateMilestone, toggleMilestone, deleteMilestone,
  getBucketItems, createBucketItem, updateBucketItem, deleteBucketItem, toggleBucketItem,
  getPlansSummary,
} from "../api/plans";

// ─── Summary ──────────────────────────────────────

export function usePlansSummary() {
  return useQuery({
    queryKey: ["plans-summary"],
    queryFn: getPlansSummary,
  });
}

// ─── Goals ────────────────────────────────────────

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: getGoals,
  });
}

export function useGoal(id) {
  return useQuery({
    queryKey: ["goal", id],
    queryFn: () => getGoal(id),
    enabled: !!id,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["plans-summary"] });
    },
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateGoal(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["goal"] });
      qc.invalidateQueries({ queryKey: ["plans-summary"] });
    },
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["plans-summary"] });
    },
  });
}

// ─── Milestones ───────────────────────────────────

export function useAddMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, data }) => addMilestone(goalId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["goal"] });
    },
  });
}

export function useUpdateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateMilestone(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["goal"] });
    },
  });
}

export function useToggleMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: toggleMilestone,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["goal"] });
    },
  });
}

export function useDeleteMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteMilestone,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["goal"] });
    },
  });
}

// ─── Bucket List ──────────────────────────────────

export function useBucketItems() {
  return useQuery({
    queryKey: ["bucket-items"],
    queryFn: getBucketItems,
  });
}

export function useCreateBucketItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBucketItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bucket-items"] });
      qc.invalidateQueries({ queryKey: ["plans-summary"] });
    },
  });
}

export function useUpdateBucketItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateBucketItem(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bucket-items"] });
      qc.invalidateQueries({ queryKey: ["plans-summary"] });
    },
  });
}

export function useDeleteBucketItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteBucketItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bucket-items"] });
      qc.invalidateQueries({ queryKey: ["plans-summary"] });
    },
  });
}

export function useToggleBucketItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: toggleBucketItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bucket-items"] });
      qc.invalidateQueries({ queryKey: ["plans-summary"] });
    },
  });
}
