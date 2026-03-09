import { useState } from "react";
import { Box, Flex, Text, Icon, Input, VStack, Spinner } from "@chakra-ui/react";
import {
  LuArrowLeft, LuPlus, LuTrash2, LuPencil, LuCheck, LuClock, LuTarget,
} from "react-icons/lu";
import {
  useGoal, useUpdateGoal, useDeleteGoal,
  useAddMilestone, useToggleMilestone, useDeleteMilestone,
} from "../../hooks/usePlans";

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
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
}

export default function GoalDetail({ goalId, onBack }) {
  const { data: goal, isLoading } = useGoal(goalId);
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const addMilestone = useAddMilestone();
  const toggleMilestone = useToggleMilestone();
  const deleteMilestone = useDeleteMilestone();

  const [newMilestone, setNewMilestone] = useState("");
  const [editingValue, setEditingValue] = useState(false);
  const [currentVal, setCurrentVal] = useState("");

  if (isLoading || !goal) {
    return (
      <Flex justify="center" py={12}>
        <Spinner color="rose.400" size="lg" />
      </Flex>
    );
  }

  const milestonesDone = goal.milestones?.filter((m) => m.is_completed).length || 0;
  const milestonesTotal = goal.milestones?.length || 0;

  let progress = 0;
  if (goal.target_value && goal.target_value > 0) {
    progress = Math.min((goal.current_value / goal.target_value) * 100, 100);
  } else if (milestonesTotal > 0) {
    progress = (milestonesDone / milestonesTotal) * 100;
  }

  const days = daysUntil(goal.deadline);

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!newMilestone.trim()) return;
    await addMilestone.mutateAsync({
      goalId,
      data: { title: newMilestone.trim(), sort_order: milestonesTotal },
    });
    setNewMilestone("");
  };

  const handleUpdateValue = async () => {
    const val = parseFloat(currentVal);
    if (isNaN(val)) return;
    await updateGoal.mutateAsync({ id: goalId, data: { current_value: val } });
    setEditingValue(false);
  };

  const handleToggleComplete = async () => {
    await updateGoal.mutateAsync({
      id: goalId,
      data: { is_completed: !goal.is_completed },
    });
  };

  return (
    <Box>
      {/* Header */}
      <Flex align="center" gap={3} mb={5}>
        <Icon
          as={LuArrowLeft}
          boxSize={5}
          color="gray.500"
          cursor="pointer"
          _hover={{ color: "gray.700" }}
          onClick={onBack}
        />
        <Box flex={1}>
          <Text fontSize="lg" fontWeight="700" color="rose.700">
            {goal.title}
          </Text>
          <Flex gap={2} align="center" flexWrap="wrap">
            {goal.category && (
              <Text fontSize="xs" color="rose.400">
                {CATEGORY_LABELS[goal.category] || goal.category}
              </Text>
            )}
            {days !== null && (
              <Flex align="center" gap={0.5}>
                <Icon as={LuClock} boxSize={3} color={days < 0 ? "red.400" : "gray.400"} />
                <Text fontSize="xs" color={days < 0 ? "red.400" : "gray.400"}>
                  {days < 0
                    ? `${Math.abs(days)} dni po terminie`
                    : days === 0
                      ? "Dziś termin!"
                      : `${days} dni do terminu`}
                </Text>
              </Flex>
            )}
          </Flex>
        </Box>

        <Flex
          align="center"
          gap={1}
          px={3}
          py={1.5}
          borderRadius="lg"
          cursor="pointer"
          fontSize="xs"
          fontWeight="600"
          bg={goal.is_completed ? "green.100" : "rose.50"}
          color={goal.is_completed ? "green.600" : "rose.500"}
          _hover={{ bg: goal.is_completed ? "green.200" : "rose.100" }}
          onClick={handleToggleComplete}
        >
          <Icon as={goal.is_completed ? LuCheck : LuTarget} boxSize={3.5} />
          <Text>{goal.is_completed ? "Ukończony" : "W trakcie"}</Text>
        </Flex>
      </Flex>

      {/* Description */}
      {goal.description && (
        <Text fontSize="sm" color="gray.500" mb={4}>
          {goal.description}
        </Text>
      )}

      {/* Progress section */}
      {goal.target_value > 0 && (
        <Box
          bg="white"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="gray.100"
          p={4}
          mb={4}
        >
          <Flex justify="space-between" align="center" mb={2}>
            <Text fontSize="sm" fontWeight="600" color="gray.600">
              {"Postęp"}
            </Text>
            <Text fontSize="lg" fontWeight="700" color="rose.500">
              {Math.round(progress)}%
            </Text>
          </Flex>

          <Box bg="rose.100" borderRadius="full" h="8px" overflow="hidden" mb={3}>
            <Box
              bg={progress >= 100 ? "green.400" : "rose.400"}
              h="100%"
              borderRadius="full"
              w={`${progress}%`}
              transition="width 0.4s ease"
            />
          </Box>

          <Flex align="center" gap={2}>
            {editingValue ? (
              <Flex as="form" onSubmit={(e) => { e.preventDefault(); handleUpdateValue(); }} gap={2} flex={1}>
                <Input
                  size="sm"
                  type="number"
                  value={currentVal}
                  onChange={(e) => setCurrentVal(e.target.value)}
                  autoFocus
                  borderColor="rose.200"
                  _focus={{ borderColor: "rose.400", boxShadow: "0 0 0 1px var(--chakra-colors-rose-400)" }}
                />
                <Text
                  as="button"
                  type="submit"
                  fontSize="xs"
                  fontWeight="600"
                  color="rose.500"
                  cursor="pointer"
                  whiteSpace="nowrap"
                >
                  {"Zapisz"}
                </Text>
              </Flex>
            ) : (
              <Flex align="center" gap={2} flex={1}>
                <Text fontSize="sm" color="gray.600">
                  {goal.current_value} / {goal.target_value}{goal.unit ? ` ${goal.unit}` : ""}
                </Text>
                <Icon
                  as={LuPencil}
                  boxSize={3.5}
                  color="gray.400"
                  cursor="pointer"
                  _hover={{ color: "rose.400" }}
                  onClick={() => {
                    setCurrentVal(String(goal.current_value));
                    setEditingValue(true);
                  }}
                />
              </Flex>
            )}
          </Flex>
        </Box>
      )}

      {/* Milestones */}
      <Box
        bg="white"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="gray.100"
        p={4}
        mb={4}
      >
        <Flex justify="space-between" align="center" mb={3}>
          <Text fontSize="sm" fontWeight="600" color="gray.600">
            {"Kamienie milowe"}
          </Text>
          {milestonesTotal > 0 && (
            <Text fontSize="xs" color="gray.400">
              {milestonesDone}/{milestonesTotal}
            </Text>
          )}
        </Flex>

        <VStack gap={2} align="stretch" mb={3}>
          {goal.milestones?.map((ms) => (
            <Flex key={ms.id} align="center" gap={2}>
              <Flex
                align="center"
                justify="center"
                w={5}
                h={5}
                borderRadius="md"
                borderWidth="2px"
                borderColor={ms.is_completed ? "rose.400" : "gray.300"}
                bg={ms.is_completed ? "rose.400" : "transparent"}
                cursor="pointer"
                transition="all 0.2s"
                flexShrink={0}
                onClick={() => toggleMilestone.mutateAsync(ms.id)}
              >
                {ms.is_completed && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </Flex>
              <Text
                flex={1}
                fontSize="sm"
                color={ms.is_completed ? "gray.400" : "gray.700"}
                textDecoration={ms.is_completed ? "line-through" : "none"}
              >
                {ms.title}
              </Text>
              <Icon
                as={LuTrash2}
                boxSize={3.5}
                color="gray.300"
                cursor="pointer"
                _hover={{ color: "red.400" }}
                onClick={() => deleteMilestone.mutateAsync(ms.id)}
              />
            </Flex>
          ))}
        </VStack>

        {/* Add milestone */}
        <Flex as="form" onSubmit={handleAddMilestone} gap={2}>
          <Input
            size="sm"
            placeholder={"Dodaj kamień milowy…"}
            value={newMilestone}
            onChange={(e) => setNewMilestone(e.target.value)}
            borderColor="rose.200"
            _focus={{ borderColor: "rose.400", boxShadow: "0 0 0 1px var(--chakra-colors-rose-400)" }}
          />
          <Flex
            as="button"
            type="submit"
            align="center"
            justify="center"
            px={3}
            bg="rose.50"
            color="rose.500"
            borderRadius="md"
            cursor="pointer"
            _hover={{ bg: "rose.100" }}
            flexShrink={0}
          >
            <Icon as={LuPlus} boxSize={4} />
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
}
