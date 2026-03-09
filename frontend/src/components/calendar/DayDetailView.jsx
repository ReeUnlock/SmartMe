import { useRef, useState, useCallback } from "react";
import { Box, Flex, Text, VStack } from "@chakra-ui/react";
import dayjs from "dayjs";
import "dayjs/locale/pl";
import EventChip from "./EventChip";

dayjs.locale("pl");

const SWIPE_THRESHOLD = 50;

const EVENT_TEMPLATES = [
  { label: "Szpital", icon: "hospital", emoji: "\u{1F3E5}", color: "sky", title: "Szpital", startH: "08:00", endH: "15:30", allDay: false },
  { label: "Klinika", icon: "stethoscope", emoji: "\u{1FA7A}", color: "yellow", title: "Klinika", startH: "16:00", endH: "20:00", allDay: false },
  { label: "Dzieci", icon: "baby", emoji: "\u{1F476}", color: "peach", title: "Dzieci", startH: "10:00", endH: "12:00", allDay: false },
  { label: "Dy\u017cur", icon: "siren", emoji: "\u{1F6A8}", color: "red", title: "Dy\u017cur", startH: "07:30", endH: "07:30", duration24: true, allDay: false },
  { label: "Zejście", icon: "coffee", emoji: "\u2615", color: "green", title: "Zejście", startH: "07:30", endH: "07:30", duration24: true, allDay: false },
  { label: "Wolne", icon: "flower", emoji: "\u{1F338}", color: "pink", title: "Wolne", startH: null, endH: null, allDay: true },
];

export default function DayDetailView({
  selectedDate,
  events = [],
  onDateChange,
  onEditEvent,
  onAddEvent,
  onQuickAdd,
}) {
  const touchStart = useRef(null);
  const touchEnd = useRef(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const date = dayjs(selectedDate);
  const dateLabel = date.format("dddd, D MMMM YYYY");
  const displayLabel = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);
  const isToday = date.format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD");

  const dayEvents = events
    .filter((ev) => {
      const evDate = dayjs(ev.start_at || ev.start_datetime || ev.start_date).format("YYYY-MM-DD");
      return evDate === selectedDate;
    })
    .sort((a, b) => {
      if (a.all_day && !b.all_day) return -1;
      if (!a.all_day && b.all_day) return 1;
      const aTime = a.start_at || "";
      const bTime = b.start_at || "";
      return aTime.localeCompare(bTime);
    });

  // Titles already used this day (for duplicate prevention)
  const usedTitles = new Set(dayEvents.map((ev) => ev.title));

  const goToDay = useCallback(
    (direction) => {
      setTransitioning(true);
      setSwipeOffset(direction === "left" ? -300 : 300);
      setTimeout(() => {
        const newDate = direction === "left"
          ? date.add(1, "day").format("YYYY-MM-DD")
          : date.subtract(1, "day").format("YYYY-MM-DD");
        onDateChange(newDate);
        setSwipeOffset(direction === "left" ? 300 : -300);
        requestAnimationFrame(() => {
          setTransitioning(false);
          setSwipeOffset(0);
        });
      }, 150);
    },
    [date, onDateChange]
  );

  const handleTouchStart = (e) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEnd.current = e.targetTouches[0].clientX;
    const diff = touchEnd.current - touchStart.current;
    setSwipeOffset(diff * 0.4);
  };

  const handleTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) {
      setSwipeOffset(0);
      return;
    }
    const diff = touchStart.current - touchEnd.current;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      goToDay(diff > 0 ? "left" : "right");
    } else {
      setSwipeOffset(0);
    }
    touchStart.current = null;
    touchEnd.current = null;
  };

  return (
    <Box
      px="3"
      pt="3"
      pb="3"
      overflow="hidden"
    >
      {/* Date header with arrows */}
      <Flex align="center" justify="space-between" mb="3" px="1">
        <Box
          as="button"
          p="2"
          borderRadius="full"
          color="gray.400"
          _hover={{ bg: "gray.100", color: "gray.600" }}
          onClick={() => goToDay("right")}
          aria-label="Poprzedni dzień"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Box>

        <Box textAlign="center">
          <Text fontSize="sm" fontWeight="600" color="sky.600">
            {displayLabel}
          </Text>
          {isToday && (
            <Text fontSize="xs" color="sky.400" fontWeight="500">
              dzisiaj
            </Text>
          )}
        </Box>

        <Box
          as="button"
          p="2"
          borderRadius="full"
          color="gray.400"
          _hover={{ bg: "gray.100", color: "gray.600" }}
          onClick={() => goToDay("left")}
          aria-label="Następny dzień"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Box>
      </Flex>

      {/* Swipeable content */}
      <Box
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: transitioning ? "transform 0.15s ease-out" : "none",
        }}
        minH="80px"
        px="1"
      >
        {/* Events list */}
        {dayEvents.length === 0 ? (
          <Flex direction="column" align="center" py="4" gap="1">
            <Text color="gray.400" fontSize="sm">
              Brak wydarzeń
            </Text>
          </Flex>
        ) : (
          <VStack gap="2" align="stretch" mb="3">
            {dayEvents.map((ev) => (
              <EventChip
                key={ev.id}
                event={ev}
                onClick={() => onEditEvent(ev)}
              />
            ))}
          </VStack>
        )}

        {/* Quick add templates */}
        <Box mt="2">
          <Text fontSize="10px" fontWeight="600" color="gray.300" mb="2" textAlign="center" textTransform="uppercase" letterSpacing="1px">
            Szybkie dodawanie
          </Text>
          <Flex gap="2" flexWrap="wrap" justifyContent="center">
            {EVENT_TEMPLATES.map((tpl) => {
              const alreadyExists = usedTitles.has(tpl.title);
              return (
                <Box
                  key={tpl.label}
                  as="button"
                  px="3"
                  py="1.5"
                  borderRadius="full"
                  bg={alreadyExists ? "gray.100" : "white"}
                  borderWidth="1px"
                  borderColor={alreadyExists ? "gray.100" : "gray.200"}
                  fontSize="xs"
                  fontWeight="500"
                  color={alreadyExists ? "gray.300" : "gray.600"}
                  shadow={alreadyExists ? "none" : "0 1px 3px 0 rgba(0,0,0,0.04)"}
                  _hover={alreadyExists ? {} : { bg: "rose.50", borderColor: "rose.200" }}
                  _active={alreadyExists ? {} : { transform: "scale(0.95)" }}
                  transition="all 0.15s"
                  cursor={alreadyExists ? "not-allowed" : "pointer"}
                  disabled={alreadyExists}
                  onClick={() => {
                    if (alreadyExists || !onQuickAdd) return;
                    const d = dayjs(selectedDate);
                    const data = {
                      title: tpl.title,
                      color: tpl.color,
                      icon: tpl.icon,
                      all_day: tpl.allDay,
                    };
                    if (tpl.allDay) {
                      data.start_at = d.format("YYYY-MM-DD") + "T00:00:00";
                      data.end_at = d.format("YYYY-MM-DD") + "T23:59:59";
                    } else if (tpl.duration24) {
                      data.start_at = d.format("YYYY-MM-DD") + "T" + tpl.startH + ":00";
                      data.end_at = d.add(1, "day").format("YYYY-MM-DD") + "T" + tpl.endH + ":00";
                    } else {
                      data.start_at = d.format("YYYY-MM-DD") + "T" + tpl.startH + ":00";
                      data.end_at = d.format("YYYY-MM-DD") + "T" + tpl.endH + ":00";
                    }
                    onQuickAdd(data);
                  }}
                >
                  {tpl.emoji} {tpl.label}
                </Box>
              );
            })}
          </Flex>
        </Box>

        {/* Custom add */}
        <Box
          as="button"
          fontSize="sm"
          color="rose.500"
          fontWeight="600"
          textAlign="center"
          py="2"
          mt="3"
          w="full"
          onClick={onAddEvent}
          _hover={{ color: "rose.600" }}
          transition="color 0.15s"
        >
          + Dodaj własne wydarzenie
        </Box>
      </Box>
    </Box>
  );
}
