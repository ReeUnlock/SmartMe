import { useState, useEffect } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { useVoiceCommand } from "../../hooks/useVoiceCommand";
import useRewards from "../../hooks/useRewards";
import VoiceConfirmationDialog from "./VoiceConfirmationDialog";

// Measure safe-area-inset-bottom once at mount to prevent layout jumps
// when mobile browser chrome shows/hides
function useSafeAreaBottom() {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const el = document.createElement("div");
    el.style.cssText = "position:fixed;bottom:0;height:env(safe-area-inset-bottom,0px);pointer-events:none;visibility:hidden";
    document.body.appendChild(el);
    setValue(el.offsetHeight);
    document.body.removeChild(el);
  }, []);
  return value;
}

function MicIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="1" width="6" height="12" rx="3" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <style>{`@keyframes voice-spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" style={{ animation: "voice-spin 0.8s linear infinite", transformOrigin: "center" }} />
    </svg>
  );
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function MiniProgressBar() {
  const xp = useRewards((s) => s.xp);
  const xpToNextLevel = useRewards((s) => s.xpToNextLevel);
  const level = useRewards((s) => s.level);
  const sparks = useRewards((s) => s.sparks);
  const streakDays = useRewards((s) => s.streakDays);

  const progress = xpToNextLevel > 0 ? Math.min((xp / xpToNextLevel) * 100, 100) : 0;

  return (
    <Flex
      align="center"
      gap={2}
      px={3}
      py={2}
      borderRadius="full"
      style={{
        background: "linear-gradient(90deg, #FCC2D7, #F9915E)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        boxShadow: "0 8px 24px rgba(249,145,94,0.25)",
      }}
    >
      {/* Level circle */}
      <Flex
        align="center"
        justify="center"
        w="26px"
        h="26px"
        borderRadius="full"
        flexShrink={0}
        style={{
          background: "rgba(255,255,255,0.35)",
          boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3)",
        }}
      >
        <Text fontSize="xs" fontWeight="800" color="white" lineHeight="1">
          {level}
        </Text>
      </Flex>

      {/* XP bar */}
      <Box flex={1} minW="60px">
        <Box h="6px" borderRadius="full" overflow="hidden" style={{ background: "rgba(255,255,255,0.3)" }}>
          <Box
            h="100%"
            borderRadius="full"
            transition="width 0.6s cubic-bezier(0.22, 1, 0.36, 1)"
            bg="white"
            style={{ width: `${progress}%` }}
          />
        </Box>
      </Box>

      {/* Sparks */}
      <Text fontSize="xs" fontWeight="700" color="white" whiteSpace="nowrap" lineHeight="1">
        {"✨"} {sparks}
      </Text>

      {/* Streak */}
      {streakDays > 0 && (
        <Text fontSize="xs" fontWeight="700" color="white" whiteSpace="nowrap" lineHeight="1">
          {"🔥"} {streakDays}
        </Text>
      )}
    </Flex>
  );
}

export default function VoiceFab() {
  const { isRecording, isProcessing, recordingDuration, proposedAction, error } = useVoiceCommand();
  const startRecording = useVoiceCommand((s) => s.startRecording);
  const stopRecording = useVoiceCommand((s) => s.stopRecording);
  const safeBottom = useSafeAreaBottom();
  // BottomNav ~68px + safe area + 12px gap, computed once to prevent jumps
  const fabBottom = 68 + safeBottom + 12;

  const handleClick = () => {
    if (isProcessing) return;
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const fabBg = isRecording ? "red.500" : "lavender.400";
  const fabHoverBg = isRecording ? "red.600" : "lavender.500";

  return (
    <>
      {/* Floating container: progress bar + mic */}
      <Flex
        position="fixed"
        bottom={{ base: `${fabBottom}px`, md: "20px" }}
        left="12px"
        right="12px"
        align="center"
        gap={2}
        zIndex="1001"
        pointerEvents="auto"
      >
        {/* Mic button */}
        <Box
          as="button"
          w="48px"
          h="48px"
          borderRadius="full"
          bg={fabBg}
          color="white"
          shadow="0 4px 16px 0 rgba(132, 94, 247, 0.3)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
          _hover={{ bg: fabHoverBg, transform: "scale(1.08)", shadow: "0 6px 24px 0 rgba(132, 94, 247, 0.4)" }}
          _active={{ transform: "scale(0.93)" }}
          transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
          onClick={handleClick}
          aria-label={isRecording ? "Zatrzymaj nagrywanie" : "Komenda głosowa"}
          css={
            isRecording
              ? {
                  "@keyframes fabPulse": {
                    "0%, 100%": { boxShadow: "0 0 0 0 rgba(229, 62, 62, 0.5)" },
                    "50%": { boxShadow: "0 0 0 10px rgba(229, 62, 62, 0)" },
                  },
                  animation: "fabPulse 1.5s ease-in-out infinite",
                }
              : {}
          }
        >
          {isProcessing ? <SpinnerIcon /> : isRecording ? <StopIcon /> : <MicIcon />}
        </Box>

        {/* Mini progress bar — fills remaining width */}
        <Box flex={1} minW={0}>
          <MiniProgressBar />
        </Box>

        {/* Recording duration badge */}
        {isRecording && (
          <Box
            bg="red.500"
            color="white"
            px="2"
            py="0.5"
            borderRadius="full"
            fontSize="xs"
            fontWeight="600"
            animation="pulse 1.5s ease-in-out infinite"
            css={{
              "@keyframes pulse": {
                "0%, 100%": { opacity: 1 },
                "50%": { opacity: 0.6 },
              },
            }}
          >
            {formatDuration(recordingDuration)}
          </Box>
        )}
      </Flex>

      {/* Confirmation dialog */}
      <VoiceConfirmationDialog />

      {/* Error toast (simple) */}
      {error && !proposedAction && (
        <Box
          position="fixed"
          bottom={{ base: `${fabBottom + 60}px`, md: "80px" }}
          left="16px"
          maxW="280px"
          bg="red.50"
          borderWidth="1px"
          borderColor="red.200"
          borderRadius="xl"
          px="3"
          py="2"
          zIndex="1002"
          shadow="md"
        >
          <Text fontSize="xs" color="red.600">
            {error}
          </Text>
          <Box
            as="button"
            fontSize="xs"
            color="red.400"
            fontWeight="500"
            mt="1"
            onClick={() => useVoiceCommand.getState().clearError()}
          >
            Zamknij
          </Box>
        </Box>
      )}
    </>
  );
}
