import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Box, Flex, Text } from "@chakra-ui/react";
import { create } from "zustand";

// ─── Success toast store ──────────────────────────────────────
const useSuccessToast = create((set) => ({
  _toasts: [],
  show: (message) => {
    const id = Date.now() + Math.random();
    set((s) => ({ _toasts: [...s._toasts, { id, message }] }));
  },
  dismiss: (id) => {
    set((s) => ({ _toasts: s._toasts.filter((t) => t.id !== id) }));
  },
}));

export { useSuccessToast };

// ─── Single toast ─────────────────────────────────────────────
function Toast({ toast, onDone }) {
  const [visible, setVisible] = useState(false);

  const stableDone = useCallback(onDone, [onDone]);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(stableDone, 300);
    }, 2000);
    return () => clearTimeout(timer);
  }, [stableDone]);

  return (
    <Flex
      align="center"
      justify="center"
      gap={2}
      px={5}
      py={2.5}
      borderRadius="full"
      fontFamily="'Nunito', sans-serif"
      shadow="0 4px 20px rgba(0,0,0,0.08)"
      bg="white"
      borderWidth="1px"
      borderColor="sage.100"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(10px) scale(0.92)",
        transition: "all 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <Text fontSize="sm" fontWeight="600" color="sage.600">
        {toast.message}
      </Text>
    </Flex>
  );
}

// ─── Global success toast component ───────────────────────────
export default function SuccessToast() {
  const toasts = useSuccessToast((s) => s._toasts);
  const dismiss = useSuccessToast((s) => s.dismiss);

  if (!toasts.length) return null;

  return createPortal(
    <Box
      position="fixed"
      bottom={{ base: "140px", md: "24px" }}
      left="50%"
      transform="translateX(-50%)"
      zIndex={9999}
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={2}
      pointerEvents="none"
    >
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDone={() => dismiss(t.id)} />
      ))}
    </Box>,
    document.body,
  );
}
