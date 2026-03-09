import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLists, getList, createList, updateList, deleteList,
  addItem, updateItem, toggleItem, deleteItem,
  getCategories,
} from "../api/shopping";

export function useShoppingLists() {
  return useQuery({
    queryKey: ["shopping-lists"],
    queryFn: getLists,
  });
}

export function useShoppingList(id) {
  return useQuery({
    queryKey: ["shopping-list", id],
    queryFn: () => getList(id),
    enabled: !!id,
  });
}

export function useCreateList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createList,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shopping-lists"] }),
  });
}

export function useUpdateList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateList(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shopping-lists"] });
      qc.invalidateQueries({ queryKey: ["shopping-list"] });
    },
  });
}

export function useDeleteList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteList,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shopping-lists"] }),
  });
}

export function useAddItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, data }) => addItem(listId, data),
    onSuccess: (_, { listId }) => {
      qc.invalidateQueries({ queryKey: ["shopping-list", listId] });
      qc.invalidateQueries({ queryKey: ["shopping-lists"] });
    },
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateItem(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shopping-list"] });
      qc.invalidateQueries({ queryKey: ["shopping-lists"] });
    },
  });
}

export function useToggleItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: toggleItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shopping-list"] });
      qc.invalidateQueries({ queryKey: ["shopping-lists"] });
    },
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shopping-list"] });
      qc.invalidateQueries({ queryKey: ["shopping-lists"] });
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["shopping-categories"],
    queryFn: getCategories,
    staleTime: 5 * 60_000,
  });
}
