import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLists, getList, createList, updateList, deleteList,
  addItem, updateItem, toggleItem, deleteItem,
  reorderItems, getCategories, saveListAsExpense,
} from "../api/shopping";
import { useSuccessToast } from "../components/common/SuccessToast";
import { useLimitModal } from "../components/common/LimitReachedModal";

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
    onError: (err) => {
      if (err.status === 403 && err.body?.error === "shopping_limit_reached") {
        useLimitModal.getState().open(
          "Osiągnęłaś limit 3 aktywnych list zakupów. Przejdź na Pro, aby tworzyć bez ograniczeń."
        );
      }
    },
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
      useSuccessToast.getState().show("Produkt dodany");
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
    onMutate: async (itemId) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await qc.cancelQueries({ queryKey: ["shopping-list"] });
      await qc.cancelQueries({ queryKey: ["shopping-lists"] });

      // Snapshot previous state for rollback
      const prevLists = qc.getQueriesData({ queryKey: ["shopping-list"] });
      const prevAllLists = qc.getQueriesData({ queryKey: ["shopping-lists"] });

      // Optimistically toggle is_checked in the detail cache
      qc.setQueriesData({ queryKey: ["shopping-list"] }, (old) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.map((item) =>
            item.id === itemId ? { ...item, is_checked: !item.is_checked } : item
          ),
        };
      });

      // Optimistically toggle in the lists cache (for progress bars)
      qc.setQueriesData({ queryKey: ["shopping-lists"] }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((list) => ({
          ...list,
          items: list.items?.map((item) =>
            item.id === itemId ? { ...item, is_checked: !item.is_checked } : item
          ),
        }));
      });

      return { prevLists, prevAllLists };
    },
    onError: (_err, _itemId, context) => {
      // Rollback on failure
      if (context?.prevLists) {
        for (const [key, data] of context.prevLists) {
          qc.setQueryData(key, data);
        }
      }
      if (context?.prevAllLists) {
        for (const [key, data] of context.prevAllLists) {
          qc.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      // Always refetch to ensure server state
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

export function useReorderItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, items }) => reorderItems(listId, items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shopping-list"] });
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

export function useSaveListAsExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, data }) => saveListAsExpense(listId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shopping-list"] });
      qc.invalidateQueries({ queryKey: ["shopping-lists"] });
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["expense-summary"] });
    },
  });
}
