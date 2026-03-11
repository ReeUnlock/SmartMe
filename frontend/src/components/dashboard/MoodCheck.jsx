import { useState, useEffect, useRef, useCallback } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import useRewards from "../../hooks/useRewards";
import useAchievements from "../../hooks/useAchievements";
import useChallenges from "../../hooks/useChallenges";
import useAvatarReaction from "../../hooks/useAvatarReaction";
import { AVATAR_BUBBLE_THEMES } from "../../utils/reactionConfig";
import { getSelectedAvatar } from "../affirmation/avatarConfig";

const MOODS = [
  { emoji: "\u2728", label: "Super", value: "great" },
  { emoji: "\ud83d\ude0a", label: "Dobrze", value: "good" },
  { emoji: "\ud83d\ude10", label: "Tak sobie", value: "meh" },
  { emoji: "\ud83d\ude34", label: "Zm\u0119czona", value: "tired" },
];

const BUBBLE_STYLES = `
  @keyframes moodBubbleIn {
    0% { opacity: 0; transform: translateX(var(--bx)) translateY(6px) scale(0.9); }
    100% { opacity: 1; transform: translateX(var(--bx)) translateY(0) scale(1); }
  }
  @keyframes moodBubbleFloat {
    0%, 100% { transform: translateX(var(--bx)) translateY(0); }
    50% { transform: translateX(var(--bx)) translateY(-2px); }
  }
  @keyframes moodBubbleOut {
    0% { opacity: 1; transform: translateX(var(--bx)) translateY(0) scale(1); }
    100% { opacity: 0; transform: translateX(var(--bx)) translateY(-4px) scale(0.95); }
  }
`;

const MOOD_PARTICLES = {
  great: {
    items: ["\u2728", "\u2b50", "\ud83c\udf1f", "\ud83c\udf89", "\u2728"],
    count: 8,
    spread: 60,
    duration: 900,
  },
  good: {
    items: ["\u2728", "\ud83d\udc96", "\u2728", "\ud83d\udc95"],
    count: 6,
    spread: 50,
    duration: 800,
  },
  meh: {
    items: ["\u00b7", "\u2022", "\u00b7"],
    count: 4,
    spread: 35,
    duration: 700,
  },
  tired: {
    items: ["\ud83d\udc9c", "\u00b7"],
    count: 3,
    spread: 30,
    duration: 800,
  },
};

function createParticles(containerEl, moodValue) {
  const config = MOOD_PARTICLES[moodValue];
  if (!config || !containerEl) return;

  const rect = containerEl.getBoundingClientRect();
  const cx = rect.width / 2;
  const cy = rect.height / 2;

  for (let i = 0; i < config.count; i++) {
    const el = document.createElement("span");
    const item = config.items[i % config.items.length];
    el.textContent = item;
    el.style.cssText = `
      position: absolute;
      left: ${cx}px;
      top: ${cy}px;
      font-size: ${moodValue === "meh" || moodValue === "tired" ? "10px" : "14px"};
      pointer-events: none;
      z-index: 10;
      opacity: 1;
      transition: none;
    `;
    containerEl.appendChild(el);

    const angle = (Math.PI * 2 * i) / config.count + (Math.random() - 0.5) * 0.5;
    const dist = config.spread * (0.6 + Math.random() * 0.4);
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist - 10;

    requestAnimationFrame(() => {
      el.style.transition = `all ${config.duration}ms cubic-bezier(0.22, 1, 0.36, 1)`;
      el.style.transform = `translate(${tx}px, ${ty}px) scale(0.3)`;
      el.style.opacity = "0";
    });

    setTimeout(() => el.remove(), config.duration + 50);
  }
}

export default function MoodCheck() {
  const [selected, setSelected] = useState(null);
  const [animating, setAnimating] = useState(null);
  const [bubble, setBubble] = useState(null); // { message, emoji, moodValue }
  const [bubbleExiting, setBubbleExiting] = useState(false);
  const refs = useRef({});
  const bubbleTimer = useRef(null);
  const animTimer = useRef(null);
  const level = useRewards((s) => s.level);
  const grantReward = useRewards((s) => s.reward);
  const addBonusSparks = useRewards((s) => s.addBonusSparks);
  const trackProgress = useAchievements((s) => s.trackProgress);
  const trackChallenge = useChallenges((s) => s.trackAction);

  // Cleanup timers on unmount
  useEffect(() => () => {
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    if (animTimer.current) clearTimeout(animTimer.current);
  }, []);

  const handleSelect = useCallback((mood) => {
    setSelected(mood.value);
    setAnimating(mood.value);

    const el = refs.current[mood.value];
    if (el) createParticles(el, mood.value);

    grantReward("mood");
    trackProgress("moods_logged", 1, addBonusSparks);
    trackChallenge("mood", addBonusSparks);
    const isPositive = mood.value === "great" || mood.value === "good";
    useAvatarReaction.getState().react(isPositive ? "mood_positive" : "mood_negative");

    // Capture reaction for local bubble display
    const reaction = useAvatarReaction.getState().activeReaction;
    if (reaction && (reaction.type === "mood_positive" || reaction.type === "mood_negative")) {
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
      setBubbleExiting(false);
      setBubble({ message: reaction.message, emoji: reaction.emoji, moodValue: mood.value });

      bubbleTimer.current = setTimeout(() => {
        setBubbleExiting(true);
        bubbleTimer.current = setTimeout(() => {
          setBubble(null);
          setBubbleExiting(false);
        }, 250);
      }, 3000);
    }

    if (animTimer.current) clearTimeout(animTimer.current);
    animTimer.current = setTimeout(() => setAnimating(null), 900);
  }, [grantReward, trackProgress, addBonusSparks, trackChallenge]);

  // Resolve avatar theme for bubble tint
  const avatarKey = getSelectedAvatar(level);
  const bubbleTheme = AVATAR_BUBBLE_THEMES[avatarKey] || AVATAR_BUBBLE_THEMES.sol;

  return (
    <>
      <style>{BUBBLE_STYLES}</style>
      <Box
        bg="white"
        borderRadius="2xl"
        px={4}
        py={4}
        shadow="0 1px 8px 0 rgba(0,0,0,0.04)"
        borderWidth="1px"
        borderColor="gray.100"
        transition="all 0.2s"
        _hover={{
          shadow: "0 2px 12px 0 rgba(195,177,225,0.10)",
          borderColor: "lavender.200",
        }}
      >
        <Text fontSize="sm" fontWeight="700" color="textSecondary" mb={3}>
          {selected ? "Tw\u00f3j nastr\u00f3j dzisiaj" : "Jak si\u0119 dzi\u015b czujesz?"}
        </Text>

        <Flex gap={2} justify="space-between">
          {MOODS.map((mood, moodIndex) => {
            const isActive = selected === mood.value;
            const isAnimating = animating === mood.value;
            const showBubble = bubble && bubble.moodValue === mood.value;

            // Edge-aware horizontal shift for bubble
            // index 0 (leftmost): shift right so bubble doesn't clip left
            // index 3 (rightmost): shift left so it doesn't clip right
            // middle items: centered
            let bubbleTranslateX = "-50%";
            let tailLeft = "50%";
            if (moodIndex === 0) {
              bubbleTranslateX = "-15%";
              tailLeft = "15%";
            } else if (moodIndex === MOODS.length - 1) {
              bubbleTranslateX = "-85%";
              tailLeft = "85%";
            }

            return (
              <Flex
                key={mood.value}
                ref={(el) => { refs.current[mood.value] = el; }}
                direction="column"
                align="center"
                gap={1}
                flex="1"
                py={2.5}
                px={1}
                borderRadius="xl"
                cursor="pointer"
                bg={isActive ? "lavender.50" : "transparent"}
                borderWidth="2px"
                borderColor={isActive ? "lavender.400" : "transparent"}
                shadow={isActive ? "0 2px 8px 0 rgba(132, 94, 247, 0.15)" : "none"}
                transition="all 0.2s"
                position="relative"
                overflow="visible"
                _hover={{
                  bg: isActive ? "lavender.50" : "gray.50",
                  transform: "scale(1.04)",
                }}
                _active={{ transform: "scale(0.96)" }}
                onClick={() => handleSelect(mood)}
              >
                {/* Mood feedback bubble — anchored above selected emoji */}
                {showBubble && (
                  <Box
                    position="absolute"
                    bottom="calc(100% + 8px)"
                    left="50%"
                    zIndex={20}
                    pointerEvents="none"
                    style={{
                      "--bx": bubbleTranslateX,
                      animation: bubbleExiting
                        ? "moodBubbleOut 0.25s ease-in forwards"
                        : "moodBubbleIn 0.3s cubic-bezier(0.22, 1, 0.36, 1), moodBubbleFloat 2.5s ease-in-out 0.3s infinite",
                      willChange: "transform, opacity",
                    }}
                  >
                    <Box
                      maxW="180px"
                      minW="110px"
                      px={3}
                      py={2}
                      borderRadius="xl"
                      whiteSpace="normal"
                      style={{
                        background: bubbleTheme.bg,
                        boxShadow: "0 4px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
                      }}
                    >
                      <Text
                        fontSize="12px"
                        fontWeight="600"
                        color={bubbleTheme.color}
                        lineHeight="1.4"
                        fontFamily="'Nunito', sans-serif"
                        textAlign="center"
                      >
                        {bubble.emoji}{" "}{bubble.message}
                      </Text>
                    </Box>
                    {/* Tail / caret pointing down to the emoji */}
                    <Box
                      position="absolute"
                      top="100%"
                      left={tailLeft}
                      w="10px"
                      h="5px"
                      style={{
                        transform: "translateX(-50%)",
                        clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                        background: bubbleTheme.tail,
                      }}
                    />
                  </Box>
                )}

                <Text
                  fontSize="xl"
                  lineHeight="1"
                  transition="transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)"
                  style={{
                    transform: isAnimating
                      ? "scale(1.35)"
                      : isActive
                        ? "scale(1.2)"
                        : "scale(1)",
                  }}
                >
                  {mood.emoji}
                </Text>
                <Text
                  fontSize="2xs"
                  fontWeight={isActive ? "700" : "500"}
                  color={isActive ? "lavender.600" : "gray.500"}
                  transition="all 0.2s"
                >
                  {mood.label}
                </Text>
              </Flex>
            );
          })}
        </Flex>
      </Box>
    </>
  );
}
