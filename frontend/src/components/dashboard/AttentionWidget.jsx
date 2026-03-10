import { Box, Flex, Text, Icon } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
  LuBell,
  LuTarget,
  LuTrendingDown,
  LuShoppingCart,
  LuChevronRight,
} from "react-icons/lu";
import { useGoals } from "../../hooks/usePlans";
import { useShoppingLists } from "../../hooks/useShopping";

function formatDeadlineDays(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "po terminie!";
  if (diffDays === 0) return "dzisiaj!";
  if (diffDays === 1) return "jutro";
  if (diffDays <= 3) return `za ${diffDays} dni`;
  if (diffDays <= 7) return `za ${diffDays} dni`;
  return `za ${Math.ceil(diffDays / 7)} tyg.`;
}

function AttentionItem({ icon, iconColor, iconBg, text, detail, path }) {
  const navigate = useNavigate();

  return (
    <Flex
      align="center"
      gap={2.5}
      py={2}
      px={2.5}
      borderRadius="xl"
      cursor="pointer"
      transition="all 0.15s"
      _hover={{ bg: "gray.50" }}
      onClick={(e) => {
        e.stopPropagation();
        navigate(path);
      }}
      _notLast={{ mb: 1 }}
    >
      <Flex
        align="center"
        justify="center"
        w="26px"
        h="26px"
        borderRadius="lg"
        bg={iconBg}
        flexShrink={0}
      >
        <Icon as={icon} boxSize="12px" color={iconColor} strokeWidth="2.5" />
      </Flex>
      <Box flex="1" minW={0}>
        <Text fontSize="xs" fontWeight="600" color="textPrimary" noOfLines={1}>
          {text}
        </Text>
        <Text fontSize="2xs" color="gray.400" fontWeight="500">
          {detail}
        </Text>
      </Box>
      <Icon as={LuChevronRight} boxSize="12px" color="gray.300" flexShrink={0} />
    </Flex>
  );
}

export default function AttentionWidget() {
  const { data: goals, isLoading: goalsLoading } = useGoals();
  const { data: lists, isLoading: listsLoading } = useShoppingLists();

  const isLoading = goalsLoading || listsLoading;

  // Build attention items (max 3 total)
  const items = [];

  if (!isLoading) {
    const activeGoals = (goals || []).filter((g) => !g.is_completed);

    // 1. Spending limits near/over 90%
    for (const goal of activeGoals) {
      if (items.length >= 3) break;
      if (goal.goal_type === "spending_limit" && goal.target_value) {
        const spent = goal.computed_expense_total || 0;
        const pct = Math.round((spent / goal.target_value) * 100);
        if (pct >= 90) {
          items.push({
            icon: LuTrendingDown,
            iconColor: pct >= 100 ? "red.500" : "orange.500",
            iconBg: pct >= 100 ? "red.50" : "orange.50",
            text: goal.title,
            detail: `${pct}% limitu (${Math.round(spent)} / ${Math.round(goal.target_value)} zł)`,
            path: "/plany",
          });
        }
      }
    }

    // 2. Upcoming goal deadlines (within 7 days)
    const today = new Date();
    for (const goal of activeGoals) {
      if (items.length >= 3) break;
      if (goal.deadline) {
        const d = new Date(goal.deadline + "T00:00:00");
        const diffDays = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) {
          items.push({
            icon: LuTarget,
            iconColor: diffDays <= 1 ? "orange.500" : "rose.400",
            iconBg: diffDays <= 1 ? "orange.50" : "rose.50",
            text: goal.title,
            detail: `Deadline ${formatDeadlineDays(goal.deadline)}`,
            path: "/plany",
          });
        }
      }
    }

    // 3. Shopping lists with many unchecked items (>5)
    const activeLists = (lists || []).filter((l) => !l.is_completed);
    for (const list of activeLists) {
      if (items.length >= 3) break;
      const unchecked = (list.items || []).filter((i) => !i.is_checked).length;
      if (unchecked >= 5) {
        items.push({
          icon: LuShoppingCart,
          iconColor: "sage.500",
          iconBg: "sage.50",
          text: list.name,
          detail: `${unchecked} rzeczy do kupienia`,
          path: "/zakupy",
        });
      }
    }
  }

  // Don't render widget if no attention items
  if (!isLoading && items.length === 0) return null;

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      shadow="0 1px 8px 0 rgba(0,0,0,0.04)"
      borderWidth="1px"
      borderColor="gray.100"
      overflow="hidden"
    >
      {/* Header */}
      <Flex align="center" gap={2} px={4} pt={3.5} pb={1}>
        <Flex
          align="center"
          justify="center"
          w="28px"
          h="28px"
          borderRadius="lg"
          bg="orange.50"
        >
          <Icon as={LuBell} boxSize="14px" color="orange.400" strokeWidth="2.5" />
        </Flex>
        <Text fontSize="sm" fontWeight="700" color="textSecondary">
          {"Wymaga uwagi"}
        </Text>
      </Flex>

      {/* Content */}
      <Box px={2.5} pb={3}>
        {isLoading ? (
          <Text fontSize="sm" color="gray.400" fontWeight="500" py={2} px={2}>
            {"Ładowanie..."}
          </Text>
        ) : (
          items.map((item, i) => <AttentionItem key={i} {...item} />)
        )}
      </Box>
    </Box>
  );
}
