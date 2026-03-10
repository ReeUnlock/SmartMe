import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Box, Flex, Text } from "@chakra-ui/react";
import useAchievements from "../../hooks/useAchievements";
import useChallenges from "../../hooks/useChallenges";

// Soft celebration particles — sparkles and stars
function CelebrationParticles({ onDone }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const particles = [];
    const EMOJIS = ["✨", "⭐", "🌟", "💫", "✦"];
    const COUNT = 12;

    for (let i = 0; i < COUNT; i++) {
      const span = document.createElement("span");
      span.textContent = EMOJIS[i % EMOJIS.length];
      const startX = 40 + Math.random() * 20;
      const startY = 40 + Math.random() * 20;
      span.style.cssText = `
        position: fixed;
        left: ${startX}%;
        top: ${startY}%;
        font-size: ${10 + Math.random() * 14}px;
        pointer-events: none;
        z-index: 10001;
        opacity: 0;
        transition: all ${800 + Math.random() * 400}ms cubic-bezier(0.22, 1, 0.36, 1);
      `;
      document.body.appendChild(span);
      particles.push(span);

      const angle = (Math.PI * 2 * i) / COUNT + (Math.random() - 0.5) * 0.8;
      const dist = 80 + Math.random() * 120;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist - 30;

      requestAnimationFrame(() => {
        span.style.opacity = "0.8";
        span.style.transform = `translate(${tx}px, ${ty}px) scale(0.3) rotate(${Math.random() * 360}deg)`;
        span.style.opacity = "0";
      });
    }

    const timer = setTimeout(() => {
      particles.forEach((p) => p.remove());
      onDone?.();
    }, 1200);

    return () => {
      clearTimeout(timer);
      particles.forEach((p) => p.remove());
    };
  }, [onDone]);

  return <div ref={containerRef} />;
}

function ToastItem({ toast, onDone, showCelebration }) {
  const [visible, setVisible] = useState(false);
  const [celebrating, setCelebrating] = useState(showCelebration);

  const stableDone = useCallback(onDone, [onDone]);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(stableDone, 400);
    }, 3500);
    return () => clearTimeout(timer);
  }, [stableDone]);

  // Determine toast style
  const isFeature = toast.isFeatureUnlock;
  const isChallenge = toast.isChallengeComplete;
  const isAllComplete = toast.isAllComplete;
  const isBonusClaim = toast.isBonusClaim;

  let bg, label;
  if (isAllComplete || isBonusClaim) {
    bg = "linear-gradient(135deg, #FAA2C1, #F9915E)";
    label = isBonusClaim ? "Bonus odebrany" : "Brawo!";
  } else if (isChallenge) {
    bg = "linear-gradient(135deg, #C3B1E1, #E8D5F5)";
    label = toast.period === "weekly" ? "Wyzwanie tygodnia" : "Wyzwanie dnia";
  } else if (isFeature) {
    bg = "linear-gradient(135deg, #E8D5F5, #FCC2D7)";
    label = "Nowa nagroda";
  } else {
    bg = "linear-gradient(135deg, #FCC2D7, #FDD0B1)";
    label = "Odblokowałaś odznakę";
  }

  return (
    <>
      {celebrating && (
        <CelebrationParticles onDone={() => setCelebrating(false)} />
      )}
      <Flex
        direction="column"
        align="center"
        gap={1}
        px={6}
        py={3}
        borderRadius="2xl"
        fontFamily="'Nunito', sans-serif"
        shadow="0 8px 32px rgba(231, 73, 128, 0.15)"
        maxW="280px"
        style={{
          background: bg,
          opacity: visible ? 1 : 0,
          transform: visible
            ? "translateY(0) scale(1)"
            : "translateY(12px) scale(0.9)",
          transition: "all 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <Text fontSize="lg" lineHeight="1" mb={0.5}>
          {toast.icon}
        </Text>
        <Text fontSize="2xs" fontWeight="600" color="white" opacity={0.85} letterSpacing="0.06em" textTransform="uppercase">
          {label}
        </Text>
        <Text fontSize="sm" fontWeight="800" color="white" textAlign="center">
          {toast.title}
        </Text>
        {toast.sparks > 0 && (
          <Text fontSize="xs" fontWeight="700" color="white" opacity={0.9}>
            +{toast.sparks} {"Iskier ✨"}
          </Text>
        )}
      </Flex>
    </>
  );
}

export default function AchievementToast() {
  const achievementToasts = useAchievements((s) => s._achievementToasts);
  const dismissAchievement = useAchievements((s) => s.dismissAchievementToast);
  const challengeToasts = useChallenges((s) => s._challengeToasts);
  const dismissChallenge = useChallenges((s) => s.dismissChallengeToast);

  // Merge both toast queues
  const allToasts = [
    ...achievementToasts.map((t) => ({ ...t, source: "achievement" })),
    ...challengeToasts.map((t) => ({ ...t, source: "challenge" })),
  ];

  if (!allToasts.length) return null;

  return createPortal(
    <Box
      position="fixed"
      top="60px"
      left="50%"
      transform="translateX(-50%)"
      zIndex={10001}
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={3}
      pointerEvents="none"
    >
      {allToasts.map((t) => (
        <ToastItem
          key={t.id}
          toast={t}
          showCelebration={!t.isChallengeComplete}
          onDone={() => {
            if (t.source === "achievement") dismissAchievement(t.id);
            else dismissChallenge(t.id);
          }}
        />
      ))}
    </Box>,
    document.body,
  );
}
