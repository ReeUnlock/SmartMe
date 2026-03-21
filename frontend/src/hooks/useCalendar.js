import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEvents, createEvent, updateEvent, deleteEvent } from "../api/calendar";
import { useEventHistory } from "./useEventHistory";
import { useLimitModal } from "../components/common/LimitReachedModal";

export function useEvents(start, end) {
  return useQuery({
    queryKey: ["events", start, end],
    queryFn: () => getEvents(start, end),
    enabled: !!start && !!end,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEvent,
    onSuccess: (createdEvent) => {
      useEventHistory.getState().pushAction({
        type: "create",
        eventData: createdEvent,
      });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (err) => {
      if (err.status === 403 && err.body?.error === "calendar_limit_reached") {
        useLimitModal.getState().open(
          "Osiągnęłaś limit 10 wydarzeń w kalendarzu. Przejdź na Pro, aby dodawać bez ograniczeń."
        );
      }
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateEvent(id, data),
    onSuccess: (updatedEvent, variables) => {
      useEventHistory.getState().pushAction({
        type: "update",
        eventData: updatedEvent,
        previousData: variables.previousData || null,
      });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => deleteEvent(id),
    onSuccess: (_result, variables) => {
      useEventHistory.getState().pushAction({
        type: "delete",
        eventData: variables.eventData || null,
      });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
