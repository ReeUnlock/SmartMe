import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Box, Flex, Text, Heading } from "@chakra-ui/react";
import { useVoiceCommand } from "../../hooks/useVoiceCommand";
import { useKeyboardOpen } from "../../hooks/useKeyboardOpen";
import { playSound } from "../../utils/soundManager";
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
    <svg width="33" height="33" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="1" width="6" height="12" rx="3" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="33" height="33" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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

export default function VoiceFab() {
  const { isRecording, isProcessing, recordingDuration, proposedAction, error } = useVoiceCommand();
  const startRecording = useVoiceCommand((s) => s.startRecording);
  const stopRecording = useVoiceCommand((s) => s.stopRecording);
  const [errorVisible, setErrorVisible] = useState(false);
  const errorTimerRef = useRef(null);

  // Auto-show and auto-dismiss error after 5s
  useEffect(() => {
    if (error && !proposedAction) {
      setErrorVisible(true);
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => {
        setErrorVisible(false);
        useVoiceCommand.getState().clearError();
      }, 5000);
    } else {
      setErrorVisible(false);
    }
    return () => clearTimeout(errorTimerRef.current);
  }, [error, proposedAction]);

  const safeBottom = useSafeAreaBottom();
  const kbdOpen = useKeyboardOpen();
  // BottomNav ~68px + safe area + 16px gap
  const fabBottom = 68 + safeBottom + 16;

  const handleClick = () => {
    if (isProcessing) return;
    if (isRecording) {
      playSound("voiceStop");
      stopRecording();
    } else {
      playSound("voiceStart");
      startRecording();
    }
  };

  const fabBg = isRecording ? "red.500" : undefined;
  const fabHoverBg = isRecording ? "red.600" : undefined;

  return (
    <>
      {/* Floating mic button — hidden during processing */}
      {!isProcessing && (
        <Flex
          id="voice-fab"
          position="fixed"
          bottom={{ base: `${fabBottom}px`, md: "20px" }}
          right={{ base: "16px", md: "20px" }}
          align="center"
          gap={2}
          zIndex="300"
          pointerEvents="auto"
          className="sm-kbd-hide"
          data-kbd-open={kbdOpen ? "true" : undefined}
        >
          {/* Recording duration badge */}
          {isRecording && (
            <Box
              bg="red.500"
              color="white"
              px="2.5"
              py="1"
              borderRadius="full"
              fontSize="xs"
              fontWeight="600"
              shadow="0 2px 8px rgba(229, 62, 62, 0.3)"
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

          {/* Mic button */}
          <Box
            as="button"
            w="72px"
            h="72px"
            borderRadius="full"
            bg={fabBg}
            color="white"
            shadow={isRecording ? "0 4px 16px 0 rgba(229, 62, 62, 0.3)" : "0 4px 16px rgba(249, 145, 94, 0.45)"}
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
            style={!isRecording ? { background: "linear-gradient(135deg, #FF8FAB, #F9915E)" } : undefined}
            _hover={{ bg: fabHoverBg, transform: "scale(1.08)", shadow: isRecording ? "0 6px 24px 0 rgba(229, 62, 62, 0.4)" : "0 6px 24px rgba(249, 145, 94, 0.55)" }}
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
            {isRecording ? <StopIcon /> : <MicIcon />}
          </Box>
        </Flex>
      )}

      {/* Processing overlay */}
      {isProcessing && createPortal(
        <Flex
          position="fixed"
          inset="0"
          zIndex="499"
          align="center"
          justify="center"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
          className="sm-fade-in"
        >
          <Flex
            direction="column"
            align="center"
            bg="white"
            borderRadius="2xl"
            p={7}
            shadow="0 8px 32px rgba(0,0,0,0.12)"
            textAlign="center"
            maxW="280px"
            w="calc(100vw - 48px)"
            gap={5}
          >
            {/* Mic icon — mirrors idle FAB visually */}
            <Box
              w="72px"
              h="72px"
              borderRadius="full"
              color="white"
              display="flex"
              alignItems="center"
              justifyContent="center"
              shadow="0 4px 16px rgba(249, 145, 94, 0.45)"
              style={{ background: "linear-gradient(135deg, #FF8FAB, #F9915E)" }}
              pointerEvents="none"
            >
              <MicIcon />
            </Box>

            {/* Bouncing dots */}
            <Flex gap="6px" justify="center">
              <Box className="sm-dot-bounce" />
              <Box className="sm-dot-bounce" />
              <Box className="sm-dot-bounce" />
            </Flex>

            {/* Text */}
            <Box>
              <Heading
                size="sm"
                fontFamily="'Nunito', sans-serif"
                fontWeight="700"
                fontSize="sm"
                color="textPrimary"
              >
                {"SmartMe przetwarza Twoje nagranie\u2026"}
              </Heading>
              <Text fontSize="xs" color="textSecondary" mt={1}>
                {"Za chwil\u0119 zobaczysz podsumowanie do zatwierdzenia"}
              </Text>
            </Box>
          </Flex>
        </Flex>,
        document.body
      )}

      {/* Confirmation dialog */}
      <VoiceConfirmationDialog />

      {/* Error toast — appears above FAB, auto-dismisses after 5s */}
      {errorVisible && error && (
        <Flex
          position="fixed"
          bottom={{ base: `${fabBottom + 58}px`, md: "80px" }}
          right={{ base: "16px", md: "20px" }}
          maxW="280px"
          bg="red.50"
          borderWidth="1px"
          borderColor="red.200"
          borderRadius="xl"
          px="3"
          py="2"
          zIndex="300"
          shadow="0 4px 12px 0 rgba(229, 62, 62, 0.15)"
          align="center"
          gap="2"
          className="sm-fade-in"
        >
          <Text fontSize="xs" color="red.600" flex="1">
            {error}
          </Text>
          <Box
            as="button"
            fontSize="xs"
            color="red.400"
            fontWeight="600"
            flexShrink={0}
            onClick={() => {
              setErrorVisible(false);
              useVoiceCommand.getState().clearError();
            }}
          >
            {"✕"}
          </Box>
        </Flex>
      )}
    </>
  );
}
