import { apiUpload } from "./client";
import { apiFetch } from "./client";

export async function processVoiceCommand(audioBlob, chatHistory = []) {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");
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
    },
  }));

  return {
    transcript: response.transcript,
    actions,
  };
}

export async function executeVoiceAction(action) {
  // Map frontend format back to backend format
  const payload = {
    action: action.action_type,
    transcript: action.transcript,
    confidence_note: action.confidence_note,
    // Calendar fields
    title: action.params?.title || null,
    start_at: action.params?.all_day
      ? action.params?.start_date || null
      : action.params?.start_datetime || null,
    end_at: action.params?.all_day
      ? action.params?.end_date || null
      : action.params?.end_datetime || null,
    all_day: action.params?.all_day || false,
    description: action.params?.description || null,
    location: action.params?.location || null,
    category: action.params?.category || null,
    event_id: action.params?.event_id || null,
    date_query: action.params?.date_query || null,
    color: action.params?.color || null,
    icon: action.params?.icon || null,
    // Shopping fields
    list_name: action.params?.list_name || null,
    items: action.params?.items?.length ? action.params.items : null,
    // Expense fields
    amount: action.params?.amount || null,
    expense_date: action.params?.expense_date || null,
    expense_category: action.params?.expense_category || null,
    paid_by: action.params?.paid_by || null,
    is_shared: action.params?.is_shared || false,
    expense_description: action.params?.expense_description || null,
    recurring_name: action.params?.recurring_name || null,
    day_of_month: action.params?.day_of_month || null,
    budget_amount: action.params?.budget_amount || null,
    budget_year: action.params?.budget_year || null,
    budget_month: action.params?.budget_month || null,
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
