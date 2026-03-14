import { useState, useRef, useCallback, useEffect, lazy, Suspense } from "react";
import { Box, Flex } from "@chakra-ui/react";
import DashboardGreeting from "../dashboard/DashboardGreeting";
import TodayWidget from "../dashboard/TodayWidget";
import GoalsWidget from "../dashboard/GoalsWidget";
import BudgetWidget from "../dashboard/BudgetWidget";
import ShoppingWidget from "../dashboard/ShoppingWidget";
import RewardBar from "../dashboard/RewardBar";
import useRewards from "../../hooks/useRewards";
import useAchievements from "../../hooks/useAchievements";
import useAvatarReaction from "../../hooks/useAvatarReaction";
import useIntroTour from "../../hooks/useIntroTour";
import useRewardsSync from "../../hooks/useRewardsSync";
import { getNewlyUnlockedAvatars } from "../affirmation/avatarConfig";
import { getUserStorage, setUserStorage } from "../../utils/storage";
import SpotlightTour from "../intro/SpotlightTour";
import tourSteps from "../intro/tourSteps";

// Lazy-load below-fold and heavy components
const AffirmationAvatar = lazy(() => import("../affirmation/AffirmationAvatar"));
const ChallengesWidget = lazy(() => import("../dashboard/ChallengesWidget"));
const AttentionWidget = lazy(() => import("../dashboard/AttentionWidget"));

const TILE_COMPONENTS = {
  goals: GoalsWidget,
  budget: BudgetWidget,
  shopping: ShoppingWidget,
};

const DEFAULT_ORDER = ["goals", "budget", "shopping"];
const STORAGE_KEY = "smartme_tile_order";

function loadOrder() {
  try {
    const saved = getUserStorage(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (
        Array.isArray(parsed) &&
        parsed.length === DEFAULT_ORDER.length &&
        DEFAULT_ORDER.every((k) => parsed.includes(k))
      ) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_ORDER;
}

function FadeIn({ delay = 0, children }) {
  return (
    <Box
      className="sm-dashboard-fade"
      style={{
        animation: `dashFadeIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s both`,
      }}
    >
      {children}
    </Box>
  );
}

function ReorderableTiles() {
  const [order, setOrder] = useState(loadOrder);
  const [dragging, setDragging] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const longPressTimer = useRef(null);
  const touchStartPos = useRef(null);

  useEffect(() => {
    setUserStorage(STORAGE_KEY, JSON.stringify(order));
  }, [order]);

  const startDrag = useCallback((idx) => {
    setDragging(idx);
  }, []);

  const handleDrop = useCallback(
    (targetIdx) => {
      if (dragging === null || dragging === targetIdx) {
        setDragging(null);
        setOverIdx(null);
        return;
      }
      setOrder((prev) => {
        const next = [...prev];
        const [item] = next.splice(dragging, 1);
        next.splice(targetIdx, 0, item);
        return next;
      });
      setDragging(null);
      setOverIdx(null);
    },
    [dragging]
  );

  const handleTouchStart = useCallback(
    (idx, e) => {
      touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      longPressTimer.current = setTimeout(() => {
        startDrag(idx);
      }, 500);
    },
    [startDrag]
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (longPressTimer.current && touchStartPos.current) {
        const dx = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
        const dy = Math.abs(e.touches[0].clientY - touchStartPos.current.y);
        if (dx > 10 || dy > 10) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }
      if (dragging === null) return;
      const touch = e.touches[0];
      const elements = document.querySelectorAll("[data-tile-idx]");
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        if (
          touch.clientY >= rect.top &&
          touch.clientY <= rect.bottom
        ) {
          const idx = parseInt(el.dataset.tileIdx, 10);
          setOverIdx(idx);
          return;
        }
      }
    },
    [dragging]
  );

  const handleTouchEnd = useCallback(() => {
    clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
    if (dragging !== null && overIdx !== null) {
      handleDrop(overIdx);
    } else {
      setDragging(null);
      setOverIdx(null);
    }
  }, [dragging, overIdx, handleDrop]);

  return (
    <>
      {order.map((key, idx) => {
        const Component = TILE_COMPONENTS[key];
        const isDragging = dragging === idx;
        const isOver = overIdx === idx && dragging !== null && dragging !== idx;
        return (
          <Box
            key={key}
            mb={3.5}
            data-tile-idx={idx}
            draggable={dragging !== null}
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "move";
              startDrag(idx);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setOverIdx(idx);
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(idx);
            }}
            onDragEnd={() => { setDragging(null); setOverIdx(null); }}
            onTouchStart={(e) => handleTouchStart(idx, e)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            opacity={isDragging ? 0.5 : 1}
            transform={isOver ? "scale(1.02)" : "none"}
            transition="all 0.2s"
            borderWidth={isOver ? "2px" : "0px"}
            borderColor="rose.200"
            borderStyle="dashed"
            borderRadius="2xl"
            style={{ touchAction: dragging !== null ? "none" : "auto" }}
          >
            <Component />
          </Box>
        );
      })}
    </>
  );
}

export default function DashboardPage() {
  const level = useRewards((s) => s.level);
  const streakDays = useRewards((s) => s.streakDays);
  const addBonusSparks = useRewards((s) => s.addBonusSparks);
  const initialCheck = useAchievements((s) => s.initialCheck);
  const updateMaxStreak = useAchievements((s) => s.updateMaxStreak);
  const checkLevelRewards = useAchievements((s) => s.checkLevelRewards);
  const hasSeenTour = useIntroTour((s) => s.hasSeenTour);
  const isTourOpen = useIntroTour((s) => s.isTourOpen);
  const openTour = useIntroTour((s) => s.openTour);
  const markAsSeen = useIntroTour((s) => s.markAsSeen);

  // Sync rewards from server (migration + hydration)
  useRewardsSync();

  // Run initial checks on mount
  useEffect(() => {
    initialCheck(addBonusSparks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-show intro tour on first visit (1200ms delay for dashboard to render)
  useEffect(() => {
    if (!hasSeenTour) {
      const timer = setTimeout(openTour, 1200);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track streak changes + streak milestone reaction
  const prevStreakRef = useRef(0);
  useEffect(() => {
    if (streakDays > 0) {
      updateMaxStreak(streakDays);
      if (streakDays > prevStreakRef.current && streakDays >= 3 && streakDays % 3 === 0) {
        useAvatarReaction.getState().react("streak_milestone", { streak: streakDays });
      }
      prevStreakRef.current = streakDays;
    }
  }, [streakDays, updateMaxStreak]);

  // Check level milestones + avatar unlock reaction
  useEffect(() => {
    if (level > 1) {
      const newAvatars = getNewlyUnlockedAvatars(level);
      checkLevelRewards(level);
      if (newAvatars.length > 0) {
        useAvatarReaction.getState().react("avatar_unlocked");
      }
    }
  }, [level, checkLevelRewards]);

  return (
    <Box
      maxW="480px"
      mx="auto"
      px={{ base: "3", md: "4" }}
      py={{ base: "3", md: "4" }}
      pb={{ base: "16", md: "4" }}
    >
      {/* 1. Greeting + level badge */}
      <FadeIn delay={0}>
        <DashboardGreeting />
      </FadeIn>

      {/* 2. Affirmation cloud (lazy — heavy SVG + animations) */}
      <FadeIn delay={0.06}>
        <Flex justify="center" mt={5} mb={3}>
          <Suspense fallback={null}>
            <AffirmationAvatar />
          </Suspense>
        </Flex>
      </FadeIn>

      {/* 3. Plan na dziś */}
      <FadeIn delay={0.12}>
        <Box mb={3.5}>
          <TodayWidget />
        </Box>
      </FadeIn>

      {/* 4-6. Goals, Budget, Shopping (reorderable) */}
      <FadeIn delay={0.18}>
        <ReorderableTiles />
      </FadeIn>

      {/* 7. Challenges (lazy — below fold) */}
      <FadeIn delay={0.26}>
        <Box mb={3.5}>
          <Suspense fallback={null}>
            <ChallengesWidget />
          </Suspense>
        </Box>
      </FadeIn>

      {/* 8. XP / Level progress */}
      <FadeIn delay={0.30}>
        <Box mb={3.5}>
          <RewardBar />
        </Box>
      </FadeIn>

      {/* 9. Attention widget (lazy — below fold, auto-hides when empty) */}
      <FadeIn delay={0.34}>
        <Box mb={3.5}>
          <Suspense fallback={null}>
            <AttentionWidget />
          </Suspense>
        </Box>
      </FadeIn>

      {/* Intro spotlight tour */}
      <SpotlightTour steps={tourSteps} isOpen={isTourOpen} onFinish={markAsSeen} />
    </Box>
  );
}
