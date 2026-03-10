import { useState, useRef, useEffect, useMemo } from "react";
import { Box, Flex, Text, VStack, Spinner, Icon, Input } from "@chakra-ui/react";
import { LuPlus, LuTrash2, LuWallet, LuUsers, LuTag, LuPencil, LuSearch, LuX } from "react-icons/lu";
import { useExpenses, useDeleteExpense, useCreateExpense, useUpdateExpense, useExpenseCategories, useMembers } from "../../hooks/useExpenses";
import useExpenseUndo from "../../hooks/useExpenseUndo";
import useRewards from "../../hooks/useRewards";
import useAchievements from "../../hooks/useAchievements";
import useChallenges from "../../hooks/useChallenges";
import AddExpenseDialog from "./AddExpenseDialog";

function ExpenseRow({ expense, onDelete, onEdit, confirmingId }) {
  const isConfirming = confirmingId === expense.id;

  return (
    <Flex
      bg="white"
      borderRadius="2xl"
      p={3.5}
      shadow="0 1px 8px 0 rgba(0,0,0,0.04)"
      borderWidth="1px"
      borderColor={isConfirming ? "red.200" : "gray.100"}
      align="center"
      gap={3}
      cursor="pointer"
      onClick={() => onEdit(expense)}
      _hover={{ borderColor: "peach.200", shadow: "sm" }}
      transition="all 0.15s"
    >
      {/* Category color indicator */}
      <Box
        w="8px"
        minH="44px"
        borderRadius="full"
        bg={expense.category?.color || "gray.300"}
        flexShrink={0}
        alignSelf="stretch"
      />

      {/* Info */}
      <Box flex={1} minW={0}>
        <Flex align="center" gap={2} mb={0.5}>
          <Text fontSize="sm" fontWeight="600" color="textPrimary" truncate>
            {expense.description || expense.category?.name || "Wydatek"}
          </Text>
          {expense.is_shared && (
            <Flex
              align="center"
              gap={1}
              bg="peach.50"
              px={1.5}
              py={0.5}
              borderRadius="md"
              flexShrink={0}
            >
              <Icon as={LuUsers} boxSize={3} color="peach.500" />
              <Text fontSize="2xs" color="peach.600" fontWeight="600">{"wspólny"}</Text>
            </Flex>
          )}
        </Flex>
        <Flex gap={2} fontSize="xs" color="gray.400" align="center">
          {expense.category && (
            <Flex align="center" gap={1}>
              <Icon as={LuTag} boxSize={3} />
              <Text>{expense.category.name}</Text>
            </Flex>
          )}
          {expense.paid_by && (
            <Text>{"·"} {expense.paid_by.name}</Text>
          )}
        </Flex>
      </Box>

      {/* Amount */}
      <Text fontSize="md" fontWeight="700" color="peach.600" flexShrink={0}>
        {expense.amount.toFixed(2)} {"zł"}
      </Text>

      {/* Edit */}
      <Flex
        as="button"
        align="center"
        justify="center"
        color="gray.300"
        cursor="pointer"
        _hover={{ color: "peach.500" }}
        onClick={(e) => { e.stopPropagation(); onEdit(expense); }}
        flexShrink={0}
      >
        <Icon as={LuPencil} boxSize={4} />
      </Flex>

      {/* Delete with confirmation */}
      {isConfirming ? (
        <Flex
          as="button"
          align="center"
          justify="center"
          bg="red.500"
          color="white"
          borderRadius="md"
          px={2}
          py={1}
          fontSize="xs"
          fontWeight="600"
          cursor="pointer"
          _hover={{ bg: "red.600" }}
          onClick={(e) => { e.stopPropagation(); onDelete(expense.id); }}
          flexShrink={0}
        >
          {"Usuń?"}
        </Flex>
      ) : (
        <Flex
          as="button"
          align="center"
          justify="center"
          color="gray.300"
          cursor="pointer"
          _hover={{ color: "red.400" }}
          onClick={(e) => { e.stopPropagation(); onDelete(expense.id, true); }}
          flexShrink={0}
        >
          <Icon as={LuTrash2} boxSize={4} />
        </Flex>
      )}
    </Flex>
  );
}

export default function ExpensesList({ year, month }) {
  const { data: expenses, isLoading } = useExpenses({ year, month });
  const { data: categories } = useExpenseCategories();
  const { data: members } = useMembers();
  const deleteExpense = useDeleteExpense();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const pushUndo = useExpenseUndo((s) => s.push);
  const grantReward = useRewards((s) => s.reward);
  const addBonusSparks = useRewards((s) => s.addBonusSparks);
  const trackProgress = useAchievements((s) => s.trackProgress);
  const trackChallenge = useChallenges((s) => s.trackAction);
  const [showDialog, setShowDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [filterCategory, setFilterCategory] = useState(null);
  const [filterMember, setFilterMember] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);
  const confirmTimerRef = useRef(null);

  // Clear confirming state on outside click / timeout
  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, []);

  const startConfirm = (id) => {
    setConfirmingId(id);
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    confirmTimerRef.current = setTimeout(() => setConfirmingId(null), 3000);
  };

  const handleDelete = (id, askConfirm) => {
    if (askConfirm) {
      startConfirm(id);
    } else {
      setConfirmingId(null);
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      // Save expense data before deleting for undo
      const exp = expenses?.find((e) => e.id === id);
      deleteExpense.mutate(id, {
        onSuccess: () => {
          if (exp) pushUndo({ type: "delete", expense: exp });
        },
      });
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setShowDialog(true);
  };

  const handleDialogSubmit = async (data) => {
    try {
      if (editingExpense) {
        pushUndo({ type: "update", expense: editingExpense, prev: editingExpense });
        await updateExpense.mutateAsync({ id: editingExpense.id, data });
      } else {
        const created = await createExpense.mutateAsync(data);
        pushUndo({ type: "create", expense: created });
        grantReward("expense_added");
        trackProgress("expenses_logged", 1, addBonusSparks);
        trackChallenge("expense", addBonusSparks);
      }
      setShowDialog(false);
      setEditingExpense(null);
    } catch {
      // mutation error handled by TanStack Query
    }
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    setEditingExpense(null);
  };

  // Compute default date for new expense dialog
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === (now.getMonth() + 1);
  const dialogDefaultDate = isCurrentMonth
    ? now.toISOString().split("T")[0]
    : `${year}-${String(month).padStart(2, "0")}-01`;

  // Filter & search
  const searchLower = searchQuery.trim().toLowerCase();
  const filtered = useMemo(() => expenses?.filter((e) => {
    if (filterCategory && e.category_id !== filterCategory) return false;
    if (filterMember && e.paid_by_id !== filterMember) return false;
    if (searchLower) {
      const desc = (e.description || "").toLowerCase();
      const catName = (e.category?.name || "").toLowerCase();
      if (!desc.includes(searchLower) && !catName.includes(searchLower)) return false;
    }
    return true;
  }), [expenses, filterCategory, filterMember, searchLower]);

  // Group by date
  const { grouped, dates } = useMemo(() => {
    const g = {};
    filtered?.forEach((e) => {
      const key = e.date;
      if (!g[key]) g[key] = [];
      g[key].push(e);
    });
    return { grouped: g, dates: Object.keys(g).sort((a, b) => b.localeCompare(a)) };
  }, [filtered]);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    const days = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];
    const day = d.getDate();
    const monthNum = String(d.getMonth() + 1).padStart(2, "0");
    return `${days[d.getDay()]}, ${day}.${monthNum}`;
  };

  const hasActiveFilters = filterCategory || filterMember || searchLower;
  const totalCount = expenses?.length || 0;
  const filteredCount = filtered?.length || 0;

  if (isLoading) {
    return <Flex justify="center" py={12}><Spinner color="peach.500" size="lg" /></Flex>;
  }

  return (
    <Box>
      {/* Header: Add button + count */}
      <Flex justify="space-between" align="center" mb={3}>
        <Text fontSize="xs" color="gray.400" fontWeight="500">
          {hasActiveFilters
            ? `${filteredCount} z ${totalCount} wydatków`
            : `${totalCount} wydatków`}
        </Text>
        <Flex
          align="center"
          gap={2}
          px={3}
          py={2}
          bg="peach.400"
          color="white"
          borderRadius="xl"
          cursor="pointer"
          fontWeight="600"
          fontSize="sm"
          _hover={{ bg: "peach.500" }}
          _active={{ transform: "scale(0.97)" }}
          transition="all 0.2s"
          onClick={() => { setEditingExpense(null); setShowDialog(true); }}
        >
          <Icon as={LuPlus} boxSize={4} />
          <Text>{"Nowy wydatek"}</Text>
        </Flex>
      </Flex>

      {/* Search */}
      <Box position="relative" mb={3}>
        <Icon
          as={LuSearch}
          boxSize={4}
          color="gray.400"
          position="absolute"
          left={3}
          top="50%"
          transform="translateY(-50%)"
          zIndex={1}
          pointerEvents="none"
        />
        <Input
          placeholder="Szukaj wydatku…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="sm"
          pl={9}
          pr={searchQuery ? 8 : 3}
          borderColor="peach.200"
          borderRadius="xl"
          _focus={{ borderColor: "peach.400", boxShadow: "0 0 0 1px var(--chakra-colors-peach-400)" }}
        />
        {searchQuery && (
          <Flex
            as="button"
            type="button"
            position="absolute"
            right={2}
            top="50%"
            transform="translateY(-50%)"
            align="center"
            justify="center"
            color="gray.400"
            cursor="pointer"
            _hover={{ color: "gray.600" }}
            onClick={() => setSearchQuery("")}
          >
            <Icon as={LuX} boxSize={4} />
          </Flex>
        )}
      </Box>

      {/* Category filters */}
      <Flex gap={1} mb={3} flexWrap="wrap">
        <Text
          as="button"
          fontSize="xs"
          px={2}
          py={1}
          borderRadius="md"
          bg={!filterCategory ? "peach.400" : "peach.50"}
          color={!filterCategory ? "white" : "gray.600"}
          cursor="pointer"
          fontWeight="500"
          onClick={() => setFilterCategory(null)}
        >
          Wszystkie
        </Text>
        {categories?.map((cat) => (
          <Text
            key={cat.id}
            as="button"
            fontSize="xs"
            px={2}
            py={1}
            borderRadius="md"
            bg={filterCategory === cat.id ? "peach.400" : "peach.50"}
            color={filterCategory === cat.id ? "white" : "gray.600"}
            cursor="pointer"
            fontWeight="500"
            onClick={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)}
          >
            {cat.name}
          </Text>
        ))}
      </Flex>

      {/* Member filter */}
      {members?.length > 0 && (
        <Flex gap={1} mb={4}>
          <Text
            as="button"
            fontSize="xs"
            px={2}
            py={1}
            borderRadius="md"
            bg={!filterMember ? "peach.400" : "peach.50"}
            color={!filterMember ? "white" : "gray.600"}
            cursor="pointer"
            fontWeight="500"
            onClick={() => setFilterMember(null)}
          >
            Wszyscy
          </Text>
          {members.map((m) => (
            <Text
              key={m.id}
              as="button"
              fontSize="xs"
              px={2}
              py={1}
              borderRadius="md"
              bg={filterMember === m.id ? "peach.400" : "peach.50"}
              color={filterMember === m.id ? "white" : "gray.600"}
              cursor="pointer"
              fontWeight="500"
              onClick={() => setFilterMember(filterMember === m.id ? null : m.id)}
            >
              {m.name}
            </Text>
          ))}
        </Flex>
      )}

      {/* Expenses list */}
      {!dates.length ? (
        <VStack py={16} gap={3}>
          <Icon as={hasActiveFilters ? LuSearch : LuWallet} boxSize={16} strokeWidth={1} color="peach.200" />
          <Text fontSize="lg" fontWeight="600" color="gray.500">
            {hasActiveFilters ? "Brak wyników" : "Brak wydatków"}
          </Text>
          <Text fontSize="sm" textAlign="center" color="gray.400">
            {hasActiveFilters
              ? "Spróbuj zmienić filtry lub wyszukiwaną frazę"
              : "Kliknij \"Nowy wydatek\" aby dodać swój pierwszy wydatek"}
          </Text>
        </VStack>
      ) : (
        <VStack gap={5} align="stretch">
          {dates.map((dateStr) => {
            const dayExpenses = grouped[dateStr];
            const dayTotal = dayExpenses.reduce((s, e) => s + e.amount, 0);
            return (
              <Box key={dateStr}>
                <Flex justify="space-between" align="baseline" mb={2} px={1}>
                  <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                    {formatDate(dateStr)}
                  </Text>
                  <Flex align="baseline" gap={1}>
                    <Text fontSize="xs" fontWeight="700" color="peach.600">
                      {dayTotal.toFixed(2)} {"zł"}
                    </Text>
                    <Text fontSize="2xs" color="gray.400">
                      {"·"} {dayExpenses.length} {dayExpenses.length === 1 ? "wydatek" : dayExpenses.length < 5 ? "wydatki" : "wydatków"}
                    </Text>
                  </Flex>
                </Flex>
                <VStack gap={2} align="stretch">
                  {dayExpenses.map((expense) => (
                    <ExpenseRow
                      key={expense.id}
                      expense={expense}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                      confirmingId={confirmingId}
                    />
                  ))}
                </VStack>
              </Box>
            );
          })}
        </VStack>
      )}

      <AddExpenseDialog
        open={showDialog}
        onClose={handleDialogClose}
        onSubmit={handleDialogSubmit}
        isLoading={editingExpense ? updateExpense.isPending : createExpense.isPending}
        defaultDate={dialogDefaultDate}
        expense={editingExpense}
      />
    </Box>
  );
}
