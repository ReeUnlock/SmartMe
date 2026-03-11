import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Flex, Text, Icon } from "@chakra-ui/react";
import { LuUndo2 } from "react-icons/lu";
import useExpenseUndo from "../../hooks/useExpenseUndo";
import { useUndoExpense } from "../../hooks/useExpenses";

const UNDO_LABELS = {
  create: "Wydatek dodany",
  delete: "Wydatek usunięty",
  update: "Wydatek zapisany",
};

const AUTO_DISMISS_MS = 8000;

export default function ExpenseUndoBar() {
  const stack = useExpenseUndo((s) => s.stack);
  const clearUndo = useExpenseUndo((s) => s.clear);
  const undoExpense = useUndoExpense();
  const [undoing, setUndoing] = useState(false);

  // Auto-dismiss after timeout
  useEffect(() => {
    if (stack.length === 0) return;
    const timer = setTimeout(clearUndo, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [stack, clearUndo]);

  // Clear on unmount (navigating away from Expenses)
  useEffect(() => {
    return () => clearUndo();
  }, [clearUndo]);

  const handleUndo = useCallback(async () => {
    setUndoing(true);
    try {
      await undoExpense();
    } catch {
      // Error handled by global mutation error handler
    } finally {
      setUndoing(false);
    }
  }, [undoExpense]);

  const lastAction = stack[0];
  if (!lastAction) return null;

  return createPortal(
    <Flex
      position="fixed"
      bottom={{ base: "calc(68px + env(safe-area-inset-bottom, 0px) + 12px)", md: "24px" }}
      left="50%"
      transform="translateX(-50%)"
      bg="white"
      borderRadius="xl"
      shadow="0 4px 20px 0 rgba(0,0,0,0.12)"
      borderWidth="1px"
      borderColor="peach.200"
      px={4}
      py={2.5}
      align="center"
      gap={3}
      zIndex={250}
      maxW="360px"
      w="auto"
      style={{
        animation: "undoSlideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <style>{`
        @keyframes undoSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
      <Text fontSize="sm" fontWeight="600" color="textSecondary" whiteSpace="nowrap">
        {UNDO_LABELS[lastAction.type] || "Zmiana zapisana"}
      </Text>
      <Flex
        as="button"
        align="center"
        gap={1.5}
        px={3}
        py={1.5}
        bg="peach.50"
        color="peach.600"
        borderRadius="lg"
        cursor="pointer"
        fontWeight="700"
        fontSize="sm"
        _hover={{ bg: "peach.100" }}
        _active={{ transform: "scale(0.96)" }}
        transition="all 0.15s"
        opacity={undoing ? 0.5 : 1}
        onClick={handleUndo}
        whiteSpace="nowrap"
        flexShrink={0}
      >
        <Icon as={LuUndo2} boxSize="14px" />
        {"Cofnij"}
        {stack.length > 1 && (
          <Text as="span" fontSize="2xs" color="peach.400" fontWeight="500">
            ({stack.length})
          </Text>
        )}
      </Flex>
    </Flex>,
    document.body,
  );
}
