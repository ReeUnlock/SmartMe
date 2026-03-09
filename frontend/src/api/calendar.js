import { apiFetch } from "./client";

export function getEvents(start, end) {
  const params = new URLSearchParams();
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  return apiFetch(`/calendar/events?${params.toString()}`);
}

export function createEvent(data) {
  return apiFetch("/calendar/events", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateEvent(id, data) {
  return apiFetch(`/calendar/events/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteEvent(id) {
  return apiFetch(`/calendar/events/${id}`, {
    method: "DELETE",
  });
}
