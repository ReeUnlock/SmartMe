import { useState, useEffect, useRef } from "react";
import { getRewards, patchRewards } from "../api/rewards";
import useRewards from "./useRewards";
import useAchievements from "./useAchievements";
import useChallenges from "./useChallenges";
import { getUserStorage, setUserStorage } from "../utils/storage";
import {
  AVATAR_STORAGE_KEY,
  AVATAR_UNLOCK_STORAGE_KEY,
  saveSelectedAvatar,
} from "../components/affirmation/avatarConfig";

const SYNCED_KEY = "smartme_rewards_synced";

function isDefaultServerData(data) {
  return (
    data.sparks === 0 &&
    data.level === 1 &&
    data.streak === 0 &&
    data.xp === 0 &&
    (Array.isArray(data.achievements) && data.achievements.length === 0) &&
    data.avatar_key === "sol"
  );
}

function loadLocalRewards() {
  try {
    const raw = getUserStorage("smartme_rewards");
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function loadLocalAchievements() {
  try {
    const raw = getUserStorage("smartme_achievements");
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function loadLocalChallenges() {
  try {
    const raw = getUserStorage("smartme_challenges");
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function loadLocalAvatar() {
  try {
    return getUserStorage(AVATAR_STORAGE_KEY) || null;
  } catch {}
  return null;
}

function loadLocalSeenUnlocks() {
  try {
    const raw = getUserStorage(AVATAR_UNLOCK_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function hasLocalData() {
  const rewards = loadLocalRewards();
  return rewards && (rewards.sparks > 0 || rewards.level > 1 || rewards.streakDays > 0);
}

export default function useRewardsSync() {
  const [isSyncing, setIsSyncing] = useState(true);
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    async function sync() {
      try {
        let serverData;
        try {
          serverData = await getRewards();
        } catch {
          // Server unreachable — fall back to localStorage, no block
          setIsSyncing(false);
          return;
        }

        const alreadySynced = getUserStorage(SYNCED_KEY) === "true";

        // Migration: if server is at defaults and we have local data, push it up
        if (!alreadySynced && isDefaultServerData(serverData) && hasLocalData()) {
          const localRewards = loadLocalRewards();
          const localAchievements = loadLocalAchievements();
          const localChallenges = loadLocalChallenges();
          const localAvatar = loadLocalAvatar();
          const localSeenUnlocks = loadLocalSeenUnlocks();

          const migrationPayload = {};

          if (localRewards) {
            migrationPayload.sparks = localRewards.sparks || 0;
            migrationPayload.level = localRewards.level || 1;
            migrationPayload.streak = localRewards.streakDays || 0;
            migrationPayload.xp = localRewards.xp || 0;
            migrationPayload.streak_last_date = localRewards.lastActiveDate || null;
          }

          if (localAchievements) {
            migrationPayload.achievements = {
              unlocked: localAchievements.unlocked || [],
              progress: localAchievements.progress || {},
              unlockedFeatures: localAchievements.unlockedFeatures || {},
              lastCheckedLevel: localAchievements.lastCheckedLevel || 1,
            };
          }

          if (localChallenges) {
            migrationPayload.challenges_state = {
              daily: localChallenges.daily,
              weekly: localChallenges.weekly,
              weekActiveDays: localChallenges.weekActiveDays || [],
            };
          }

          if (localAvatar) {
            migrationPayload.avatar_key = localAvatar;
          }

          if (localSeenUnlocks) {
            migrationPayload.seen_avatar_unlocks = localSeenUnlocks;
          }

          try {
            serverData = await patchRewards(migrationPayload);
          } catch {
            // Migration failed — use local data, will retry next time
          }
        }

        // Hydrate stores from server data
        hydrateStores(serverData);

        setUserStorage(SYNCED_KEY, "true");
      } catch {
        // Unexpected error — don't block
      } finally {
        setIsSyncing(false);
      }
    }

    sync();
  }, []);

  return { isSyncing };
}

function hydrateStores(data) {
  // Hydrate rewards
  useRewards.getState().hydrate({
    sparks: data.sparks,
    level: data.level,
    streak: data.streak,
    xp: data.xp,
    streak_last_date: data.streak_last_date,
  });

  // Hydrate achievements
  if (data.achievements && typeof data.achievements === "object" && !Array.isArray(data.achievements)) {
    useAchievements.getState().hydrate(data.achievements);
  } else if (Array.isArray(data.achievements) && data.achievements.length > 0) {
    // Legacy format — achievements stored as flat array
    useAchievements.getState().hydrate({ unlocked: data.achievements });
  }

  // Hydrate challenges
  if (data.challenges_state && typeof data.challenges_state === "object" && data.challenges_state.daily) {
    useChallenges.getState().hydrate(data.challenges_state);
  }

  // Hydrate avatar (via localStorage — avatarConfig reads from there)
  if (data.avatar_key) {
    try {
      setUserStorage(AVATAR_STORAGE_KEY, data.avatar_key);
    } catch {}
  }

  if (Array.isArray(data.seen_avatar_unlocks) && data.seen_avatar_unlocks.length > 0) {
    try {
      setUserStorage(AVATAR_UNLOCK_STORAGE_KEY, JSON.stringify(data.seen_avatar_unlocks));
    } catch {}
  }
}
