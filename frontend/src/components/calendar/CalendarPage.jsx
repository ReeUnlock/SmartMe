import { useState, useCallback } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import dayjs from "dayjs";
import "dayjs/locale/pl";

import CalendarHeader from "./CalendarHeader";
import MonthView from "./MonthView";
import DayDetailView from "./DayDetailView";
import EventFormDrawer from "./EventFormDrawer";
import QuickAddEditor from "./QuickAddEditor";
import UndoRedoButtons from "./UndoRedoButtons";
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from "../../hooks/useCalendar";
import { useQuickTemplates } from "../../hooks/useQuickTemplates";
import { useKeyboardOpen } from "../../hooks/useKeyboardOpen";

dayjs.locale("pl");

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf("month"));
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [templateMode, setTemplateMode] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const kbdOpen = useKeyboardOpen();

  // Fetch events for current month (with padding for prev/next month days)
  const rangeStart = currentMonth.subtract(7, "day").format("YYYY-MM-DD");
  const rangeEnd = currentMonth.endOf("month").add(7, "day").format("YYYY-MM-DD");
  const { data: events = [], isLoading } = useEvents(rangeStart, rangeEnd);

  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const addQuickTemplate = useQuickTemplates((s) => s.addTemplate);
  const allTemplates = useQuickTemplates((s) => s.templates);
  const setTemplates = useQuickTemplates((s) => s.setTemplates);

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((m) => m.subtract(1, "month"));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((m) => m.add(1, "month"));
  }, []);

  const handleSelectDay = useCallback((date) => {
    setSelectedDate(date);
  }, []);

  const handleDayDetailDateChange = useCallback((newDate) => {
    setSelectedDate(newDate);
    // If new date is outside current month, navigate to that month
    const newMonth = dayjs(newDate).startOf("month");
    setCurrentMonth((cur) => {
      if (!cur.isSame(newMonth, "month")) return newMonth;
      return cur;
    });
  }, []);

  const handleAddEvent = useCallback(() => {
    setEditingEvent(null);
    setTemplateMode(false);
    setShowEventForm(true);
  }, []);

  const handleAddTemplate = useCallback(() => {
    setEditingEvent(null);
    setTemplateMode(true);
    setShowEventForm(true);
  }, []);

  const handleEditTemplates = useCallback(() => {
    setShowTemplateEditor(true);
  }, []);

  const handleSaveTemplates = useCallback(
    (updatedTemplates) => {
      setTemplates(updatedTemplates);
      setShowTemplateEditor(false);
    },
    [setTemplates]
  );

  const handleQuickAdd = useCallback(
    (data) => {
      createEvent.mutate(data);
    },
    [createEvent]
  );

  const handleEditEvent = useCallback((event) => {
    setEditingEvent(event);
    setShowEventForm(true);
  }, []);

  const handleSave = useCallback(
    (data, eventId) => {
      if (templateMode) {
        // Template mode — only save as quick-add template, don't create event
        addQuickTemplate(data);
        setShowEventForm(false);
        setTemplateMode(false);
        return;
      }
      if (eventId) {
        updateEvent.mutate(
          { id: eventId, data, previousData: editingEvent },
          {
            onSuccess: () => {
              setShowEventForm(false);
              setEditingEvent(null);
            },
          }
        );
      } else {
        createEvent.mutate(data, {
          onSuccess: () => {
            setShowEventForm(false);
          },
        });
      }
    },
    [createEvent, updateEvent, editingEvent, templateMode, addQuickTemplate]
  );

  const handleDelete = useCallback(
    (eventId) => {
      deleteEvent.mutate(
        { id: eventId, eventData: editingEvent },
        {
          onSuccess: () => {
            setShowEventForm(false);
            setEditingEvent(null);
          },
        }
      );
    },
    [deleteEvent, editingEvent]
  );

  const handleCloseEventForm = useCallback(() => {
    setShowEventForm(false);
    setEditingEvent(null);
    setTemplateMode(false);
  }, []);

  return (
    <Box maxW="600px" mx="auto" pb={{ base: "120px", md: "80px" }}>
      {/* Loading indicator */}
      {isLoading && (
        <Flex justify="center" py="2">
          <Text fontSize="xs" color="gray.400">
            {"\u0141adowanie..."}
          </Text>
        </Flex>
      )}

      {/* === DAY SECTION === */}
      <Box mb="5">
        <Flex align="center" gap="2" px="1.5" mb="2.5">
          <Text fontSize="sm" lineHeight="1">{"\u{1F4C5}"}</Text>
          <Text
            fontSize="11px"
            fontWeight="700"
            color="#B8A0A6"
            letterSpacing="0.06em"
            fontFamily="'Nunito', sans-serif"
            textTransform="uppercase"
          >
            {"Przegl\u0105d dnia"}
          </Text>
        </Flex>
        <Box
          borderWidth="1px"
          borderColor="#F5E6EA"
          borderRadius="2xl"
          bg="white"
          overflow="hidden"
          shadow="0 2px 16px 0 rgba(0,0,0,0.03)"
        >
          {selectedDate && (
            <DayDetailView
              selectedDate={selectedDate}
              events={events}
              onDateChange={handleDayDetailDateChange}
              onEditEvent={handleEditEvent}
              onAddEvent={handleAddEvent}
              onAddTemplate={handleAddTemplate}
              onQuickAdd={handleQuickAdd}
              onEditTemplates={handleEditTemplates}
            />
          )}
        </Box>
      </Box>

      {/* === MONTH SECTION === */}
      <Box>
        <Flex align="center" gap="2" px="1.5" mb="2.5">
          <Text fontSize="sm" lineHeight="1">{"\u{1F5D3}\uFE0F"}</Text>
          <Text
            fontSize="11px"
            fontWeight="700"
            color="#B8A0A6"
            letterSpacing="0.06em"
            fontFamily="'Nunito', sans-serif"
            textTransform="uppercase"
          >
            {"Przegl\u0105d miesi\u0105ca"}
          </Text>
        </Flex>
        <Box
          borderWidth="1px"
          borderColor="#F5E6EA"
          borderRadius="2xl"
          overflow="hidden"
          shadow="0 2px 16px 0 rgba(0,0,0,0.03)"
        >
          {/* Header with month navigation */}
          <Box bg="white" px="2" pt="3" pb="1">
            <CalendarHeader
              currentMonth={currentMonth}
              onPrev={handlePrevMonth}
              onNext={handleNextMonth}
            />
          </Box>

          {/* Month grid */}
          <MonthView
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            events={events}
            onSelectDay={handleSelectDay}
          />
        </Box>
      </Box>

      {/* Undo/Redo buttons - between mic and + FAB */}
      <UndoRedoButtons />

      {/* FAB - floating add button */}
      <Box
        as="button"
        position="fixed"
        bottom={{ base: "calc(80px + env(safe-area-inset-bottom, 0px))", md: "24px" }}
        right={{ base: "20px", md: "24px" }}
        w="54px"
        h="54px"
        borderRadius="full"
        bg="linear-gradient(135deg, #FF8FA3 0%, #FFB38A 100%)"
        color="white"
        shadow="0 4px 20px 0 rgba(255, 143, 163, 0.3), 0 1px 4px 0 rgba(0,0,0,0.06)"
        display="flex"
        alignItems="center"
        justifyContent="center"
        _hover={{ transform: "scale(1.08)", shadow: "0 6px 28px 0 rgba(255, 143, 163, 0.4), 0 2px 8px 0 rgba(0,0,0,0.08)" }}
        _active={{ transform: "scale(0.94)" }}
        transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
        zIndex="10"
        className="sm-kbd-hide"
        data-kbd-open={kbdOpen ? "true" : undefined}
        onClick={() => {
          setEditingEvent(null);
          setSelectedDate(selectedDate || dayjs().format("YYYY-MM-DD"));
          setShowEventForm(true);
        }}
        aria-label="Dodaj wydarzenie"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </Box>

      {/* Event form drawer (create/edit) */}
      <EventFormDrawer
        isOpen={showEventForm}
        onClose={handleCloseEventForm}
        event={editingEvent}
        selectedDate={selectedDate}
        onSave={handleSave}
        onDelete={handleDelete}
        isSaving={createEvent.isPending || updateEvent.isPending}
        templateMode={templateMode}
      />

      {/* Quick Add template editor */}
      <QuickAddEditor
        open={showTemplateEditor}
        onClose={() => setShowTemplateEditor(false)}
        templates={allTemplates}
        onSave={handleSaveTemplates}
      />
    </Box>
  );
}
