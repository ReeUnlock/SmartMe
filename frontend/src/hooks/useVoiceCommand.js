import { create } from "zustand";
import { processVoiceCommand, executeVoiceAction } from "../api/voice";
import { useEventHistory } from "./useEventHistory";
import { getModulesForActions, invalidateModuleQueries } from "../services/appService";
import { useLimitModal } from "../components/common/LimitReachedModal";

function getSupportedMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg",
    "audio/mp4",       // iOS Safari 14.3+
    "audio/aac",       // iOS Safari fallback
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

function getFileExtension(mimeType) {
  if (mimeType.includes("mp4") || mimeType.includes("aac")) return "m4a";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
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
    // Check browser support
    if (typeof MediaRecorder === "undefined") {
      set({ error: "Twoja przeglądarka nie obsługuje nagrywania audio. Użyj Safari 14.3+, Chrome lub Firefox." });
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      set({ error: "Brak dostępu do mikrofonu. Upewnij się, że strona jest otwarta przez HTTPS." });
      return;
    }

    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : {};
      let recorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch {
        // MediaRecorder constructor can fail on some mobile browsers
        // Clean up the stream before rethrowing
        stream.getTracks().forEach((t) => t.stop());
        set({ error: "Twoja przeglądarka nie obsługuje nagrywania w tym formacie. Spróbuj innej przeglądarki." });
        return;
      }
      // Determine the actual MIME type the recorder is using
      const actualMime = recorder.mimeType || mimeType || "audio/webm";
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onerror = () => {
        // Recording failed mid-stream — clean up gracefully
        stream.getTracks().forEach((t) => t.stop());
        const state = get();
        if (state._timer) clearInterval(state._timer);
        if (state._autoStopTimer) clearTimeout(state._autoStopTimer);
        set({
          isRecording: false,
          isProcessing: false,
          recordingDuration: 0,
          error: "Nagrywanie zostało przerwane. Spróbuj ponownie.",
          _mediaRecorder: null,
          _chunks: [],
          _stream: null,
          _timer: null,
          _autoStopTimer: null,
        });
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

        const blob = new Blob(chunks, { type: actualMime });
        set({ isRecording: false, isProcessing: true, recordingDuration: 0 });

        try {
          const ext = getFileExtension(actualMime);
          const history = get().chatHistory;
          const result = await processVoiceCommand(blob, history, ext);
          const actions = result.actions || [];
          set({
            proposedActions: actions,
            proposedAction: actions[0] || null,
            transcript: result.transcript || "",
            isProcessing: false,
          });
        } catch (err) {
          // Handle voice limit reached (429)
          if (err.status === 429 && err.body?.error === "voice_limit_reached") {
            useLimitModal.getState().open(
              "Wykorzystałaś dzienny limit komendy głosowej. Przejdź na Pro, aby odblokować nielimitowane komendy."
            );
            set({ isProcessing: false });
            return;
          }
          set({ error: err.message || "Błąd przetwarzania komendy głosowej", isProcessing: false });
        }
      };

      // Use timeslice on mobile to ensure data is captured in chunks
      // (some mobile browsers don't fire ondataavailable without it)
      recorder.start(1000);

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
      // Clean up stream if it was acquired before the error
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      // Provide specific error messages for common mobile issues
      const name = err?.name || "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        set({ error: "Mikrofon zablokowany. Zezwól na dostęp w ustawieniach przeglądarki i odśwież stronę." });
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        set({ error: "Nie znaleziono mikrofonu na tym urządzeniu." });
      } else if (name === "NotReadableError" || name === "TrackStartError") {
        set({ error: "Mikrofon jest używany przez inną aplikację. Zamknij ją i spróbuj ponownie." });
      } else {
        set({ error: "Brak dostępu do mikrofonu. Sprawdź uprawnienia przeglądarki." });
      }
    }
  },

  stopRecording: () => {
    const state = get();
    if (state._mediaRecorder && state._mediaRecorder.state === "recording") {
      try {
        state._mediaRecorder.stop();
      } catch {
        // If stop() fails, clean up manually
        if (state._stream) state._stream.getTracks().forEach((t) => t.stop());
        if (state._timer) clearInterval(state._timer);
        if (state._autoStopTimer) clearTimeout(state._autoStopTimer);
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
      }
    }
  },

  confirmAction: async (editedActions, queryClient) => {
    set({ isProcessing: true, error: null });

    // Support both single action and array of actions
    const actions = Array.isArray(editedActions) ? editedActions : [editedActions];

    // Execute each action independently — don't let one failure block the batch
    const results = [];
    const errors = [];
    for (const action of actions) {
      try {
        const result = await executeVoiceAction(action);
        results.push({ action, result });
      } catch (err) {
        errors.push({ action, error: err.message || "Błąd wykonywania akcji" });
      }
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
      // Invalidate relevant queries using unified service layer
      const affectedModules = getModulesForActions(actions);
      await invalidateModuleQueries(queryClient, affectedModules);
    }

    // Build error message if any actions failed
    const errorMsg = errors.length > 0
      ? errors.map((e) => `${e.action.action_type}: ${e.error}`).join("; ")
      : null;

    // Save to chat history
    const transcript = get().transcript;
    const successCount = results.length;
    const failCount = errors.length;
    const summary = failCount === 0
      ? `Wykonano: ${actions.map((a) => a.action_type).join(", ")}`
      : `Wykonano ${successCount}/${actions.length}. Błędy: ${errorMsg}`;

    set((state) => ({
      proposedAction: null,
      proposedActions: [],
      transcript: "",
      isProcessing: false,
      error: errorMsg,
      chatHistory: [
        ...state.chatHistory,
        { role: "user", content: transcript },
        { role: "assistant", content: summary },
      ].slice(-MAX_CHAT_HISTORY * 2),
    }));
  },

  cancelAction: () => {
    set({ proposedAction: null, proposedActions: [], transcript: "", error: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));
