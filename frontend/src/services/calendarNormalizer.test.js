import { describe, it, expect } from "vitest";
import {
  normalizeCalendarDates,
  resolveStartEnd,
  normalizeVoiceActions,
} from "./calendarNormalizer";

// ─── normalizeCalendarDates ─────────────────────────────────

describe("normalizeCalendarDates", () => {
  it("timed event: populates start_datetime, clears start_date", () => {
    const params = {
      all_day: false,
      start_datetime: "2026-03-11T08:00:00",
      end_datetime: "2026-03-11T15:30:00",
    };
    normalizeCalendarDates(params);
    expect(params.start_datetime).toBe("2026-03-11T08:00:00");
    expect(params.end_datetime).toBe("2026-03-11T15:30:00");
    expect(params.start_date).toBeNull();
    expect(params.end_date).toBeNull();
  });

  it("all-day event: strips time from start_datetime into start_date", () => {
    const params = {
      all_day: true,
      start_datetime: "2026-03-30T09:00:00",
      end_datetime: "",
    };
    normalizeCalendarDates(params);
    expect(params.start_date).toBe("2026-03-30");
    expect(params.end_date).toBeNull();
    expect(params.start_datetime).toBeNull();
    expect(params.end_datetime).toBeNull();
  });

  it("all-day event: date-only string preserved as start_date", () => {
    const params = {
      all_day: true,
      start_datetime: "2026-03-30",
    };
    normalizeCalendarDates(params);
    expect(params.start_date).toBe("2026-03-30");
    expect(params.start_datetime).toBeNull();
  });

  it("all-day event: prefers start_date over start_datetime when both set", () => {
    const params = {
      all_day: true,
      start_date: "2026-03-25",
      start_datetime: "2026-03-25T09:00:00",
    };
    normalizeCalendarDates(params);
    expect(params.start_date).toBe("2026-03-25");
  });

  it("timed event: prefers start_date fallback when start_datetime is empty", () => {
    const params = {
      all_day: false,
      start_datetime: "",
      start_date: "2026-03-22",
    };
    normalizeCalendarDates(params);
    expect(params.start_datetime).toBe("2026-03-22");
    expect(params.start_date).toBeNull();
  });

  it("null params returns null", () => {
    expect(normalizeCalendarDates(null)).toBeNull();
  });

  it("empty params with no dates sets all to null", () => {
    const params = { all_day: false };
    normalizeCalendarDates(params);
    expect(params.start_datetime).toBeNull();
    expect(params.end_datetime).toBeNull();
    expect(params.start_date).toBeNull();
    expect(params.end_date).toBeNull();
  });
});

// ─── resolveStartEnd ────────────────────────────────────────

describe("resolveStartEnd", () => {
  it("timed event: returns start_datetime as startAt", () => {
    const result = resolveStartEnd({
      all_day: false,
      start_datetime: "2026-03-11T08:00:00",
      end_datetime: "2026-03-11T15:30:00",
    });
    expect(result.startAt).toBe("2026-03-11T08:00:00");
    expect(result.endAt).toBe("2026-03-11T15:30:00");
    expect(result.isAllDay).toBe(false);
  });

  it("all-day event with datetime: strips time", () => {
    const result = resolveStartEnd({
      all_day: true,
      start_datetime: "2026-03-30T09:00:00",
    });
    expect(result.startAt).toBe("2026-03-30");
    expect(result.isAllDay).toBe(true);
  });

  it("all-day event with date-only: passes through", () => {
    const result = resolveStartEnd({
      all_day: true,
      start_date: "2026-03-30",
    });
    expect(result.startAt).toBe("2026-03-30");
  });

  it("batch flow: only start_datetime set, all_day true — strips time", () => {
    // This was the exact bug scenario
    const result = resolveStartEnd({
      all_day: true,
      start_datetime: "2026-03-30",
      // start_date NOT set (batch flow)
    });
    expect(result.startAt).toBe("2026-03-30");
    expect(result.isAllDay).toBe(true);
  });

  it("batch flow: only start_datetime set, all_day true, has time — strips time", () => {
    const result = resolveStartEnd({
      all_day: true,
      start_datetime: "2026-03-30T00:00:00",
    });
    expect(result.startAt).toBe("2026-03-30");
  });

  it("form flow: start_date set, start_datetime null — uses start_date", () => {
    const result = resolveStartEnd({
      all_day: true,
      start_date: "2026-03-30",
      start_datetime: null,
    });
    expect(result.startAt).toBe("2026-03-30");
  });

  it("no dates: returns nulls", () => {
    const result = resolveStartEnd({ all_day: false });
    expect(result.startAt).toBeNull();
    expect(result.endAt).toBeNull();
  });

  it("null params: returns nulls", () => {
    const result = resolveStartEnd(null);
    expect(result.startAt).toBeNull();
    expect(result.endAt).toBeNull();
  });
});

// ─── normalizeVoiceActions ──────────────────────────────────

describe("normalizeVoiceActions", () => {
  it("normalizes a single add_event action", () => {
    const action = {
      action_type: "add_event",
      params: { all_day: true, start_datetime: "2026-03-30T09:00" },
    };
    normalizeVoiceActions(action);
    expect(action.params.start_date).toBe("2026-03-30");
    expect(action.params.start_datetime).toBeNull();
  });

  it("normalizes a batch of mixed calendar + shopping actions", () => {
    const actions = [
      {
        action_type: "add_event",
        params: { all_day: true, start_datetime: "2026-03-30" },
      },
      {
        action_type: "add_event",
        params: { all_day: false, start_datetime: "2026-03-22T07:30:00" },
      },
      {
        action_type: "create_shopping_list",
        params: { list_name: "Biedronka", items: [{ name: "Mleko" }] },
      },
    ];
    normalizeVoiceActions(actions);
    // All-day event normalized
    expect(actions[0].params.start_date).toBe("2026-03-30");
    expect(actions[0].params.start_datetime).toBeNull();
    // Timed event normalized
    expect(actions[1].params.start_datetime).toBe("2026-03-22T07:30:00");
    expect(actions[1].params.start_date).toBeNull();
    // Shopping untouched
    expect(actions[2].params.list_name).toBe("Biedronka");
    expect(actions[2].params.start_date).toBeUndefined();
  });

  it("does not touch non-calendar action types", () => {
    const action = {
      action_type: "add_expense",
      params: { amount: 50, expense_date: "2026-03-10" },
    };
    normalizeVoiceActions(action);
    expect(action.params.expense_date).toBe("2026-03-10");
    expect(action.params.start_date).toBeUndefined();
  });

  it("recurring month events: each expanded event normalized independently", () => {
    // Simulates GPT expanding "every Wednesday this month" into individual events
    const actions = [
      { action_type: "add_event", params: { all_day: false, start_datetime: "2026-03-04T08:00:00", end_datetime: "2026-03-04T15:30:00", title: "Szpital" } },
      { action_type: "add_event", params: { all_day: false, start_datetime: "2026-03-11T08:00:00", end_datetime: "2026-03-11T15:30:00", title: "Szpital" } },
      { action_type: "add_event", params: { all_day: false, start_datetime: "2026-03-18T08:00:00", end_datetime: "2026-03-18T15:30:00", title: "Szpital" } },
      { action_type: "add_event", params: { all_day: false, start_datetime: "2026-03-25T08:00:00", end_datetime: "2026-03-25T15:30:00", title: "Szpital" } },
    ];
    normalizeVoiceActions(actions);
    for (const a of actions) {
      expect(a.params.start_datetime).toBeTruthy();
      expect(a.params.start_date).toBeNull();
    }
  });

  it("multi-date command: March 22 and 28 as separate events", () => {
    const actions = [
      { action_type: "add_event", params: { all_day: false, start_datetime: "2026-03-22T07:30:00", end_datetime: "2026-03-23T07:30:00", title: "Dyżur" } },
      { action_type: "add_event", params: { all_day: false, start_datetime: "2026-03-28T07:30:00", end_datetime: "2026-03-29T07:30:00", title: "Dyżur" } },
    ];
    normalizeVoiceActions(actions);
    expect(actions[0].params.start_datetime).toBe("2026-03-22T07:30:00");
    expect(actions[1].params.start_datetime).toBe("2026-03-28T07:30:00");
  });

  it("mixed batch: calendar + shopping + expense", () => {
    const actions = [
      { action_type: "add_event", params: { all_day: false, start_datetime: "2026-03-11T18:00:00", title: "Dentysta" } },
      { action_type: "create_shopping_list", params: { list_name: "Zakupy", items: [{ name: "Mleko" }, { name: "Jajka" }] } },
      { action_type: "add_expense", params: { amount: 42, expense_category: "Zdrowie", expense_description: "Apteka" } },
    ];
    normalizeVoiceActions(actions);
    expect(actions[0].params.start_datetime).toBe("2026-03-11T18:00:00");
    expect(actions[1].params.items).toHaveLength(2);
    expect(actions[2].params.amount).toBe(42);
  });

  it("vacation all-day: March 30 wolne", () => {
    const action = {
      action_type: "add_event",
      params: { all_day: true, start_datetime: "2026-03-30", title: "Wolne", color: "pink" },
    };
    normalizeVoiceActions(action);
    expect(action.params.start_date).toBe("2026-03-30");
    expect(action.params.start_datetime).toBeNull();
    expect(action.params.color).toBe("pink");
  });
});
