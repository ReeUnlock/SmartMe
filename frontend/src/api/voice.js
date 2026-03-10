import { apiUpload } from "./client";
import { apiFetch } from "./client";
import { resolveStartEnd } from "../services/calendarNormalizer";

export async function processVoiceCommand(audioBlob, chatHistory = [], fileExt = "webm") {
  const formData = new FormData();
  formData.append("audio", audioBlob, `recording.${fileExt}`);
  if (chatHistory.length > 0) {
    formData.append("history", JSON.stringify(chatHistory));
  }
  const response = await apiUpload("/voice/process", formData);

  // Backend returns { transcript, actions: [...] }
  // Map each action to the format frontend components expect
  const actions = (response.actions || []).map((a) => ({
    action_type: a.action,
    transcript: response.transcript,
    confidence_note: a.confidence_note || null,
    // Temporal interpretation metadata (calendar)
    temporal_interpretation: a.temporal_interpretation || null,
    // Validation errors from backend
    validation_errors: a.validation_errors || null,
    params: {
      // Calendar fields
      title: a.title || "",
      start_datetime: a.start_at || "",
      end_datetime: a.end_at || "",
      all_day: a.all_day || false,
      description: a.description || "",
      color: a.color || "sky",
      icon: a.icon || "",
      location: a.location || "",
      category: a.category || "",
      event_id: a.event_id || null,
      date_query: a.date_query || null,
      // Shopping fields
      list_name: a.list_name || "",
      items: a.items || [],
      // Expense fields
      amount: a.amount || null,
      expense_date: a.expense_date || "",
      expense_category: a.expense_category || "",
      paid_by: a.paid_by || "",
      is_shared: a.is_shared || false,
      expense_description: a.expense_description || "",
      recurring_name: a.recurring_name || "",
      day_of_month: a.day_of_month || 1,
      budget_amount: a.budget_amount || null,
      budget_year: a.budget_year || null,
      budget_month: a.budget_month || null,
      // Plans fields
      goal_title: a.goal_title || "",
      goal_description: a.goal_description || "",
      goal_category: a.goal_category || "",
      goal_color: a.goal_color || "",
      goal_target_value: a.goal_target_value || null,
      goal_current_value: a.goal_current_value || null,
      goal_unit: a.goal_unit || "",
      goal_deadline: a.goal_deadline || "",
      goal_id: a.goal_id || null,
      bucket_title: a.bucket_title || "",
      bucket_description: a.bucket_description || "",
      bucket_category: a.bucket_category || "",
      bucket_id: a.bucket_id || null,
    },
  }));

  return {
    transcript: response.transcript,
    actions,
  };
}

export async function executeVoiceAction(action) {
  const p = action.params || {};
  // Centralized date resolution — single source of truth
  const { startAt, endAt, isAllDay } = resolveStartEnd(p);

  // Map frontend format back to backend format
  const payload = {
    action: action.action_type,
    transcript: action.transcript,
    confidence_note: action.confidence_note,
    // Calendar fields
    title: p.title || null,
    start_at: startAt,
    end_at: endAt,
    all_day: isAllDay,
    description: p.description || null,
    location: p.location || null,
    category: p.category || null,
    event_id: p.event_id || null,
    date_query: p.date_query || null,
    color: p.color || null,
    icon: p.icon || null,
    // Shopping fields
    list_name: p.list_name || null,
    items: p.items?.length ? p.items : null,
    // Expense fields
    amount: p.amount || null,
    expense_date: p.expense_date || null,
    expense_category: p.expense_category || null,
    paid_by: p.paid_by || null,
    is_shared: p.is_shared || false,
    expense_description: p.expense_description || null,
    recurring_name: p.recurring_name || null,
    day_of_month: p.day_of_month || null,
    budget_amount: p.budget_amount || null,
    budget_year: p.budget_year || null,
    budget_month: p.budget_month || null,
    // Plans fields
    goal_title: p.goal_title || null,
    goal_description: p.goal_description || null,
    goal_category: p.goal_category || null,
    goal_color: p.goal_color || null,
    goal_target_value: p.goal_target_value || null,
    goal_current_value: p.goal_current_value || null,
    goal_unit: p.goal_unit || null,
    goal_deadline: p.goal_deadline || null,
    goal_id: p.goal_id || null,
    bucket_title: p.bucket_title || null,
    bucket_description: p.bucket_description || null,
    bucket_category: p.bucket_category || null,
    bucket_id: p.bucket_id || null,
  };
  const result = await apiFetch("/voice/execute", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (result && result.success === false) {
    throw new Error(result.message || "Błąd wykonywania akcji.");
  }
  return result;
}
