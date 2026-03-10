import { Box, Flex, Text, Icon } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { LuTarget, LuChevronRight, LuTrendingDown } from "react-icons/lu";
import { useGoals } from "../../hooks/usePlans";

function formatDeadline(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "po terminie";
  if (diffDays === 0) return "dzisiaj";
  if (diffDays === 1) return "jutro";
  if (diffDays <= 7) return `za ${diffDays} dni`;
  if (diffDays <= 30) return `za ${Math.ceil(diffDays / 7)} tyg.`;
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

function getProgress(goal) {
  if (goal.goal_type === "spending_limit" && goal.target_value) {
    const spent = goal.computed_expense_total || 0;
    return Math.min(Math.round((spent / goal.target_value) * 100), 100);
  }
  if (goal.target_value) {
    return Math.min(Math.round((goal.current_value / goal.target_value) * 100), 100);
  }
  // Milestone-based progress
  const milestones = goal.milestones || [];
  if (milestones.length === 0) return 0;
  const done = milestones.filter((m) => m.is_completed).length;
  return Math.round((done / milestones.length) * 100);
}

function GoalRow({ goal }) {
  const isSpending = goal.goal_type === "spending_limit";
  const progress = getProgress(goal);
  const deadline = formatDeadline(goal.deadline);

  // Color logic
  let barColor = "rose.300";
  let barBg = "rose.50";
  if (isSpending) {
    barColor = progress >= 90 ? "orange.400" : "peach.300";
    barBg = progress >= 90 ? "orange.50" : "peach.50";
  }

  return (
    <Box py={2} px={1} _notLast={{ borderBottomWidth: "1px", borderColor: "gray.50" }}>
      <Flex align="center" justify="space-between" mb={1.5}>
        <Flex align="center" gap={1.5} flex="1" minW={0}>
          {isSpending && (
            <Icon as={LuTrendingDown} boxSize="12px" color="peach.400" flexShrink={0} />
          )}
          <Text
            fontSize="sm"
            fontWeight="600"
            color="textPrimary"
            lineHeight="1.3"
            noOfLines={1}
          >
            {goal.title}
          </Text>
        </Flex>
        <Text fontSize="2xs" fontWeight="600" color="gray.400" ml={2} flexShrink={0}>
          {`${progress}%`}
        </Text>
      </Flex>

      {/* Progress bar */}
      <Box
        h="6px"
        bg={barBg}
        borderRadius="full"
        overflow="hidden"
      >
        <Box
          h="100%"
          w={`${progress}%`}
          bg={barColor}
          borderRadius="full"
          transition="width 0.4s ease"
        />
      </Box>

      {/* Subtitle */}
      <Flex align="center" justify="space-between" mt={1}>
        <Text fontSize="2xs" color="gray.400" fontWeight="500">
          {isSpending
            ? `${Math.round(goal.computed_expense_total || 0)} / ${Math.round(goal.target_value || 0)} zł`
            : goal.target_value
              ? `${Math.round(goal.current_value)} / ${Math.round(goal.target_value)} ${goal.unit || ""}`
              : goal.milestones?.length
                ? `${goal.milestones.filter((m) => m.is_completed).length} / ${goal.milestones.length} kroków`
                : ""}
        </Text>
        {deadline && (
          <Text fontSize="2xs" color="gray.400" fontWeight="500">
            {deadline}
          </Text>
        )}
      </Flex>
    </Box>
  );
}

export default function GoalsWidget() {
  const navigate = useNavigate();
  const { data: goals, isLoading } = useGoals();

  // Filter active, sort by deadline (closest first), then by progress
  const activeGoals = (goals || [])
    .filter((g) => !g.is_completed)
    .sort((a, b) => {
      // Deadline first (nulls last)
      if (a.deadline && b.deadline) return new Date(a.deadline) - new Date(b.deadline);
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      // Then by progress descending
      return getProgress(b) - getProgress(a);
    })
    .slice(0, 3);

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
        shadow: "0 2px 12px 0 rgba(230,73,128,0.08)",
        borderColor: "rose.200",
      }}
      onClick={() => navigate("/plany")}
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
            bg="rose.50"
          >
            <Icon as={LuTarget} boxSize="14px" color="rose.400" strokeWidth="2.5" />
          </Flex>
          <Text fontSize="sm" fontWeight="700" color="textSecondary">
            {"Cele"}
          </Text>
        </Flex>
        <Icon as={LuChevronRight} boxSize="14px" color="gray.300" />
      </Flex>

      {/* Content */}
      <Box px={3.5} pb={3}>
        {isLoading ? (
          <Text fontSize="sm" color="gray.400" fontWeight="500" py={2} px={0.5}>
            {"Ładowanie..."}
          </Text>
        ) : activeGoals.length === 0 ? (
          <Box py={2} px={0.5}>
            <Text fontSize="sm" color="gray.400" fontWeight="500" lineHeight="1.5">
              {"Brak aktywnych celów — może czas dodać nowy?"}
            </Text>
          </Box>
        ) : (
          activeGoals.map((goal) => <GoalRow key={goal.id} goal={goal} />)
        )}
      </Box>
    </Box>
  );
}
