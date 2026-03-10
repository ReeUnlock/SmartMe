import { memo, useMemo } from "react";
import { Box, Grid, Text, Flex } from "@chakra-ui/react";
import dayjs from "dayjs";
import "dayjs/locale/pl";
import { getIconEmoji } from "./eventIcons";

dayjs.locale("pl");

const DAY_HEADERS = ["Pn", "Wt", "\u015ar", "Cz", "Pt", "So", "Nd"];

const EVENT_COLORS = {
  sky: { bg: "#D0EBFF", dot: "#339AF0", text: "#1864AB" },
  lavender: { bg: "#E5DBFF", dot: "#845EF7", text: "#5F3DC4" },
  peach: { bg: "#FFE8D6", dot: "#F47340", text: "#9E3D1B" },
  sage: { bg: "#C3FAE8", dot: "#20C997", text: "#087F5B" },
  rose: { bg: "#FFDEEB", dot: "#E64980", text: "#8C1941" },
  yellow: { bg: "#FFF3BF", dot: "#FAB005", text: "#8B6914" },
  red: { bg: "#FFE0E0", dot: "#F03E3E", text: "#C92A2A" },
  green: { bg: "#D3F9D8", dot: "#40C057", text: "#2B8A3E" },
  pink: { bg: "#FFDEEB", dot: "#F06595", text: "#A61E4D" },
};

function getColors(color) {
  return EVENT_COLORS[color] || EVENT_COLORS.sky;
}

const MAX_VISIBLE_MOBILE = 2;
const MAX_VISIBLE_DESKTOP = 3;

export default memo(function MonthView({ currentMonth, selectedDate, events = [], onSelectDay }) {
  const today = dayjs().format("YYYY-MM-DD");

  const cells = useMemo(() => {
    const startOfMonth = dayjs(currentMonth).startOf("month");
    const endOfMonth = dayjs(currentMonth).endOf("month");
    const startDow = (startOfMonth.day() + 6) % 7;
    const daysInMonth = endOfMonth.date();
    const prevMonth = startOfMonth.subtract(1, "month");
    const prevDays = prevMonth.daysInMonth();

    const result = [];
    for (let i = startDow - 1; i >= 0; i--) {
      const d = prevDays - i;
      result.push({ day: d, date: prevMonth.date(d).format("YYYY-MM-DD"), isCurrentMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      result.push({ day: d, date: startOfMonth.date(d).format("YYYY-MM-DD"), isCurrentMonth: true });
    }
    const remaining = 7 - (result.length % 7);
    if (remaining < 7) {
      const nextMonth = endOfMonth.add(1, "day");
      for (let d = 1; d <= remaining; d++) {
        result.push({ day: d, date: nextMonth.date(d).format("YYYY-MM-DD"), isCurrentMonth: false });
      }
    }
    return result;
  }, [currentMonth]);

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((event) => {
      const eventDate = dayjs(event.start_at || event.start_datetime || event.start_date).format("YYYY-MM-DD");
      if (!map[eventDate]) map[eventDate] = [];
      map[eventDate].push(event);
    });
    Object.values(map).forEach((dayEvts) => {
      dayEvts.sort((a, b) => {
        if (a.all_day && !b.all_day) return -1;
        if (!a.all_day && b.all_day) return 1;
        const aTime = a.start_at || a.start_datetime || a.start_date || "";
        const bTime = b.start_at || b.start_datetime || b.start_date || "";
        return aTime.localeCompare(bTime);
      });
    });
    return map;
  }, [events]);

  return (
    <Box
      bg="white"
      overflow="hidden"
    >
      {/* Day headers */}
      <Grid templateColumns="repeat(7, 1fr)" gap="0" bg="#FFF8F9">
        {DAY_HEADERS.map((h, i) => (
          <Box key={h} textAlign="center" py="2.5">
            <Text
              fontSize="10px"
              fontWeight="700"
              color={i >= 5 ? "#E8879A" : "gray.400"}
              textTransform="uppercase"
              letterSpacing="0.08em"
              fontFamily="'Nunito', sans-serif"
            >
              {h}
            </Text>
          </Box>
        ))}
      </Grid>

      {/* Day cells */}
      <Grid templateColumns="repeat(7, 1fr)" gap="0">
        {cells.map((cell, cellIndex) => {
          const isToday = cell.date === today;
          const isSelected = cell.date === selectedDate;
          const dayEvents = eventsByDate[cell.date] || [];
          const colIndex = cellIndex % 7;
          const isWeekend = colIndex === 5 || colIndex === 6;
          const rowIndex = Math.floor(cellIndex / 7);
          const totalRows = Math.ceil(cells.length / 7);

          return (
            <Box
              key={cell.date}
              cursor="pointer"
              bg={
                isSelected
                  ? "#FFF0F3"
                  : isWeekend && cell.isCurrentMonth
                    ? "#FFF3F6"
                    : "white"
              }
              _hover={{ bg: isSelected ? "#FFF0F3" : isWeekend ? "#FFF0F3" : "#FFFAF9" }}
              onClick={() => onSelectDay(cell.date)}
              position="relative"
              minH={{ base: "68px", md: "82px" }}
              px="3px"
              pt="2px"
              pb="4px"
              overflow="hidden"
              transition="background 0.18s ease"
              borderBottom={rowIndex < totalRows - 1 ? "1px solid" : "none"}
              borderRight={colIndex < 6 ? "1px solid" : "none"}
              borderColor="#F8F2F3"
            >
              {/* Day number */}
              <Flex justify="flex-end" px="1" mb="2px">
                {isToday ? (
                  <Flex
                    align="center"
                    justify="center"
                    w={{ base: "24px", md: "28px" }}
                    h={{ base: "24px", md: "28px" }}
                    borderRadius="full"
                    bg="linear-gradient(135deg, #FF8FA3 0%, #FFB38A 100%)"
                    shadow="0 2px 10px 0 rgba(255, 143, 163, 0.3)"
                  >
                    <Text
                      fontSize={{ base: "10px", md: "12px" }}
                      fontWeight="800"
                      color="white"
                      lineHeight="1"
                      fontFamily="'Nunito', sans-serif"
                    >
                      {cell.day}
                    </Text>
                  </Flex>
                ) : (
                  <Text
                    fontSize={{ base: "11px", md: "12px" }}
                    fontWeight="700"
                    color={
                      !cell.isCurrentMonth
                        ? "gray.300"
                        : isWeekend
                          ? "#E8879A"
                          : "gray.600"
                    }
                    lineHeight={{ base: "24px", md: "28px" }}
                    px="2px"
                    fontFamily="'Nunito', sans-serif"
                  >
                    {cell.day}
                  </Text>
                )}
              </Flex>

              {/* Event bars */}
              <Flex direction="column" gap="2px">
                {dayEvents.slice(0, MAX_VISIBLE_MOBILE).map((ev, i) => (
                  <EventBar key={ev.id || i} event={ev} />
                ))}
                {dayEvents.length > MAX_VISIBLE_MOBILE &&
                  dayEvents.slice(MAX_VISIBLE_MOBILE, MAX_VISIBLE_DESKTOP).map((ev, i) => (
                    <Box key={ev.id || `extra-${i}`} display={{ base: "none", md: "block" }}>
                      <EventBar event={ev} />
                    </Box>
                  ))}
                {/* Overflow indicator — mobile */}
                {dayEvents.length > MAX_VISIBLE_MOBILE && (
                  <Text
                    fontSize="9px"
                    color="#C9A0A8"
                    fontWeight="600"
                    px="3px"
                    lineHeight="1.2"
                    display={{ base: "block", md: "none" }}
                  >
                    +{dayEvents.length - MAX_VISIBLE_MOBILE}
                  </Text>
                )}
                {/* Overflow indicator — desktop */}
                {dayEvents.length > MAX_VISIBLE_DESKTOP && (
                  <Text
                    fontSize="9px"
                    color="#C9A0A8"
                    fontWeight="600"
                    px="3px"
                    lineHeight="1.2"
                    display={{ base: "none", md: "block" }}
                  >
                    +{dayEvents.length - MAX_VISIBLE_DESKTOP}
                  </Text>
                )}
              </Flex>

              {/* Selected indicator - bottom line */}
              {isSelected && (
                <Box
                  position="absolute"
                  bottom="0"
                  left="10%"
                  right="10%"
                  h="2.5px"
                  borderRadius="full"
                  bg="linear-gradient(90deg, #FF8FA3, #FFB38A)"
                />
              )}
            </Box>
          );
        })}
      </Grid>
    </Box>
  );
});

const EventBar = memo(function EventBar({ event }) {
  const colors = getColors(event.color);
  const icon = getIconEmoji(event.icon);
  const isAllDay = event.all_day;
  const isRecurring = !!event.rrule;

  return (
    <Flex
      align="center"
      gap="2px"
      px="4px"
      py="1.5px"
      borderRadius="6px"
      bg={isAllDay ? colors.dot : colors.bg}
      overflow="hidden"
      minH="17px"
      maxH="17px"
      mx="1px"
      opacity={0.95}
      transition="opacity 0.15s"
    >
      {icon ? (
        <Text fontSize="8px" lineHeight="1" flexShrink={0}>
          {icon}
        </Text>
      ) : (
        <Box
          w="4px"
          h="4px"
          borderRadius="full"
          bg={isAllDay ? "whiteAlpha.700" : colors.dot}
          flexShrink={0}
        />
      )}
      <Text
        fontSize={{ base: "8px", md: "9px" }}
        fontWeight="600"
        color={isAllDay ? "white" : colors.text}
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
        lineHeight="1.2"
        flex="1"
        letterSpacing="0.01em"
      >
        {event.title}
      </Text>
      {isRecurring && (
        <Text fontSize="7px" lineHeight="1" flexShrink={0} opacity={0.6}>
          {"🔁"}
        </Text>
      )}
    </Flex>
  );
});
