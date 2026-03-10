/**
 * Centralized calendar date normalization for voice actions.
 *
 * This module is the SINGLE SOURCE OF TRUTH for resolving the dual-field
 * date representation (start_datetime/start_date) used in voice action params.
 *
 * Problem it solves:
 * - Backend GPT returns a single `start_at` field
 * - Frontend maps it to `params.start_datetime`
 * - Single-action forms split it into start_date/start_datetime based on all_day
 * - Batch flows bypass forms and never populate start_date
 * - executeVoiceAction needs the correct field based on all_day
 *
 * Solution:
 * All code paths — forms, batch, mixed-batch — call normalizeCalendarDates()
 * before execution. The executeVoiceAction function also calls resolveStartEnd()
 * as a safety net.
 */

/**
 * Normalize calendar date fields in a voice action's params.
 * Ensures start_date/end_date and start_datetime/end_datetime are correctly
 * populated based on the all_day flag.
 *
 * @param {object} params - The action params object (mutated in place for perf)
 * @returns {object} The same params object, normalized
 */
export function normalizeCalendarDates(params) {
  if (!params) return params;

  const allDay = !!params.all_day;
  const rawStart = params.start_date || params.start_datetime || null;
  const rawEnd = params.end_date || params.end_datetime || null;

  if (allDay) {
    params.start_date = rawStart ? rawStart.split("T")[0] : null;
    params.end_date = rawEnd ? rawEnd.split("T")[0] : null;
    params.start_datetime = null;
    params.end_datetime = null;
  } else {
    params.start_datetime = rawStart || null;
    params.end_datetime = rawEnd || null;
    params.start_date = null;
    params.end_date = null;
  }

  return params;
}

/**
 * Resolve start_at / end_at for the backend payload.
 * Handles all combinations: only start_datetime set, only start_date set,
 * both set, neither set, all_day with datetime containing time, etc.
 *
 * Used in executeVoiceAction as the final normalization before sending to backend.
 *
 * @param {object} params - The action params
 * @returns {{ startAt: string|null, endAt: string|null, isAllDay: boolean }}
 */
export function resolveStartEnd(params) {
  const p = params || {};
  const isAllDay = !!p.all_day;
  const rawStart = p.start_date || p.start_datetime || null;
  const rawEnd = p.end_date || p.end_datetime || null;

  return {
    startAt: isAllDay && rawStart ? rawStart.split("T")[0] : rawStart,
    endAt: isAllDay && rawEnd ? rawEnd.split("T")[0] : rawEnd,
    isAllDay,
  };
}

/**
 * Normalize an entire voice action (or array of actions) for calendar date fields.
 * Non-calendar actions are passed through unchanged.
 *
 * @param {object|object[]} actions - Single action or array of actions
 * @returns {object|object[]} Normalized action(s)
 */
const CALENDAR_ACTIONS = new Set([
  "add_event", "update_event", "delete_event", "delete_all_events", "list_events",
]);

export function normalizeVoiceActions(actions) {
  const arr = Array.isArray(actions) ? actions : [actions];
  for (const action of arr) {
    if (CALENDAR_ACTIONS.has(action.action_type)) {
      normalizeCalendarDates(action.params);
    }
  }
  return Array.isArray(actions) ? arr : arr[0];
}
