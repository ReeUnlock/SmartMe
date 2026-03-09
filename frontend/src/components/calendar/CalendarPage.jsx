import { useState, useCallback } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import dayjs from "dayjs";
import "dayjs/locale/pl";

import CalendarHeader from "./CalendarHeader";
import MonthView from "./MonthView";
import DayDetailView from "./DayDetailView";
import DayEventsDrawer from "./DayEventsDrawer";
import EventFormDrawer from "./EventFormDrawer";
import UndoRedoButtons from "./UndoRedoButtons";
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from "../../hooks/useCalendar";

dayjs.locale("pl");

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf("month"));
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [showDayDrawer, setShowDayDrawer] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // Fetch events for current month (with padding for prev/next month days)
  const rangeStart = currentMonth.subtract(7, "day").format("YYYY-MM-DD");
  const rangeEnd = currentMonth.endOf("month").add(7, "day").format("YYYY-MM-DD");
  const { data: events = [], isLoading } = useEvents(rangeStart, rangeEnd);

  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

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
    setShowEventForm(true);
  }, []);

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
    [createEvent, updateEvent, editingEvent]
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

  const handleCloseDayDrawer = useCallback(() => {
    setShowDayDrawer(false);
  }, []);

  const handleCloseEventForm = useCallback(() => {
    setShowEventForm(false);
    setEditingEvent(null);
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
      <Box mb="4">
        <Text
          fontSize="xs"
          fontWeight="700"
          color="sky.500"
          textTransform="uppercase"
          letterSpacing="1px"
          px="1"
          mb="2"
        >
          {"\u{1F4C5} Przegl\u0105d dnia"}
        </Text>
        <Box
          borderWidth="1px"
          borderColor="gray.100"
          borderRadius="xl"
          bg="white"
          overflow="hidden"
          shadow="0 1px 4px 0 rgba(0,0,0,0.03)"
        >
          {selectedDate && (
            <DayDetailView
              selectedDate={selectedDate}
              events={events}
              onDateChange={handleDayDetailDateChange}
              onEditEvent={handleEditEvent}
              onAddEvent={handleAddEvent}
              onQuickAdd={handleQuickAdd}
            />
          )}
        </Box>
      </Box>

      {/* === MONTH SECTION === */}
      <Box>
        <Text
          fontSize="xs"
          fontWeight="700"
          color="sky.500"
          textTransform="uppercase"
          letterSpacing="1px"
          px="1"
          mb="2"
        >
          {"\u{1F5D3}\uFE0F Przegl\u0105d miesi\u0105ca"}
        </Text>
        <Box
          borderWidth="1px"
          borderColor="gray.100"
          borderRadius="xl"
          overflow="hidden"
          shadow="0 1px 4px 0 rgba(0,0,0,0.03)"
        >
          {/* Header with month navigation */}
          <Box bg="white" px="2" pt="2" pb="1">
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
        bottom={{ base: "90px", md: "24px" }}
        right={{ base: "20px", md: "24px" }}
        w="52px"
        h="52px"
        borderRadius="full"
        bg="rose.400"
        color="white"
        shadow="0 2px 12px 0 rgba(231, 73, 128, 0.3)"
        display="flex"
        alignItems="center"
        justifyContent="center"
        _hover={{ bg: "rose.500", transform: "scale(1.05)" }}
        _active={{ transform: "scale(0.95)" }}
        transition="all 0.15s"
        zIndex="10"
        onClick={() => {
          setEditingEvent(null);
          setSelectedDate(selectedDate || dayjs().format("YYYY-MM-DD"));
          setShowEventForm(true);
        }}
        aria-label="Dodaj wydarzenie"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </Box>

      {/* Day events drawer */}
      <DayEventsDrawer
        isOpen={showDayDrawer}
        onClose={handleCloseDayDrawer}
        selectedDate={selectedDate}
        events={events}
        onAddEvent={handleAddEvent}
        onEditEvent={handleEditEvent}
      />

      {/* Event form drawer (create/edit) */}
      <EventFormDrawer
        isOpen={showEventForm}
        onClose={handleCloseEventForm}
        event={editingEvent}
        selectedDate={selectedDate}
        onSave={handleSave}
        onDelete={handleDelete}
        isSaving={createEvent.isPending || updateEvent.isPending}
      />
    </Box>
  );
}
