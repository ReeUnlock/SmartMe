import { Box, Flex, Text, Icon } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { LuSun, LuCalendar, LuChevronRight, LuClock } from "react-icons/lu";
import { useEvents } from "../../hooks/useCalendar";

function getTodayRange() {
  const str = new Date().toISOString().split("T")[0];
  return { start: str, end: str };
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EventRow({ event }) {
  const isAllDay = event.all_day;

  return (
    <Flex
      align="center"
      gap={2.5}
      py={2}
      px={2.5}
      borderRadius="xl"
      bg="sky.50"
      _notLast={{ mb: 1.5 }}
    >
      <Flex
        align="center"
        justify="center"
        w="28px"
        h="28px"
        borderRadius="lg"
        bg={event.color || "sky.100"}
        flexShrink={0}
      >
        <Icon as={LuClock} boxSize="13px" color="white" strokeWidth="2.5" />
      </Flex>
      <Box flex="1" minW={0}>
        <Text
          fontSize="sm"
          fontWeight="600"
          color="textPrimary"
          lineHeight="1.3"
          noOfLines={1}
        >
          {event.title}
        </Text>
        {!isAllDay && (
          <Text fontSize="2xs" color="gray.500" fontWeight="500">
            {formatTime(event.start_at)}
          </Text>
        )}
      </Box>
    </Flex>
  );
}

export default function TodayWidget() {
  const navigate = useNavigate();
  const { start, end } = getTodayRange();
  const { data: events, isLoading } = useEvents(start, end);

  const sortedEvents = (events || [])
    .slice()
    .sort((a, b) => {
      if (a.all_day && !b.all_day) return -1;
      if (!a.all_day && b.all_day) return 1;
      return new Date(a.start_at) - new Date(b.start_at);
    });
  const displayEvents = sortedEvents.slice(0, 3);
  const remaining = sortedEvents.length - 3;

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      shadow="0 1px 8px 0 rgba(0,0,0,0.04)"
      borderWidth="1px"
      borderColor="gray.100"
      overflow="hidden"
      cursor="pointer"
      transition="all 0.2s"
      _hover={{
        shadow: "0 2px 12px 0 rgba(51,154,240,0.10)",
        borderColor: "sky.200",
      }}
      onClick={() => navigate("/kalendarz")}
    >
      {/* Header */}
      <Flex align="center" justify="space-between" px={4} pt={3.5} pb={2}>
        <Flex align="center" gap={2}>
          <Flex
            align="center"
            justify="center"
            w="28px"
            h="28px"
            borderRadius="lg"
            bg="sky.50"
          >
            <Icon as={LuSun} boxSize="14px" color="sky.500" strokeWidth="2.5" />
          </Flex>
          <Text fontSize="sm" fontWeight="700" color="textSecondary">
            {"Zaplanowane"}
          </Text>
        </Flex>
        <Flex align="center" gap={1}>
          {sortedEvents.length > 0 && (
            <Flex
              align="center"
              gap={1}
              px={2}
              py={0.5}
              bg="sky.50"
              borderRadius="full"
            >
              <Icon as={LuCalendar} boxSize="11px" color="sky.500" />
              <Text fontSize="2xs" fontWeight="600" color="sky.600">
                {sortedEvents.length}
              </Text>
            </Flex>
          )}
          <Icon as={LuChevronRight} boxSize="14px" color="gray.300" />
        </Flex>
      </Flex>

      {/* Content */}
      <Box px={3.5} pb={3.5}>
        {isLoading ? (
          <Text fontSize="sm" color="gray.400" fontWeight="500" px={0.5}>
            {"Ładowanie..."}
          </Text>
        ) : displayEvents.length === 0 ? (
          <Box px={0.5} py={2}>
            <Text fontSize="sm" color="gray.400" fontWeight="500" lineHeight="1.5">
              {"Brak wydarzeń — ciesz się wolnym dniem ✨"}
            </Text>
          </Box>
        ) : (
          <>
            {displayEvents.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
            {remaining > 0 && (
              <Text fontSize="2xs" color="gray.400" fontWeight="500" mt={1.5} px={1}>
                {`+${remaining} ${remaining === 1 ? "więcej" : "więcej"}`}
              </Text>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
