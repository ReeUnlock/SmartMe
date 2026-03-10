import { Box, Flex, Icon, Text, SimpleGrid } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
  LuCalendar,
  LuShoppingCart,
  LuWallet,
  LuTarget,
  LuChevronRight,
} from "react-icons/lu";
import { useEvents } from "../../hooks/useCalendar";
import { useShoppingLists } from "../../hooks/useShopping";
import { useSummary } from "../../hooks/useExpenses";
import { usePlansSummary } from "../../hooks/usePlans";

function getTodayRange() {
  const str = new Date().toISOString().split("T")[0];
  return { start: str, end: str };
}

function formatCurrency(val) {
  if (!val && val !== 0) return "0 zł";
  return `${Math.round(val)} zł`;
}

function getNextEvent(events) {
  if (!events || events.length === 0) return null;
  const now = new Date();
  const upcoming = events
    .filter((e) => new Date(e.start_at) >= now)
    .sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  return upcoming[0] || events[0];
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Widget({ icon, label, color, bg, borderColor, path, children }) {
  const navigate = useNavigate();

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      borderWidth="1.5px"
      borderColor={borderColor}
      shadow="0 1px 8px 0 rgba(0,0,0,0.03)"
      cursor="pointer"
      transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        transform: "translateY(-2px)",
        shadow: `0 6px 20px 0 ${color}18`,
        borderColor: color,
      }}
      _active={{ transform: "scale(0.97)" }}
      onClick={() => navigate(path)}
      overflow="hidden"
    >
      {/* Top color accent */}
      <Box h="3px" bg={color} opacity={0.5} />

      <Box px={3.5} py={3}>
        <Flex align="center" justify="space-between" mb={2}>
          <Flex align="center" gap={2}>
            <Flex
              align="center"
              justify="center"
              w="30px"
              h="30px"
              borderRadius="lg"
              bg={bg}
            >
              <Icon as={icon} boxSize="15px" color={color} strokeWidth="2.5" />
            </Flex>
            <Text fontSize="xs" fontWeight="700" color="gray.600" letterSpacing="0.02em">
              {label}
            </Text>
          </Flex>
          <Icon as={LuChevronRight} boxSize="14px" color="gray.300" />
        </Flex>

        <Box minH="32px">{children}</Box>
      </Box>
    </Box>
  );
}

function CalendarWidget() {
  const { start, end } = getTodayRange();
  const { data: events, isLoading } = useEvents(start, end);

  const count = events?.length || 0;
  const next = getNextEvent(events);

  return (
    <Widget
      icon={LuCalendar}
      label="Kalendarz"
      color="#339AF0"
      bg="#E7F5FF"
      borderColor="#D0EBFF"
      path="/kalendarz"
    >
      {isLoading ? (
        <Text fontSize="xs" color="gray.400">{"Ładowanie..."}</Text>
      ) : count === 0 ? (
        <Text fontSize="xs" color="gray.400" fontWeight="500">{"Brak wydarzeń na dziś"}</Text>
      ) : (
        <>
          <Text fontSize="lg" fontWeight="800" color="sky.600" lineHeight="1">
            {count}
          </Text>
          <Text fontSize="2xs" color="gray.500" fontWeight="500" mt={0.5}>
            {count === 1 ? "wydarzenie" : count < 5 ? "wydarzenia" : "wydarzeń"}
            {next && !next.all_day && ` · ${formatTime(next.start_at)}`}
          </Text>
        </>
      )}
    </Widget>
  );
}

function ShoppingWidget() {
  const { data: lists, isLoading } = useShoppingLists();

  const unchecked = lists
    ?.flatMap((l) => l.items || [])
    .filter((i) => !i.is_checked).length || 0;
  const totalLists = lists?.filter((l) => !l.is_completed).length || 0;

  return (
    <Widget
      icon={LuShoppingCart}
      label="Zakupy"
      color="#20C997"
      bg="#E6FCF5"
      borderColor="#C3FAE8"
      path="/zakupy"
    >
      {isLoading ? (
        <Text fontSize="xs" color="gray.400">{"Ładowanie..."}</Text>
      ) : unchecked === 0 ? (
        <Text fontSize="xs" color="gray.400" fontWeight="500">{"Lista pusta"}</Text>
      ) : (
        <>
          <Text fontSize="lg" fontWeight="800" color="sage.600" lineHeight="1">
            {unchecked}
          </Text>
          <Text fontSize="2xs" color="gray.500" fontWeight="500" mt={0.5}>
            {`do kupienia · ${totalLists} ${totalLists === 1 ? "lista" : "listy"}`}
          </Text>
        </>
      )}
    </Widget>
  );
}

function ExpensesWidget() {
  const now = new Date();
  const { data: summary, isLoading } = useSummary(now.getFullYear(), now.getMonth() + 1);

  const total = summary?.total || 0;
  const budget = summary?.budget;

  const monthName = now.toLocaleDateString("pl-PL", { month: "long" });

  return (
    <Widget
      icon={LuWallet}
      label="Wydatki"
      color="#F47340"
      bg="#FFF4ED"
      borderColor="#FFE8D6"
      path="/wydatki"
    >
      {isLoading ? (
        <Text fontSize="xs" color="gray.400">{"Ładowanie..."}</Text>
      ) : total === 0 ? (
        <Text fontSize="xs" color="gray.400" fontWeight="500">{"Brak wydatków"}</Text>
      ) : (
        <>
          <Text fontSize="lg" fontWeight="800" color="peach.600" lineHeight="1">
            {formatCurrency(total)}
          </Text>
          <Text fontSize="2xs" color="gray.500" fontWeight="500" mt={0.5}>
            {budget ? `z ${formatCurrency(budget)} · ${monthName}` : monthName}
          </Text>
        </>
      )}
    </Widget>
  );
}

function PlansWidget() {
  const { data: summary, isLoading } = usePlansSummary();

  const active = summary?.active_goals || 0;
  const deadlines = summary?.upcoming_deadlines?.length || 0;

  return (
    <Widget
      icon={LuTarget}
      label="Cele"
      color="#E64980"
      bg="#FFF0F7"
      borderColor="#FFDEEB"
      path="/plany"
    >
      {isLoading ? (
        <Text fontSize="xs" color="gray.400">{"Ładowanie..."}</Text>
      ) : active === 0 ? (
        <Text fontSize="xs" color="gray.400" fontWeight="500">{"Brak aktywnych celów"}</Text>
      ) : (
        <>
          <Text fontSize="lg" fontWeight="800" color="rose.500" lineHeight="1">
            {active}
          </Text>
          <Text fontSize="2xs" color="gray.500" fontWeight="500" mt={0.5}>
            {active === 1 ? "aktywny cel" : active < 5 ? "aktywne cele" : "aktywnych celów"}
            {deadlines > 0 && ` · ${deadlines} z deadlinem`}
          </Text>
        </>
      )}
    </Widget>
  );
}

export default function DashboardWidgets() {
  return (
    <SimpleGrid columns={2} gap={3}>
      <CalendarWidget />
      <ShoppingWidget />
      <ExpensesWidget />
      <PlansWidget />
    </SimpleGrid>
  );
}
