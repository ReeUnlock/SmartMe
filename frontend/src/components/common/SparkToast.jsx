import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Box, Flex, Text } from "@chakra-ui/react";
import useRewards from "../../hooks/useRewards";

function Toast({ toast, onDone }) {
  const [visible, setVisible] = useState(false);

  const stableDone = useCallback(onDone, [onDone]);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(stableDone, 300);
    }, 2600);
    return () => clearTimeout(timer);
  }, [stableDone]);

  const isLevelUp = toast.isLevelUp;

  return (
    <Flex
      align="center"
      justify="center"
      gap={2}
      px={5}
      py={2.5}
      borderRadius="full"
      fontFamily="'Nunito', sans-serif"
      shadow={isLevelUp
        ? "0 6px 24px rgba(244,115,64,0.2)"
        : "0 4px 20px rgba(0,0,0,0.08)"
      }
      style={{
        background: isLevelUp
          ? "linear-gradient(135deg, #FAA2C1, #F9915E)"
          : "white",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(10px) scale(0.92)",
        transition: "all 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {isLevelUp ? (
        <>
          <Text fontSize="md" lineHeight="1">{"⭐"}</Text>
          <Text fontSize="sm" fontWeight="800" color="white">{toast.label}</Text>
        </>
      ) : (
        <>
          <Text fontSize="md" lineHeight="1">{"✨"}</Text>
          <Text fontSize="sm" fontWeight="700" color="peach.600">
            +{toast.sparks} {toast.sparks === 1 ? "Iskra" : toast.sparks < 5 ? "Iskry" : "Iskier"}
          </Text>
          {toast.subtitle && (
            <Text fontSize="2xs" fontWeight="600" color="rose.300" letterSpacing="0.02em">
              {toast.subtitle}
            </Text>
          )}
        </>
      )}
    </Flex>
  );
}

export default function SparkToast() {
  const toasts = useRewards((s) => s._toasts);
  const dismiss = useRewards((s) => s.dismissToast);

  if (!toasts.length) return null;

  return createPortal(
    <Box
      position="fixed"
      top="env(safe-area-inset-top, 12px)"
      left="50%"
      transform="translateX(-50%)"
      zIndex={500}
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={2}
      pt={3}
      pointerEvents="none"
    >
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDone={() => dismiss(t.id)} />
      ))}
    </Box>,
    document.body,
  );
}
