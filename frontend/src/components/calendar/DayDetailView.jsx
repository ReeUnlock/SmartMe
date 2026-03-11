import { useRef, useState, useCallback, useEffect } from "react";
import { Box, Flex, Text, VStack } from "@chakra-ui/react";
import dayjs from "dayjs";
import "dayjs/locale/pl";
import EventChip from "./EventChip";
import { getIconEmoji } from "./eventIcons";
import { useQuickTemplates } from "../../hooks/useQuickTemplates";

dayjs.locale("pl");

const SWIPE_THRESHOLD = 50;

export default function DayDetailView({
  selectedDate,
  events = [],
  onDateChange,
  onEditEvent,
  onAddEvent,
  onAddTemplate,
  onQuickAdd,
  onEditTemplates,
}) {
  const quickTemplates = useQuickTemplates((s) => s.templates);

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

  const animFrameRef = useRef(null);
  const timeoutRef = useRef(null);

  // Cleanup animation frame and timeout on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, []);

  const goToDay = useCallback(
    (direction) => {
      setTransitioning(true);
      setSwipeOffset(direction === "left" ? -300 : 300);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        const newDate = direction === "left"
          ? date.add(1, "day").format("YYYY-MM-DD")
          : date.subtract(1, "day").format("YYYY-MM-DD");
        onDateChange(newDate);
        setSwipeOffset(direction === "left" ? 300 : -300);
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = requestAnimationFrame(() => {
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
      px="3.5"
      pt="4"
      pb="3.5"
      overflow="hidden"
    >
      {/* Date header with arrows */}
      <Flex align="center" justify="space-between" mb="3" px="1">
        <Box
          as="button"
          p="2"
          borderRadius="full"
          color="#C9A0A8"
          _hover={{ bg: "#FFF3F6", color: "#E8879A" }}
          onClick={() => goToDay("right")}
          aria-label="Poprzedni dzień"
          transition="all 0.15s"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Box>

        <Box textAlign="center">
          <Text fontSize="sm" fontWeight="700" color="textSecondary" fontFamily="'Nunito', sans-serif">
            {displayLabel}
          </Text>
          {isToday && (
            <Text fontSize="xs" color="#FF8FA3" fontWeight="700" fontFamily="'Nunito', sans-serif">
              dzisiaj
            </Text>
          )}
        </Box>

        <Box
          as="button"
          p="2"
          borderRadius="full"
          color="#C9A0A8"
          _hover={{ bg: "#FFF3F6", color: "#E8879A" }}
          onClick={() => goToDay("left")}
          aria-label="Następny dzień"
          transition="all 0.15s"
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
          <Flex direction="column" align="center" py="6" gap="2">
            <Text fontSize="2xl" lineHeight="1" opacity={0.5}>{"📅"}</Text>
            <Text color="#C9A0A8" fontSize="sm" fontWeight="600">
              {isToday ? "Brak wydarzeń na dziś" : "Brak wydarzeń"}
            </Text>
            <Text color="#D4B5BB" fontSize="xs">
              {"Dodaj coś do swojego dnia"}
            </Text>
          </Flex>
        ) : (
          <VStack gap="2.5" align="stretch" mb="3">
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
        <Box mt="3">
          <Flex align="center" justify="center" gap="2" mb="2.5" position="relative">
            <Text fontSize="10px" fontWeight="700" color="#C9A0A8" textAlign="center" letterSpacing="0.06em" fontFamily="'Nunito', sans-serif" textTransform="uppercase">
              {"Szybkie dodawanie"}
            </Text>
            <Text
              as="button"
              type="button"
              fontSize="10px"
              fontWeight="600"
              color="#D4B5BB"
              _hover={{ color: "#FF8FA3" }}
              transition="color 0.15s"
              position="absolute"
              right="0"
              onClick={onEditTemplates}
              letterSpacing="0.02em"
            >
              {"Edytuj"}
            </Text>
          </Flex>
          <Flex gap="2" flexWrap="wrap" justifyContent="center">
            {quickTemplates.map((tpl) => {
              const alreadyExists = usedTitles.has(tpl.title);
              const emoji = getIconEmoji(tpl.icon);
              return (
                <Box
                  key={tpl.id}
                  as="button"
                  px="3.5"
                  py="2"
                  borderRadius="full"
                  bg={alreadyExists ? "gray.50" : "white"}
                  borderWidth="1px"
                  borderColor={alreadyExists ? "gray.100" : "#F5E6EA"}
                  fontSize="xs"
                  fontWeight="600"
                  color={alreadyExists ? "gray.300" : "gray.600"}
                  shadow={alreadyExists ? "none" : "0 1px 6px 0 rgba(0,0,0,0.04)"}
                  _hover={alreadyExists ? {} : { bg: "#FFF3F6", borderColor: "#F0C6D0", shadow: "0 3px 14px 0 rgba(255, 143, 163, 0.1)", transform: "scale(1.03)" }}
                  _active={alreadyExists ? {} : { transform: "scale(0.96)" }}
                  transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
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
                      data.start_at = d.format("YYYY-MM-DD") + "T" + (tpl.startH || "09:00") + ":00";
                      data.end_at = d.format("YYYY-MM-DD") + "T" + (tpl.endH || "10:00") + ":00";
                    }
                    onQuickAdd(data);
                  }}
                >
                  {emoji ? `${emoji} ` : ""}{tpl.label}
                </Box>
              );
            })}
          </Flex>
        </Box>
      </Box>
    </Box>
  );
}
