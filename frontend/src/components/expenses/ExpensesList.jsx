import { useState } from "react";
import { Box, Flex, Text, VStack, Spinner, Icon } from "@chakra-ui/react";
import { LuPlus, LuTrash2, LuWallet, LuUsers, LuTag } from "react-icons/lu";
import { useExpenses, useDeleteExpense, useCreateExpense, useExpenseCategories, useMembers } from "../../hooks/useExpenses";
import AddExpenseDialog from "./AddExpenseDialog";

function ExpenseRow({ expense, onDelete }) {
  return (
    <Flex
      bg="white"
      borderRadius="xl"
      p={3}
      shadow="xs"
      border="1px solid"
      borderColor="gray.100"
      align="center"
      gap={3}
    >
      {/* Category color indicator */}
      <Box
        w="8px"
        h="40px"
        borderRadius="full"
        bg={expense.category?.color || "gray.300"}
        flexShrink={0}
      />

      {/* Info */}
      <Box flex={1} minW={0}>
        <Flex align="center" gap={2}>
          <Text fontSize="sm" fontWeight="600" color="gray.800" truncate>
            {expense.description || expense.category?.name || "Wydatek"}
          </Text>
          {expense.is_shared && (
            <Icon as={LuUsers} boxSize={3} color="peach.400" title="Wspólny" />
          )}
        </Flex>
        <Flex gap={2} fontSize="xs" color="gray.400">
          {expense.category && (
            <Flex align="center" gap={1}>
              <Icon as={LuTag} boxSize={3} />
              <Text>{expense.category.name}</Text>
            </Flex>
          )}
          {expense.paid_by && (
            <Text>· {expense.paid_by.name}</Text>
          )}
        </Flex>
      </Box>

      {/* Amount */}
      <Text fontSize="md" fontWeight="700" color="peach.600" flexShrink={0}>
        {expense.amount.toFixed(2)} zł
      </Text>

      {/* Delete */}
      <Flex
        as="button"
        align="center"
        justify="center"
        color="gray.300"
        cursor="pointer"
        _hover={{ color: "red.400" }}
        onClick={(e) => { e.stopPropagation(); onDelete(expense.id); }}
        flexShrink={0}
      >
        <Icon as={LuTrash2} boxSize={4} />
      </Flex>
    </Flex>
  );
}

export default function ExpensesList({ year, month }) {
  const { data: expenses, isLoading } = useExpenses({ year, month });
  const { data: categories } = useExpenseCategories();
  const { data: members } = useMembers();
  const deleteExpense = useDeleteExpense();
  const createExpense = useCreateExpense();
  const [showAdd, setShowAdd] = useState(false);
  const [filterCategory, setFilterCategory] = useState(null);
  const [filterMember, setFilterMember] = useState(null);

  const handleAdd = async (data) => {
    await createExpense.mutateAsync(data);
    setShowAdd(false);
  };

  const filtered = expenses?.filter((e) => {
    if (filterCategory && e.category_id !== filterCategory) return false;
    if (filterMember && e.paid_by_id !== filterMember) return false;
    return true;
  });

  // Group by date
  const grouped = {};
  filtered?.forEach((e) => {
    const key = e.date;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    const days = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];
    return `${days[d.getDay()]}, ${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  if (isLoading) {
    return <Flex justify="center" py={12}><Spinner color="peach.500" size="lg" /></Flex>;
  }

  return (
    <Box>
      {/* Add button */}
      <Flex justify="flex-end" mb={3}>
        <Flex
          align="center"
          gap={2}
          px={3}
          py={2}
          bg="peach.500"
          color="white"
          borderRadius="xl"
          cursor="pointer"
          fontWeight="600"
          fontSize="sm"
          _hover={{ bg: "peach.600" }}
          _active={{ transform: "scale(0.97)" }}
          transition="all 0.2s"
          onClick={() => setShowAdd(true)}
        >
          <Icon as={LuPlus} boxSize={4} />
          <Text>Nowy wydatek</Text>
        </Flex>
      </Flex>

      {/* Filters */}
      <Flex gap={1} mb={3} flexWrap="wrap">
        <Text
          as="button"
          fontSize="xs"
          px={2}
          py={1}
          borderRadius="md"
          bg={!filterCategory ? "peach.500" : "gray.100"}
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
            bg={filterCategory === cat.id ? "peach.500" : "gray.100"}
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
            bg={!filterMember ? "peach.400" : "gray.100"}
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
              bg={filterMember === m.id ? "peach.400" : "gray.100"}
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
        <VStack py={16} gap={3} color="gray.400">
          <Icon as={LuWallet} boxSize={16} strokeWidth={1} />
          <Text fontSize="lg" fontWeight="600">Brak wydatków</Text>
          <Text fontSize="sm">Dodaj pierwszy wydatek, klikając „Nowy wydatek"</Text>
        </VStack>
      ) : (
        <VStack gap={4} align="stretch">
          {dates.map((dateStr) => {
            const dayTotal = grouped[dateStr].reduce((s, e) => s + e.amount, 0);
            return (
              <Box key={dateStr}>
                <Flex justify="space-between" mb={2} px={1}>
                  <Text fontSize="xs" fontWeight="600" color="gray.500" textTransform="uppercase">
                    {formatDate(dateStr)}
                  </Text>
                  <Text fontSize="xs" fontWeight="700" color="peach.600">
                    {dayTotal.toFixed(2)} zł
                  </Text>
                </Flex>
                <VStack gap={2} align="stretch">
                  {grouped[dateStr].map((expense) => (
                    <ExpenseRow
                      key={expense.id}
                      expense={expense}
                      onDelete={(id) => deleteExpense.mutate(id)}
                    />
                  ))}
                </VStack>
              </Box>
            );
          })}
        </VStack>
      )}

      <AddExpenseDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={handleAdd}
        isLoading={createExpense.isPending}
      />
    </Box>
  );
}
