import { create } from "zustand";
import {
  AVATAR_REACTIONS,
  DEFAULT_AVATAR_KEY,
  REACTION_CONFIG,
  MAX_PER_SESSION,
  DISPLAY_DURATION_MS,
} from "../utils/reactionConfig";
import { getSelectedAvatar } from "../components/affirmation/avatarConfig";
import useRewards from "./useRewards";

/**
 * Avatar Emotional Reactions — zustand store.
 *
 * API: useAvatarReaction.getState().react(type, payload?)
 *
 * Resolves the currently selected avatar and picks messages
 * from that avatar's personality pool. Falls back to Sol
 * if the avatar or event type pool is missing.
 */

let dismissTimer = null;

function resolveMessages(type) {
  const level = useRewards.getState().level || 1;
  const avatarKey = getSelectedAvatar(level);

  // Try avatar-specific pool first
  const avatarPool = AVATAR_REACTIONS[avatarKey];
  if (avatarPool && avatarPool[type] && avatarPool[type].length > 0) {
    return { messages: avatarPool[type], avatarKey };
  }

  // Fallback to default avatar pool
  const fallbackPool = AVATAR_REACTIONS[DEFAULT_AVATAR_KEY];
  if (fallbackPool && fallbackPool[type] && fallbackPool[type].length > 0) {
    return { messages: fallbackPool[type], avatarKey: DEFAULT_AVATAR_KEY };
  }

  return { messages: null, avatarKey: DEFAULT_AVATAR_KEY };
}

const useAvatarReaction = create((set, get) => ({
  activeReaction: null, // { type, message, emoji, avatarKey, id }
  _lastFired: {},       // { [type]: timestamp }
  _sessionCount: 0,

  react(type, payload) {
    const now = Date.now();
    const current = get();
    const config = REACTION_CONFIG[type];

    // Validate event type
    if (!config) return;

    // Session cap
    if (current._sessionCount >= MAX_PER_SESSION) return;

    // Cooldown check
    if (config.cooldownMs > 0) {
      const lastFired = current._lastFired[type] || 0;
      if (now - lastFired < config.cooldownMs) return;
    }

    // Don't interrupt an active reaction
    if (current.activeReaction) return;

    // Probability roll
    if (config.probability < 1 && Math.random() > config.probability) return;

    // Resolve avatar-specific messages
    const { messages, avatarKey } = resolveMessages(type);
    if (!messages) return;

    // Pick random message
    const pick = messages[Math.floor(Math.random() * messages.length)];

    // Clear any pending dismiss timer
    if (dismissTimer) clearTimeout(dismissTimer);

    set({
      activeReaction: {
        type,
        message: pick.message,
        emoji: pick.emoji,
        avatarKey,
        id: now,
      },
      _lastFired: { ...current._lastFired, [type]: now },
      _sessionCount: current._sessionCount + 1,
    });

    // Auto-dismiss after display duration
    dismissTimer = setTimeout(() => {
      if (get().activeReaction?.id === now) {
        set({ activeReaction: null });
      }
      dismissTimer = null;
    }, DISPLAY_DURATION_MS);
  },

  dismiss() {
    if (dismissTimer) {
      clearTimeout(dismissTimer);
      dismissTimer = null;
    }
    set({ activeReaction: null });
  },
}));

export default useAvatarReaction;
