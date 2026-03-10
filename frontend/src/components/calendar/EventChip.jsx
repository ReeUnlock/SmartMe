import { Box, Flex, Text } from "@chakra-ui/react";
import dayjs from "dayjs";
import { getIconEmoji } from "./eventIcons";

const COLOR_MAP = {
  sky: { bg: "#E7F5FF", dot: "#339AF0", text: "#1971C2" },
  lavender: { bg: "#F3F0FF", dot: "#845EF7", text: "#6741D9" },
  peach: { bg: "#FFF4ED", dot: "#F47340", text: "#C44B20" },
  sage: { bg: "#E6FCF5", dot: "#20C997", text: "#099268" },
  rose: { bg: "#FFF0F7", dot: "#E64980", text: "#A61E4D" },
  yellow: { bg: "#FFF9DB", dot: "#FAB005", text: "#8B6914" },
  red: { bg: "#FFF0F0", dot: "#F03E3E", text: "#C92A2A" },
  green: { bg: "#EBFBEE", dot: "#40C057", text: "#2B8A3E" },
  pink: { bg: "#FFF0F7", dot: "#F06595", text: "#C2255C" },
};

function getColors(color) {
  return COLOR_MAP[color] || COLOR_MAP.sky;
}

const RRULE_LABELS = {
  "FREQ=DAILY": "codziennie",
  "FREQ=WEEKLY": "co tydzie\u0144",
  "FREQ=MONTHLY": "co miesi\u0105c",
  "FREQ=YEARLY": "co rok",
};

function formatTimeRange(event) {
  const start = event.start_at || event.start_datetime || event.start_date;
  if (event.all_day) return null;
  const startStr = dayjs(start).format("HH:mm");
  const end = event.end_at || event.end_datetime || event.end_date;
  if (end) {
    const endStr = dayjs(end).format("HH:mm");
    if (endStr !== startStr) return `${startStr}\u2013${endStr}`;
  }
  return startStr;
}

export default function EventChip({ event, onClick }) {
  const colors = getColors(event.color);
  const isAllDay = event.all_day;
  const timeRange = formatTimeRange(event);
  const icon = getIconEmoji(event.icon);
  const isRecurring = !!event.rrule;
  const rruleLabel = isRecurring ? RRULE_LABELS[event.rrule] || "powtarza si\u0119" : null;

  // All-day events get a distinct banner style
  if (isAllDay) {
    return (
      <Flex
        align="center"
        gap="2.5"
        px="3.5"
        py="2.5"
        borderRadius="14px"
        bg={colors.dot}
        cursor="pointer"
        _hover={{ opacity: 0.9, transform: "translateY(-1px)", shadow: "0 4px 14px rgba(0,0,0,0.12)" }}
        onClick={onClick}
        transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
        shadow="0 2px 10px rgba(0,0,0,0.06)"
      >
        {icon ? (
          <Text fontSize="sm" lineHeight="1" flexShrink={0}>{icon}</Text>
        ) : (
          <Box w="7px" h="7px" borderRadius="full" bg="whiteAlpha.700" flexShrink={0} />
        )}
        <Text
          fontSize="sm"
          fontWeight="600"
          color="white"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
          flex="1"
          letterSpacing="0.01em"
        >
          {event.title}
        </Text>
        <Flex align="center" gap="1.5" flexShrink={0}>
          {isRecurring && (
            <Text fontSize="10px" color="whiteAlpha.800" lineHeight="1" title={rruleLabel}>
              {"🔁"}
            </Text>
          )}
          <Text fontSize="10px" color="whiteAlpha.800" fontWeight="500">
            {"ca\u0142y dzie\u0144"}
          </Text>
        </Flex>
      </Flex>
    );
  }

  return (
    <Flex
      align="center"
      gap="2.5"
      px="3.5"
      py="2.5"
      borderRadius="14px"
      bg={colors.bg}
      cursor="pointer"
      _hover={{ opacity: 0.88, transform: "translateY(-1px)", shadow: "0 3px 12px rgba(0,0,0,0.06)" }}
      onClick={onClick}
      transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
      shadow="0 1px 4px rgba(0,0,0,0.03)"
    >
      {icon ? (
        <Text fontSize="sm" lineHeight="1" flexShrink={0}>{icon}</Text>
      ) : (
        <Box w="7px" h="7px" borderRadius="full" bg={colors.dot} flexShrink={0} />
      )}
      <Text fontSize="xs" color="gray.450" fontWeight="500" flexShrink={0} opacity={0.75}>
        {timeRange}
      </Text>
      <Text
        fontSize="sm"
        fontWeight="600"
        color={colors.text}
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
        flex="1"
        letterSpacing="0.01em"
      >
        {event.title}
      </Text>
      {isRecurring && (
        <Text fontSize="10px" color="gray.400" lineHeight="1" flexShrink={0} title={rruleLabel}>
          {"🔁"}
        </Text>
      )}
    </Flex>
  );
}
