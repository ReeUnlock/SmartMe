import { Box, Flex, Text, Icon } from "@chakra-ui/react";
import { LuTrash2, LuTarget, LuCheck, LuClock } from "react-icons/lu";

const CATEGORY_LABELS = {
  finanse: "Finanse",
  zdrowie: "Zdrowie",
  rozwoj: "Rozwój",
  podroze: "Podróże",
  dom: "Dom",
  inne: "Inne",
};

function daysUntil(deadline) {
  if (!deadline) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(deadline);
  const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function GoalCard({ goal, onClick, onDelete }) {
  const milestonesDone = goal.milestones?.filter((m) => m.is_completed).length || 0;
  const milestonesTotal = goal.milestones?.length || 0;

  // Progress: use target_value if set, otherwise milestone ratio
  let progress = 0;
  let progressLabel = "";
  if (goal.target_value && goal.target_value > 0) {
    progress = Math.min((goal.current_value / goal.target_value) * 100, 100);
    progressLabel = `${goal.current_value} / ${goal.target_value}${goal.unit ? ` ${goal.unit}` : ""}`;
  } else if (milestonesTotal > 0) {
    progress = (milestonesDone / milestonesTotal) * 100;
    progressLabel = `${milestonesDone} / ${milestonesTotal} kroków`;
  }

  const days = daysUntil(goal.deadline);
  const isOverdue = days !== null && days < 0;
  const isUrgent = days !== null && days >= 0 && days <= 7;

  return (
    <Flex
      bg="white"
      borderRadius="xl"
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
          bg={goal.is_completed ? "rose.100" : "rose.50"}
        >
          <Icon
            as={goal.is_completed ? LuCheck : LuTarget}
            boxSize={5}
            color={goal.is_completed ? "rose.600" : "rose.400"}
          />
        </Flex>

        <Box flex={1} minW={0}>
          <Text fontWeight="600" fontSize="md" truncate>
            {goal.title}
          </Text>
          <Flex gap={2} align="center" flexWrap="wrap">
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
          as={LuTrash2}
          boxSize={4}
          color="gray.300"
          cursor="pointer"
          _hover={{ color: "red.400" }}
          transition="color 0.2s"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        />
      </Flex>

      {/* Progress bar */}
      {(goal.target_value > 0 || milestonesTotal > 0) && (
        <Box>
          <Flex justify="space-between" mb={1}>
            <Text fontSize="xs" color="gray.500">{progressLabel}</Text>
            <Text fontSize="xs" fontWeight="600" color="rose.500">
              {Math.round(progress)}%
            </Text>
          </Flex>
          <Box bg="rose.100" borderRadius="full" h="6px" overflow="hidden">
            <Box
              bg={progress >= 100 ? "green.400" : "rose.400"}
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
