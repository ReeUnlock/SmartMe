import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Box, Text } from "@chakra-ui/react";
import useAvatarReaction from "../../hooks/useAvatarReaction";
import { AVATAR_BUBBLE_THEMES } from "../../utils/reactionConfig";

/**
 * Avatar Emotional Reactions — speech bubble component.
 *
 * Mounted globally in App.jsx but only renders on the dashboard (/).
 * Shows a small floating speech bubble above the avatar area
 * when the avatar "reacts" to user actions.
 *
 * Bubble tint is subtly personalized per avatar theme.
 */

const STYLES = `
  @keyframes avReactionIn {
    0% {
      opacity: 0;
      transform: scale(0.85) translateY(8px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  @keyframes avReactionFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
  }
  @keyframes avReactionOut {
    0% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
    100% {
      opacity: 0;
      transform: scale(0.95) translateY(-6px);
    }
  }
`;

const DEFAULT_THEME = AVATAR_BUBBLE_THEMES.sol;

export default function AvatarReaction() {
  const activeReaction = useAvatarReaction((s) => s.activeReaction);
  const [visible, setVisible] = useState(null);
  const [exiting, setExiting] = useState(false);
  const prevIdRef = useRef(null);
  const location = useLocation();

  const isDashboard = location.pathname === "/";

  useEffect(() => {
    if (activeReaction && activeReaction.id !== prevIdRef.current) {
      prevIdRef.current = activeReaction.id;
      setExiting(false);
      setVisible(activeReaction);
    } else if (!activeReaction && visible && !exiting) {
      setExiting(true);
      const t = setTimeout(() => {
        setVisible(null);
        setExiting(false);
        prevIdRef.current = null;
      }, 250);
      return () => clearTimeout(t);
    }
  }, [activeReaction, visible, exiting]);

  // Only render on dashboard
  if (!isDashboard || !visible) return null;
  const theme = AVATAR_BUBBLE_THEMES[visible.avatarKey] || DEFAULT_THEME;

  return (
    <>
      <style>{STYLES}</style>
      <Box
        position="fixed"
        zIndex={8000}
        pointerEvents="none"
        bottom="auto"
        top="140px"
        left="50%"
        style={{ transform: "translateX(-50%)" }}
      >
        <Box
          maxW="200px"
          px={3.5}
          py={2.5}
          borderRadius="2xl"
          position="relative"
          style={{
            background: theme.bg,
            boxShadow: "0 4px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
            animation: exiting
              ? "avReactionOut 0.25s ease-in forwards"
              : "avReactionIn 0.25s ease-out, avReactionFloat 2.5s ease-in-out 0.25s infinite",
            willChange: "transform, opacity",
          }}
        >
          {/* Tiny tail pointing down */}
          <Box
            position="absolute"
            bottom="-6px"
            left="50%"
            w="12px"
            h="6px"
            style={{
              transform: "translateX(-50%)",
              clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              background: theme.tail,
            }}
          />

          <Text
            fontSize="13px"
            fontWeight="600"
            color={theme.color}
            lineHeight="1.4"
            fontFamily="'Nunito', sans-serif"
            textAlign="center"
          >
            {visible.emoji}{" "}{visible.message}
          </Text>
        </Box>
      </Box>
    </>
  );
}
