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

export default function MonthView({ currentMonth, selectedDate, events = [], onSelectDay }) {
  const startOfMonth = dayjs(currentMonth).startOf("month");
  const endOfMonth = dayjs(currentMonth).endOf("month");
  const startDow = (startOfMonth.day() + 6) % 7;
  const daysInMonth = endOfMonth.date();

  const prevMonth = startOfMonth.subtract(1, "month");
  const prevDays = prevMonth.daysInMonth();
  const today = dayjs().format("YYYY-MM-DD");

  const cells = [];

  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevDays - i;
    const date = prevMonth.date(d).format("YYYY-MM-DD");
    cells.push({ day: d, date, isCurrentMonth: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = startOfMonth.date(d).format("YYYY-MM-DD");
    cells.push({ day: d, date, isCurrentMonth: true });
  }

  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    const nextMonth = endOfMonth.add(1, "day");
    for (let d = 1; d <= remaining; d++) {
      const date = nextMonth.date(d).format("YYYY-MM-DD");
      cells.push({ day: d, date, isCurrentMonth: false });
    }
  }

  // Group events by date
  const eventsByDate = {};
  events.forEach((event) => {
    const eventDate = dayjs(event.start_at || event.start_datetime || event.start_date).format("YYYY-MM-DD");
    if (!eventsByDate[eventDate]) eventsByDate[eventDate] = [];
    eventsByDate[eventDate].push(event);
  });

  // Sort events within each day by start time
  Object.values(eventsByDate).forEach((dayEvts) => {
    dayEvts.sort((a, b) => {
      const aTime = a.start_at || a.start_datetime || a.start_date || "";
      const bTime = b.start_at || b.start_datetime || b.start_date || "";
      return aTime.localeCompare(bTime);
    });
  });

  return (
    <Box
      bg="white"
      overflow="hidden"
    >
      {/* Day headers */}
      <Grid templateColumns="repeat(7, 1fr)" gap="0" bg="sky.50">
        {DAY_HEADERS.map((h, i) => (
          <Box key={h} textAlign="center" py="2">
            <Text
              fontSize="11px"
              fontWeight="700"
              color={i >= 5 ? "rose.400" : "sky.500"}
              textTransform="uppercase"
              letterSpacing="0.5px"
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

          return (
            <Box
              key={cell.date}
              cursor="pointer"
              bg={
                isSelected
                  ? "sky.50"
                  : isWeekend && cell.isCurrentMonth
                    ? "rgba(255, 240, 247, 0.4)"
                    : "white"
              }
              _hover={{ bg: isSelected ? "sky.50" : "gray.50" }}
              onClick={() => onSelectDay(cell.date)}
              position="relative"
              minH={{ base: "64px", md: "80px" }}
              px="2px"
              pt="1px"
              pb="3px"
              overflow="hidden"
              transition="background 0.15s"
              borderBottom="1px solid"
              borderRight={colIndex < 6 ? "1px solid" : "none"}
              borderColor="gray.50"
            >
              {/* Day number */}
              <Flex justify="flex-end" px="1" mb="1px">
                {isToday ? (
                  <Flex
                    align="center"
                    justify="center"
                    w={{ base: "22px", md: "26px" }}
                    h={{ base: "22px", md: "26px" }}
                    borderRadius="full"
                    bg="sky.400"
                  >
                    <Text
                      fontSize={{ base: "10px", md: "12px" }}
                      fontWeight="700"
                      color="white"
                      lineHeight="1"
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
                          ? "rose.400"
                          : "#2B5EA7"
                    }
                    lineHeight={{ base: "22px", md: "26px" }}
                    px="2px"
                  >
                    {cell.day}
                  </Text>
                )}
              </Flex>

              {/* Event bars */}
              <Flex direction="column" gap="1px">
                {dayEvents.slice(0, MAX_VISIBLE_MOBILE).map((ev, i) => (
                  <EventBar key={ev.id || i} event={ev} />
                ))}
                {dayEvents.length > MAX_VISIBLE_MOBILE &&
                  dayEvents.slice(MAX_VISIBLE_MOBILE, MAX_VISIBLE_DESKTOP).map((ev, i) => (
                    <Box key={ev.id || `extra-${i}`} display={{ base: "none", md: "block" }}>
                      <EventBar event={ev} />
                    </Box>
                  ))}
                {/* Overflow indicator */}
                {dayEvents.length > MAX_VISIBLE_DESKTOP && (
                  <Text
                    fontSize="9px"
                    color="gray.400"
                    fontWeight="600"
                    px="3px"
                    lineHeight="1.2"
                    display={{ base: "none", md: "block" }}
                  >
                    +{dayEvents.length - MAX_VISIBLE_DESKTOP}
                  </Text>
                )}
                {dayEvents.length > MAX_VISIBLE_MOBILE && (
                  <Text
                    fontSize="9px"
                    color="gray.400"
                    fontWeight="600"
                    px="3px"
                    lineHeight="1.2"
                    display={{ base: "block", md: dayEvents.length <= MAX_VISIBLE_DESKTOP ? "block" : "none" }}
                  >
                    {dayEvents.length > MAX_VISIBLE_DESKTOP ? null : `+${dayEvents.length - MAX_VISIBLE_MOBILE}`}
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
                  h="2px"
                  borderRadius="full"
                  bg="sky.400"
                />
              )}
            </Box>
          );
        })}
      </Grid>
    </Box>
  );
}

function EventBar({ event }) {
  const colors = getColors(event.color);
  const icon = getIconEmoji(event.icon);

  return (
    <Flex
      align="center"
      gap="2px"
      px="3px"
      py="1px"
      borderRadius="3px"
      bg={colors.bg}
      overflow="hidden"
      minH="16px"
      maxH="16px"
      mx="1px"
    >
      {icon ? (
        <Text fontSize="8px" lineHeight="1" flexShrink={0}>
          {icon}
        </Text>
      ) : (
        <Box
          w="5px"
          h="5px"
          borderRadius="full"
          bg={colors.dot}
          flexShrink={0}
        />
      )}
      <Text
        fontSize={{ base: "8px", md: "9px" }}
        fontWeight="600"
        color={colors.text}
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
        lineHeight="1.2"
      >
        {event.title}
      </Text>
    </Flex>
  );
}
