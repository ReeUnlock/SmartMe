import { useState } from "react";
import { Box, Flex, Text, Icon } from "@chakra-ui/react";
import { LuTrash2, LuTarget, LuCheck, LuClock, LuPencil, LuWallet } from "react-icons/lu";

const CATEGORY_LABELS = {
  finanse: "Finanse",
  zdrowie: "Zdrowie",
  rozwoj: "Rozwój",
  podroze: "Podróże",
  dom: "Dom",
  inne: "Inne",
};

const GOAL_TYPE_LABELS = {
  spending_limit: "Limit wydatków",
  savings: "Oszczędności",
};

function daysUntil(deadline) {
  if (!deadline) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(deadline);
  const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function GoalCard({ goal, onClick, onDelete, onEdit }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isSpendingLimit = goal.goal_type === "spending_limit";
  const milestonesDone = goal.milestones?.filter((m) => m.is_completed).length || 0;
  const milestonesTotal = goal.milestones?.length || 0;

  // Progress computation
  let progress = 0;
  let progressLabel = "";
  let progressColor = "rose.400";
  let progressBg = "rose.100";

  if (isSpendingLimit && goal.target_value > 0) {
    const spent = goal.computed_expense_total ?? 0;
    progress = Math.min((spent / goal.target_value) * 100, 100);
    progressLabel = `${Math.round(spent)} / ${Math.round(goal.target_value)} zł`;
    progressColor = progress >= 90 ? "red.400" : progress >= 70 ? "orange.400" : "peach.400";
    progressBg = "peach.100";
  } else if (goal.target_value && goal.target_value > 0) {
    progress = Math.min((goal.current_value / goal.target_value) * 100, 100);
    progressLabel = `${goal.current_value} / ${goal.target_value}${goal.unit ? ` ${goal.unit}` : ""}`;
  } else if (milestonesTotal > 0) {
    progress = (milestonesDone / milestonesTotal) * 100;
    progressLabel = `${milestonesDone} / ${milestonesTotal} kroków`;
  }

  const days = daysUntil(goal.deadline);
  const isOverdue = days !== null && days < 0;
  const isUrgent = days !== null && days >= 0 && days <= 7;

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete();
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const iconBg = isSpendingLimit
    ? (goal.is_completed ? "peach.100" : "peach.50")
    : (goal.is_completed ? "rose.100" : "rose.50");
  const iconColor = isSpendingLimit
    ? (goal.is_completed ? "peach.600" : "peach.500")
    : (goal.is_completed ? "rose.600" : "rose.400");

  return (
    <Flex
      bg="white"
      borderRadius="2xl"
      borderWidth="1px"
      borderColor={goal.is_completed ? "rose.200" : "gray.100"}
      shadow="0 1px 4px 0 rgba(0,0,0,0.04)"
      p={4}
      direction="column"
      gap={3}
      cursor="pointer"
      _hover={{ shadow: "0 2px 12px 0 rgba(247,131,172,0.12)", borderColor: "rose.300" }}
      _active={{ transform: "scale(0.99)" }}
      transition="all 0.2s"
      onClick={onClick}
      opacity={goal.is_completed ? 0.6 : 1}
    >
      <Flex align="center" gap={3}>
        <Flex
          align="center"
          justify="center"
          w={10}
          h={10}
          borderRadius="lg"
          bg={iconBg}
        >
          <Icon
            as={isSpendingLimit ? LuWallet : (goal.is_completed ? LuCheck : LuTarget)}
            boxSize={5}
            color={iconColor}
          />
        </Flex>

        <Box flex={1} minW={0}>
          <Text fontWeight="600" fontSize="md" truncate>
            {goal.title}
          </Text>
          <Flex gap={2} align="center" flexWrap="wrap">
            {goal.goal_type !== "manual" && (
              <Text fontSize="2xs" color={isSpendingLimit ? "peach.500" : "rose.400"} fontWeight="600">
                {GOAL_TYPE_LABELS[goal.goal_type]}
              </Text>
            )}
            {goal.linked_category_name && (
              <Text fontSize="2xs" color="gray.400">
                {"· "}{goal.linked_category_name}
              </Text>
            )}
            {goal.category && (
              <Text fontSize="xs" color="rose.400">
                {CATEGORY_LABELS[goal.category] || goal.category}
              </Text>
            )}
            {days !== null && !goal.is_completed && (
              <Flex align="center" gap={0.5}>
                <Icon as={LuClock} boxSize={3} color={isOverdue ? "red.400" : isUrgent ? "orange.400" : "gray.400"} />
                <Text fontSize="xs" color={isOverdue ? "red.400" : isUrgent ? "orange.400" : "gray.400"}>
                  {isOverdue
                    ? `${Math.abs(days)} dni po terminie`
                    : days === 0
                      ? "Dziś!"
                      : `${days} dni`}
                </Text>
              </Flex>
            )}
          </Flex>
        </Box>

        <Icon
          as={LuPencil}
          boxSize={4}
          color="gray.300"
          cursor="pointer"
          _hover={{ color: "rose.400" }}
          transition="color 0.2s"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        />

        {confirmDelete ? (
          <Text
            as="button"
            fontSize="xs"
            fontWeight="600"
            color="red.500"
            bg="red.50"
            px={2}
            py={1}
            borderRadius="md"
            cursor="pointer"
            _hover={{ bg: "red.100" }}
            onClick={handleDeleteClick}
          >
            {"Usuń?"}
          </Text>
        ) : (
          <Icon
            as={LuTrash2}
            boxSize={4}
            color="gray.300"
            cursor="pointer"
            _hover={{ color: "red.400" }}
            transition="color 0.2s"
            onClick={handleDeleteClick}
          />
        )}
      </Flex>

      {/* Progress bar */}
      {(goal.target_value > 0 || milestonesTotal > 0) && (
        <Box>
          <Flex justify="space-between" mb={1}>
            <Text fontSize="xs" color="gray.500">{progressLabel}</Text>
            <Text fontSize="xs" fontWeight="600" color={isSpendingLimit ? progressColor : "rose.500"}>
              {Math.round(progress)}%
            </Text>
          </Flex>
          <Box bg={progressBg} borderRadius="full" h="6px" overflow="hidden">
            <Box
              bg={progress >= 100 ? (isSpendingLimit ? "red.400" : "green.400") : progressColor}
              h="100%"
              borderRadius="full"
              w={`${progress}%`}
              transition="width 0.4s ease"
            />
          </Box>
        </Box>
      )}
    </Flex>
  );
}
