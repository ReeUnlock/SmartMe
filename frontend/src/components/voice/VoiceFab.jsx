import { Box, Text } from "@chakra-ui/react";
import { useVoiceCommand } from "../../hooks/useVoiceCommand";
import VoiceConfirmationDialog from "./VoiceConfirmationDialog";

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

export default function VoiceFab() {
  const { isRecording, isProcessing, recordingDuration, proposedAction, error } = useVoiceCommand();
  const startRecording = useVoiceCommand((s) => s.startRecording);
  const stopRecording = useVoiceCommand((s) => s.stopRecording);

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
      {/* Recording duration badge */}
      {isRecording && (
        <Box
          position="fixed"
          bottom={{ base: "132px", md: "76px" }}
          left="16px"
          bg="red.500"
          color="white"
          px="2"
          py="0.5"
          borderRadius="full"
          fontSize="xs"
          fontWeight="600"
          zIndex="1001"
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

      {/* FAB button */}
      <Box
        as="button"
        position="fixed"
        bottom={{ base: "80px", md: "24px" }}
        left="16px"
        w="48px"
        h="48px"
        borderRadius="full"
        bg={fabBg}
        color="white"
        shadow="lg"
        display="flex"
        alignItems="center"
        justifyContent="center"
        _hover={{ bg: fabHoverBg, transform: "scale(1.05)" }}
        _active={{ transform: "scale(0.95)" }}
        transition="all 0.15s"
        zIndex="1001"
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

      {/* Confirmation dialog */}
      <VoiceConfirmationDialog />

      {/* Error toast (simple) */}
      {error && !proposedAction && (
        <Box
          position="fixed"
          bottom={{ base: "136px", md: "80px" }}
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
