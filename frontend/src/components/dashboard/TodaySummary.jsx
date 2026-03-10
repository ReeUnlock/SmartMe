import { Box, Flex, Text, Icon } from "@chakra-ui/react";
import { LuCalendar, LuShoppingCart, LuSun } from "react-icons/lu";
import { useEvents } from "../../hooks/useCalendar";
import { useShoppingLists } from "../../hooks/useShopping";

function getTodayRange() {
  const now = new Date();
  const str = now.toISOString().split("T")[0];
  return { start: str, end: str };
}

function buildSummaryParts(eventsCount, shoppingCount) {
  const parts = [];
  if (eventsCount > 0) {
    const w = eventsCount === 1 ? "wydarzenie" : eventsCount < 5 ? "wydarzenia" : "wydarzeń";
    parts.push(`${eventsCount} ${w}`);
  }
  if (shoppingCount > 0) {
    const w = shoppingCount === 1 ? "rzecz" : shoppingCount < 5 ? "rzeczy" : "rzeczy";
    parts.push(`${shoppingCount} ${w} na liście zakupów`);
  }
  return parts;
}

export default function TodaySummary() {
  const { start, end } = getTodayRange();
  const { data: events, isLoading: eventsLoading } = useEvents(start, end);
  const { data: lists, isLoading: listsLoading } = useShoppingLists();

  const eventsCount = events?.length || 0;
  const shoppingCount = lists
    ?.flatMap((l) => l.items || [])
    .filter((i) => !i.is_checked).length || 0;

  const isLoading = eventsLoading || listsLoading;
  const parts = buildSummaryParts(eventsCount, shoppingCount);

  let summaryText;
  if (isLoading) {
    summaryText = "Ładowanie...";
  } else if (parts.length === 0) {
    summaryText = "Dziś masz wolne — ciesz się dniem!";
  } else {
    summaryText = `Dziś masz ${parts.join(" i ")}`;
  }

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      px={4}
      py={4}
      shadow="0 1px 8px 0 rgba(0,0,0,0.04)"
      borderWidth="1px"
      borderColor="gray.100"
    >
      <Flex align="center" gap={2} mb={2.5}>
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
          {"Dzisiaj"}
        </Text>
      </Flex>

      <Text fontSize="sm" color="gray.600" lineHeight="1.6" fontWeight="500">
        {summaryText}
      </Text>

      {!isLoading && (eventsCount > 0 || shoppingCount > 0) && (
        <Flex gap={3} mt={3} flexWrap="wrap">
          {eventsCount > 0 && (
            <Flex
              align="center"
              gap={1.5}
              px={2.5}
              py={1}
              bg="sky.50"
              borderRadius="full"
            >
              <Icon as={LuCalendar} boxSize="12px" color="sky.500" strokeWidth="2.5" />
              <Text fontSize="xs" fontWeight="600" color="sky.700">
                {`${eventsCount} ${eventsCount === 1 ? "wydarzenie" : "wydarzeń"}`}
              </Text>
            </Flex>
          )}
          {shoppingCount > 0 && (
            <Flex
              align="center"
              gap={1.5}
              px={2.5}
              py={1}
              bg="sage.50"
              borderRadius="full"
            >
              <Icon as={LuShoppingCart} boxSize="12px" color="sage.500" strokeWidth="2.5" />
              <Text fontSize="xs" fontWeight="600" color="sage.700">
                {`${shoppingCount} do kupienia`}
              </Text>
            </Flex>
          )}
        </Flex>
      )}
    </Box>
  );
}
