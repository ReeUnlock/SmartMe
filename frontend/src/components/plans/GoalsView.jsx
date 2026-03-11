import { useState, useMemo } from "react";
import { Box, Flex, Text, Icon, VStack, Spinner, Input } from "@chakra-ui/react";
import { LuPlus, LuTarget, LuSearch } from "react-icons/lu";
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from "../../hooks/usePlans";
import useRewards from "../../hooks/useRewards";
import useAchievements from "../../hooks/useAchievements";
import useChallenges from "../../hooks/useChallenges";
import GoalCard from "./GoalCard";
import GoalDetail from "./GoalDetail";
import { playSound } from "../../utils/soundManager";
import GoalFormDialog from "./GoalFormDialog";

const CATEGORIES = [
  { value: "finanse", label: "Finanse" },
  { value: "zdrowie", label: "Zdrowie" },
  { value: "rozwoj", label: "Rozwój" },
  { value: "podroze", label: "Podróże" },
  { value: "dom", label: "Dom" },
  { value: "inne", label: "Inne" },
];

const STATUS_FILTERS = [
  { value: "active", label: "Aktywne" },
  { value: "completed", label: "Ukończone" },
  { value: "all", label: "Wszystkie" },
];

export default function GoalsView() {
  const { data: goals, isLoading } = useGoals();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const grantReward = useRewards((s) => s.reward);
  const addBonusSparks = useRewards((s) => s.addBonusSparks);
  const trackProgress = useAchievements((s) => s.trackProgress);
  const trackChallenge = useChallenges((s) => s.trackAction);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");

  const filtered = useMemo(() => {
    if (!goals) return [];
    let list = goals;

    if (statusFilter === "active") list = list.filter((g) => !g.is_completed);
    else if (statusFilter === "completed") list = list.filter((g) => g.is_completed);

    if (categoryFilter) list = list.filter((g) => g.category === categoryFilter);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          (g.description && g.description.toLowerCase().includes(q))
      );
    }

    return list;
  }, [goals, search, categoryFilter, statusFilter]);

  const handleCreate = async (data) => {
    try {
      const newGoal = await createGoal.mutateAsync(data);
      setShowForm(false);
      setSelectedGoalId(newGoal.id);
      grantReward("goal_created");
      trackProgress("goals_created", 1, addBonusSparks);
      trackChallenge("goal_create", addBonusSparks);
      playSound("goalAdded");
    } catch {
      // mutation error handled by TanStack Query
    }
  };

  const handleEdit = (goal) => {
    setEditGoal(goal);
    setShowForm(true);
  };

  const handleUpdate = async (data) => {
    try {
      await updateGoal.mutateAsync({ id: editGoal.id, data });
      setShowForm(false);
      setEditGoal(null);
    } catch {
      // mutation error handled by TanStack Query
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteGoal.mutateAsync(id);
      if (selectedGoalId === id) setSelectedGoalId(null);
    } catch {
      // mutation error handled by TanStack Query
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditGoal(null);
  };

  if (selectedGoalId) {
    return (
      <GoalDetail
        goalId={selectedGoalId}
        onBack={() => setSelectedGoalId(null)}
        onEdit={(goal) => handleEdit(goal)}
      />
    );
  }

  const hasFilters = search || categoryFilter || statusFilter !== "active";

  return (
    <>
      {/* CTA button */}
      <Flex
        align="center"
        justify="center"
        gap={2}
        w="100%"
        py={2.5}
        mb={3}
        bg="rose.300"
        color="white"
        borderRadius="xl"
        cursor="pointer"
        fontWeight="600"
        fontSize="sm"
        _hover={{ bg: "rose.400" }}
        _active={{ transform: "scale(0.98)" }}
        transition="all 0.2s"
        shadow="0 2px 8px 0 rgba(247,131,172,0.2)"
        onClick={() => { setEditGoal(null); setShowForm(true); }}
      >
        <Icon as={LuPlus} boxSize={4} />
        <Text>{"Nowy cel"}</Text>
      </Flex>

      {/* Search */}
      <Flex align="center" gap={2} mb={3} position="relative">
        <Icon as={LuSearch} boxSize={4} color="gray.400" position="absolute" left={3} zIndex={1} />
        <Input
          placeholder={"Szukaj celów…"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="sm"
          pl={9}
          borderColor="rose.200"
          borderRadius="xl"
          _focus={{ borderColor: "rose.400", boxShadow: "0 0 0 1px var(--chakra-colors-rose-400)" }}
        />
      </Flex>

      {/* Status filters */}
      <Flex gap={1.5} mb={2}>
        {STATUS_FILTERS.map((sf) => (
          <Text
            key={sf.value}
            as="button"
            type="button"
            fontSize="xs"
            fontWeight="600"
            px={3}
            py={1}
            borderRadius="full"
            cursor="pointer"
            bg={statusFilter === sf.value ? "rose.300" : "rose.50"}
            color={statusFilter === sf.value ? "white" : "rose.500"}
            _hover={{ bg: statusFilter === sf.value ? "rose.400" : "rose.100" }}
            transition="all 0.2s"
            onClick={() => setStatusFilter(sf.value)}
          >
            {sf.label}
          </Text>
        ))}
      </Flex>

      {/* Category filters — scrollable chip row */}
      <Flex
        gap={1.5}
        mb={4}
        overflowX="auto"
        pb={1}
        css={{
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
        }}
      >
        {CATEGORIES.map((cat) => {
          const isActive = categoryFilter === cat.value;
          return (
            <Text
              key={cat.value}
              as="button"
              type="button"
              fontSize="2xs"
              fontWeight="600"
              px={2.5}
              py={1}
              borderRadius="full"
              cursor="pointer"
              whiteSpace="nowrap"
              flexShrink={0}
              bg={isActive ? "rose.300" : "gray.50"}
              color={isActive ? "white" : "gray.500"}
              borderWidth="1px"
              borderColor={isActive ? "rose.300" : "gray.100"}
              _hover={{ bg: isActive ? "rose.400" : "gray.100" }}
              transition="all 0.2s"
              onClick={() => setCategoryFilter(isActive ? "" : cat.value)}
            >
              {cat.label}
            </Text>
          );
        })}
      </Flex>

      {isLoading ? (
        <Flex justify="center" py={12}>
          <Spinner color="rose.400" size="lg" />
        </Flex>
      ) : !filtered.length ? (
        <VStack py={12} gap={3}>
          <Flex
            align="center"
            justify="center"
            w="64px"
            h="64px"
            borderRadius="full"
            bg="rose.50"
          >
            <Icon as={LuTarget} boxSize={8} strokeWidth={1.5} color="rose.300" />
          </Flex>
          <Text fontSize="md" fontWeight="700" color="textSecondary">
            {hasFilters ? "Brak wyników" : "Nie masz jeszcze celów"}
          </Text>
          <Text fontSize="sm" color="gray.400" textAlign="center" maxW="240px" lineHeight="1.5">
            {hasFilters
              ? "Spróbuj zmienić filtry lub wyszukiwaną frazę"
              : "Dodaj pierwszy cel i zacznij małymi krokami"}
          </Text>
          {!hasFilters && (
            <Flex
              align="center"
              gap={2}
              mt={2}
              px={4}
              py={2}
              bg="rose.300"
              color="white"
              borderRadius="xl"
              cursor="pointer"
              fontWeight="600"
              fontSize="sm"
              _hover={{ bg: "rose.400" }}
              _active={{ transform: "scale(0.97)" }}
              transition="all 0.2s"
              onClick={() => { setEditGoal(null); setShowForm(true); }}
            >
              <Icon as={LuPlus} boxSize={4} />
              <Text>{"Nowy cel"}</Text>
            </Flex>
          )}
        </VStack>
      ) : (
        <VStack gap={3} align="stretch">
          {filtered.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onClick={() => setSelectedGoalId(goal.id)}
              onDelete={() => handleDelete(goal.id)}
              onEdit={() => handleEdit(goal)}
            />
          ))}
        </VStack>
      )}

      <GoalFormDialog
        open={showForm}
        onClose={handleCloseForm}
        onSubmit={editGoal ? handleUpdate : handleCreate}
        isLoading={editGoal ? updateGoal.isPending : createGoal.isPending}
        goal={editGoal}
      />
    </>
  );
}
