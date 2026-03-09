import { create } from "zustand";
import { processVoiceCommand, executeVoiceAction } from "../api/voice";
import { useEventHistory } from "./useEventHistory";

function getSupportedMimeType() {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg",
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

const MAX_CHAT_HISTORY = 10;

export const useVoiceCommand = create((set, get) => ({
  isRecording: false,
  isProcessing: false,
  // Single action for backward compat (first action or null)
  proposedAction: null,
  // All proposed actions (batch)
  proposedActions: [],
  transcript: "",
  error: null,
  recordingDuration: 0,
  chatHistory: [],

  // internal refs (not reactive state)
  _mediaRecorder: null,
  _chunks: [],
  _stream: null,
  _timer: null,
  _autoStopTimer: null,

  startRecording: async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, options);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        // Clean up timers
        const state = get();
        if (state._timer) clearInterval(state._timer);
        if (state._autoStopTimer) clearTimeout(state._autoStopTimer);

        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop());

        if (chunks.length === 0) {
          set({
            isRecording: false,
            isProcessing: false,
            recordingDuration: 0,
            _mediaRecorder: null,
            _chunks: [],
            _stream: null,
            _timer: null,
            _autoStopTimer: null,
          });
          return;
        }

        const blob = new Blob(chunks, { type: mimeType || "audio/webm" });
        set({ isRecording: false, isProcessing: true, recordingDuration: 0 });

        try {
          const history = get().chatHistory;
          const result = await processVoiceCommand(blob, history);
          const actions = result.actions || [];
          set({
            proposedActions: actions,
            proposedAction: actions[0] || null,
            transcript: result.transcript || "",
            isProcessing: false,
          });
        } catch (err) {
          set({ error: err.message || "Błąd przetwarzania komendy głosowej", isProcessing: false });
        }
      };

      recorder.start();

      // Duration counter
      const timer = setInterval(() => {
        set((s) => ({ recordingDuration: s.recordingDuration + 1 }));
      }, 1000);

      // Auto-stop after 60 seconds
      const autoStopTimer = setTimeout(() => {
        const state = get();
        if (state._mediaRecorder && state._mediaRecorder.state === "recording") {
          state._mediaRecorder.stop();
        }
      }, 60000);

      set({
        isRecording: true,
        isProcessing: false,
        error: null,
        recordingDuration: 0,
        _mediaRecorder: recorder,
        _chunks: chunks,
        _stream: stream,
        _timer: timer,
        _autoStopTimer: autoStopTimer,
      });
    } catch (err) {
      set({ error: "Brak dostępu do mikrofonu. Sprawdź uprawnienia przeglądarki." });
    }
  },

  stopRecording: () => {
    const state = get();
    if (state._mediaRecorder && state._mediaRecorder.state === "recording") {
      state._mediaRecorder.stop();
    }
  },

  confirmAction: async (editedActions, queryClient) => {
    set({ isProcessing: true, error: null });

    // Support both single action and array of actions
    const actions = Array.isArray(editedActions) ? editedActions : [editedActions];

    try {
      const results = [];
      for (const action of actions) {
        const result = await executeVoiceAction(action);
        results.push({ action, result });
      }

      // Push calendar actions to undo/redo history as a single batch entry
      const { pushAction } = useEventHistory.getState();
      const createdEvents = [];
      const deletedEvents = [];
      for (const { action, result } of results) {
        if (action.action_type === "add_event" && result?.data?.event) {
          createdEvents.push(result.data.event);
        } else if (action.action_type === "delete_event" && result?.data?.event) {
          deletedEvents.push(result.data.event);
        } else if (action.action_type === "delete_all_events" && result?.data?.events) {
          deletedEvents.push(...result.data.events);
        }
      }
      if (createdEvents.length > 0) {
        pushAction({ type: "batch_create", events: createdEvents });
      }
      if (deletedEvents.length > 0) {
        pushAction({ type: "batch_delete", events: deletedEvents });
      }

      if (queryClient) {
        // Invalidate relevant queries based on action types
        const hasCalendar = actions.some((a) =>
          ["add_event", "update_event", "delete_event", "delete_all_events", "list_events"].includes(a.action_type)
        );
        const hasShopping = actions.some((a) =>
          ["create_shopping_list", "add_shopping_items", "delete_shopping_items"].includes(a.action_type)
        );
        if (hasCalendar) await queryClient.invalidateQueries({ queryKey: ["events"] });
        if (hasShopping) {
          await queryClient.invalidateQueries({ queryKey: ["shopping-lists"] });
          await queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
        }
        const hasExpenses = actions.some((a) =>
          ["add_expense", "add_recurring_expense", "delete_recurring_expense", "set_budget", "list_expenses"].includes(a.action_type)
        );
        if (hasExpenses) {
          await queryClient.invalidateQueries({ queryKey: ["expenses"] });
          await queryClient.invalidateQueries({ queryKey: ["expense-summary"] });
          await queryClient.invalidateQueries({ queryKey: ["expense-comparison"] });
          await queryClient.invalidateQueries({ queryKey: ["expense-budget"] });
          await queryClient.invalidateQueries({ queryKey: ["recurring-expenses"] });
          await queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
          await queryClient.invalidateQueries({ queryKey: ["household-members"] });
        }
      }
      // Save to chat history
      const transcript = get().transcript;
      const actionSummaries = actions.map((a) => a.action_type).join(", ");
      set((state) => ({
        proposedAction: null,
        proposedActions: [],
        transcript: "",
        isProcessing: false,
        chatHistory: [
          ...state.chatHistory,
          { role: "user", content: transcript },
          { role: "assistant", content: `Wykonano: ${actionSummaries}` },
        ].slice(-MAX_CHAT_HISTORY * 2),
      }));
    } catch (err) {
      set({ error: err.message || "Błąd wykonywania akcji", isProcessing: false });
    }
  },

  cancelAction: () => {
    set({ proposedAction: null, proposedActions: [], transcript: "", error: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));
