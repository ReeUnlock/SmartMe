import { Box, Flex } from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEventHistory } from "../../hooks/useEventHistory";
import { createEvent, updateEvent, deleteEvent } from "../../api/calendar";

function UndoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
    </svg>
  );
}

export default function UndoRedoButtons() {
  const past = useEventHistory((s) => s.past);
  const future = useEventHistory((s) => s.future);
  const popUndo = useEventHistory((s) => s.popUndo);
  const popRedo = useEventHistory((s) => s.popRedo);
  const queryClient = useQueryClient();

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["events"] });

  const stripSystemFields = (evt) => {
    const { id, created_at, updated_at, virtual_date, user_id, ...data } = evt;
    return data;
  };

  const safeDelete = async (id) => {
    try { await deleteEvent(id); } catch (e) { console.warn("Undo delete skipped:", id, e.message); }
  };

  const safeCreate = async (data) => {
    try { await createEvent(data); } catch (e) { console.warn("Undo create skipped:", e.message); }
  };

  const handleUndo = async () => {
    const action = popUndo();
    if (!action) return;

    try {
      if (action.type === "create" && action.eventData?.id) {
        await safeDelete(action.eventData.id);
      } else if (action.type === "delete" && action.eventData) {
        await safeCreate(stripSystemFields(action.eventData));
      } else if (action.type === "update" && action.previousData) {
        const data = stripSystemFields(action.previousData);
        await updateEvent(action.eventData.id, data).catch(() => {});
      } else if (action.type === "batch_create" && action.events) {
        // Undo batch create = delete all created events
        await Promise.all(action.events.map((evt) => safeDelete(evt.id)));
      } else if (action.type === "batch_delete" && action.events) {
        // Undo batch delete = recreate all deleted events
        await Promise.all(action.events.map((evt) => safeCreate(stripSystemFields(evt))));
      }
      invalidate();
    } catch (e) {
      console.error("Undo failed:", e);
    }
  };

  const handleRedo = async () => {
    const action = popRedo();
    if (!action) return;

    try {
      if (action.type === "create" && action.eventData) {
        await safeCreate(stripSystemFields(action.eventData));
      } else if (action.type === "delete" && action.eventData?.id) {
        await safeDelete(action.eventData.id);
      } else if (action.type === "update" && action.eventData) {
        const data = stripSystemFields(action.eventData);
        await updateEvent(action.eventData.id, data).catch(() => {});
      } else if (action.type === "batch_create" && action.events) {
        // Redo batch create = recreate all events
        await Promise.all(action.events.map((evt) => safeCreate(stripSystemFields(evt))));
      } else if (action.type === "batch_delete" && action.events) {
        // Redo batch delete = delete all events again
        await Promise.all(action.events.map((evt) => safeDelete(evt.id)));
      }
      invalidate();
    } catch (e) {
      console.error("Redo failed:", e);
    }
  };

  return (
    <Flex
      position="fixed"
      bottom={{ base: "90px", md: "24px" }}
      left="50%"
      transform="translateX(-50%)"
      gap="2"
      zIndex="10"
    >
      <Box
        as="button"
        w="40px"
        h="40px"
        borderRadius="full"
        bg={canUndo ? "white" : "gray.100"}
        color={canUndo ? "sky.500" : "gray.300"}
        shadow={canUndo ? "0 2px 8px 0 rgba(0,0,0,0.1)" : "none"}
        display="flex"
        alignItems="center"
        justifyContent="center"
        _hover={canUndo ? { bg: "sky.50", transform: "scale(1.05)" } : {}}
        _active={canUndo ? { transform: "scale(0.95)" } : {}}
        transition="all 0.15s"
        cursor={canUndo ? "pointer" : "not-allowed"}
        disabled={!canUndo}
        onClick={handleUndo}
        aria-label="Cofnij"
        border="1px solid"
        borderColor={canUndo ? "gray.200" : "gray.100"}
      >
        <UndoIcon />
      </Box>

      <Box
        as="button"
        w="40px"
        h="40px"
        borderRadius="full"
        bg={canRedo ? "white" : "gray.100"}
        color={canRedo ? "sky.500" : "gray.300"}
        shadow={canRedo ? "0 2px 8px 0 rgba(0,0,0,0.1)" : "none"}
        display="flex"
        alignItems="center"
        justifyContent="center"
        _hover={canRedo ? { bg: "sky.50", transform: "scale(1.05)" } : {}}
        _active={canRedo ? { transform: "scale(0.95)" } : {}}
        transition="all 0.15s"
        cursor={canRedo ? "pointer" : "not-allowed"}
        disabled={!canRedo}
        onClick={handleRedo}
        aria-label="Ponów"
        border="1px solid"
        borderColor={canRedo ? "gray.200" : "gray.100"}
      >
        <RedoIcon />
      </Box>
    </Flex>
  );
}
