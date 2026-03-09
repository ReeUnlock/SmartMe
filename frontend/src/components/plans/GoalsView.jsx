import { useState } from "react";
import { Box, Flex, Text, Icon, VStack, Spinner } from "@chakra-ui/react";
import { LuPlus, LuTarget } from "react-icons/lu";
import { useGoals, useCreateGoal, useDeleteGoal } from "../../hooks/usePlans";
import GoalCard from "./GoalCard";
import GoalDetail from "./GoalDetail";
import GoalFormDialog from "./GoalFormDialog";

export default function GoalsView() {
  const { data: goals, isLoading } = useGoals();
  const createGoal = useCreateGoal();
  const deleteGoal = useDeleteGoal();
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (data) => {
    const newGoal = await createGoal.mutateAsync(data);
    setShowForm(false);
    setSelectedGoalId(newGoal.id);
  };

  const handleDelete = async (id) => {
    await deleteGoal.mutateAsync(id);
    if (selectedGoalId === id) setSelectedGoalId(null);
  };

  if (selectedGoalId) {
    return (
      <GoalDetail
        goalId={selectedGoalId}
        onBack={() => setSelectedGoalId(null)}
      />
    );
  }

  return (
    <>
      <Flex align="center" justify="space-between" mb={4}>
        <Text fontSize="md" fontWeight="600" color="gray.600">
          {"Twoje cele"}
        </Text>
        <Flex
          align="center"
          gap={2}
          px={3}
          py={2}
          bg="rose.400"
          color="white"
          borderRadius="xl"
          cursor="pointer"
          fontWeight="600"
          fontSize="sm"
          _hover={{ bg: "rose.500" }}
          _active={{ transform: "scale(0.97)" }}
          transition="all 0.2s"
          onClick={() => setShowForm(true)}
        >
          <Icon as={LuPlus} boxSize={4} />
          <Text>{"Nowy cel"}</Text>
        </Flex>
      </Flex>

      {isLoading ? (
        <Flex justify="center" py={12}>
          <Spinner color="rose.400" size="lg" />
        </Flex>
      ) : !goals?.length ? (
        <VStack py={16} gap={3} color="gray.400">
          <Icon as={LuTarget} boxSize={16} strokeWidth={1} />
          <Text fontSize="lg" fontWeight="600">{"Brak celów"}</Text>
          <Text fontSize="sm">{'Dodaj swój pierwszy cel, klikając „Nowy cel"'}</Text>
        </VStack>
      ) : (
        <VStack gap={3} align="stretch">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onClick={() => setSelectedGoalId(goal.id)}
              onDelete={() => handleDelete(goal.id)}
            />
          ))}
        </VStack>
      )}

      <GoalFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
        isLoading={createGoal.isPending}
      />
    </>
  );
}
