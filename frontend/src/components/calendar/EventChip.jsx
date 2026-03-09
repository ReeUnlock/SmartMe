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

export default function EventChip({ event, onClick }) {
  const colors = getColors(event.color);
  const isAllDay = event.all_day;
  const startTime = event.start_at || event.start_datetime || event.start_date;
  const time = isAllDay
    ? "Cały dzień"
    : dayjs(startTime).format("HH:mm");
  const icon = getIconEmoji(event.icon);

  return (
    <Flex
      align="center"
      gap="2"
      px="3"
      py="2"
      borderRadius="xl"
      bg={colors.bg}
      cursor="pointer"
      _hover={{ opacity: 0.85 }}
      onClick={onClick}
      transition="opacity 0.15s"
    >
      {icon ? (
        <Text fontSize="sm" lineHeight="1" flexShrink={0}>{icon}</Text>
      ) : (
        <Box w="8px" h="8px" borderRadius="full" bg={colors.dot} flexShrink={0} />
      )}
      <Text fontSize="xs" color="gray.500" fontWeight="500" flexShrink={0}>
        {time}
      </Text>
      <Text
        fontSize="sm"
        fontWeight="500"
        color={colors.text}
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
      >
        {event.title}
      </Text>
    </Flex>
  );
}
