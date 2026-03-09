import { useState } from "react";
import { Box, Flex, Text, VStack, Input, Spinner, Icon } from "@chakra-ui/react";
import { LuPlus, LuTrash2, LuRepeat, LuCalendarDays } from "react-icons/lu";
import {
  useRecurring, useCreateRecurring, useDeleteRecurring,
  useExpenseCategories, useMembers,
} from "../../hooks/useExpenses";

function RecurringRow({ item, onDelete }) {
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
      <Box
        w="8px"
        h="40px"
        borderRadius="full"
        bg={item.category?.color || "gray.300"}
        flexShrink={0}
      />
      <Box flex={1} minW={0}>
        <Text fontSize="sm" fontWeight="600" color="gray.800" truncate>
          {item.name}
        </Text>
        <Flex gap={2} fontSize="xs" color="gray.400">
          {item.category && <Text>{item.category.name}</Text>}
          {item.paid_by && <Text>· {item.paid_by.name}</Text>}
          <Flex align="center" gap={1}>
            <Icon as={LuCalendarDays} boxSize={3} />
            <Text>{item.day_of_month}. dnia miesiąca</Text>
          </Flex>
        </Flex>
      </Box>
      <Text fontSize="md" fontWeight="700" color="peach.600" flexShrink={0}>
        {item.amount.toFixed(2)} zł
      </Text>
      <Flex
        as="button"
        align="center"
        justify="center"
        color="gray.300"
        cursor="pointer"
        _hover={{ color: "red.400" }}
        onClick={() => onDelete(item.id)}
        flexShrink={0}
      >
        <Icon as={LuTrash2} boxSize={4} />
      </Flex>
    </Flex>
  );
}

export default function RecurringExpenses() {
  const { data: recurring, isLoading } = useRecurring();
  const { data: categories } = useExpenseCategories();
  const { data: members } = useMembers();
  const createRecurring = useCreateRecurring();
  const deleteRecurring = useDeleteRecurring();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [categoryId, setCategoryId] = useState(null);
  const [paidById, setPaidById] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!name.trim() || !val || val <= 0) return;

    await createRecurring.mutateAsync({
      name: name.trim(),
      amount: val,
      day_of_month: parseInt(dayOfMonth) || 1,
      category_id: categoryId,
      paid_by_id: paidById,
    });
    setName("");
    setAmount("");
    setDayOfMonth("1");
    setCategoryId(null);
    setPaidById(null);
    setShowForm(false);
  };

  const totalMonthly = recurring?.reduce((s, r) => s + r.amount, 0) || 0;

  if (isLoading) {
    return <Flex justify="center" py={12}><Spinner color="peach.500" size="lg" /></Flex>;
  }

  return (
    <VStack gap={4} align="stretch">
      {/* Header */}
      <Flex justify="space-between" align="center">
        <Flex align="center" gap={2}>
          <Icon as={LuRepeat} boxSize={5} color="peach.500" />
          <Text fontWeight="600" color="gray.700">Stałe koszty</Text>
        </Flex>
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
          onClick={() => setShowForm(!showForm)}
        >
          <Icon as={LuPlus} boxSize={4} />
          <Text>Dodaj</Text>
        </Flex>
      </Flex>

      {/* Monthly total */}
      <Box bg="peach.50" borderRadius="xl" p={3} textAlign="center">
        <Text fontSize="xs" color="peach.600">Suma stałych kosztów miesięcznych</Text>
        <Text fontSize="2xl" fontWeight="700" color="peach.700">{totalMonthly.toFixed(0)} zł</Text>
      </Box>

      {/* Add form */}
      {showForm && (
        <Box
          as="form"
          onSubmit={handleSubmit}
          bg="white"
          borderRadius="xl"
          p={4}
          shadow="xs"
          border="1px solid"
          borderColor="peach.200"
        >
          <Text fontSize="sm" fontWeight="600" color="gray.700" mb={3}>Nowy stały koszt</Text>

          <VStack gap={2} align="stretch">
            <Input
              placeholder="Nazwa, np. Netflix"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              size="sm"
              borderColor="peach.200"
              _focus={{ borderColor: "peach.400", boxShadow: "0 0 0 1px var(--chakra-colors-peach-400)" }}
            />
            <Flex gap={2}>
              <Input
                placeholder="Kwota"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                size="sm"
                flex={2}
                borderColor="peach.200"
                _focus={{ borderColor: "peach.400", boxShadow: "0 0 0 1px var(--chakra-colors-peach-400)" }}
              />
              <Input
                placeholder="Dzień"
                type="number"
                min="1"
                max="31"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                size="sm"
                flex={1}
                borderColor="peach.200"
                _focus={{ borderColor: "peach.400", boxShadow: "0 0 0 1px var(--chakra-colors-peach-400)" }}
              />
            </Flex>

            {categories?.length > 0 && (
              <Box>
                <Text fontSize="xs" color="gray.500" mb={1}>Kategoria</Text>
                <Flex gap={1} flexWrap="wrap">
                  {categories.map((cat) => (
                    <Text
                      key={cat.id}
                      as="button"
                      type="button"
                      fontSize="xs"
                      px={2}
                      py={1}
                      borderRadius="md"
                      bg={categoryId === cat.id ? "peach.500" : "gray.100"}
                      color={categoryId === cat.id ? "white" : "gray.600"}
                      cursor="pointer"
                      fontWeight="500"
                      onClick={() => setCategoryId(categoryId === cat.id ? null : cat.id)}
                    >
                      {cat.name}
                    </Text>
                  ))}
                </Flex>
              </Box>
            )}

            {members?.length > 0 && (
              <Box>
                <Text fontSize="xs" color="gray.500" mb={1}>Kto płaci</Text>
                <Flex gap={1}>
                  {members.map((m) => (
                    <Text
                      key={m.id}
                      as="button"
                      type="button"
                      fontSize="xs"
                      px={2}
                      py={1}
                      borderRadius="md"
                      bg={paidById === m.id ? "peach.500" : "gray.100"}
                      color={paidById === m.id ? "white" : "gray.600"}
                      cursor="pointer"
                      fontWeight="500"
                      onClick={() => setPaidById(paidById === m.id ? null : m.id)}
                    >
                      {m.name}
                    </Text>
                  ))}
                </Flex>
              </Box>
            )}

            <Flex gap={3} justify="flex-end" pt={1}>
              <Text
                as="button"
                type="button"
                onClick={() => setShowForm(false)}
                color="gray.500"
                fontWeight="500"
                cursor="pointer"
                fontSize="sm"
                _hover={{ color: "gray.700" }}
              >
                Anuluj
              </Text>
              <Text
                as="button"
                type="submit"
                bg="peach.500"
                color="white"
                fontWeight="600"
                px={4}
                py={1}
                borderRadius="lg"
                cursor="pointer"
                fontSize="sm"
                _hover={{ bg: "peach.600" }}
                opacity={!name.trim() || !amount || createRecurring.isPending ? 0.5 : 1}
              >
                {createRecurring.isPending ? "Dodaję…" : "Dodaj"}
              </Text>
            </Flex>
          </VStack>
        </Box>
      )}

      {/* List */}
      {!recurring?.length ? (
        <VStack py={12} gap={3} color="gray.400">
          <Icon as={LuRepeat} boxSize={12} strokeWidth={1} />
          <Text fontSize="lg" fontWeight="600">Brak stałych kosztów</Text>
          <Text fontSize="sm">Dodaj np. Netflix, czynsz, Spotify</Text>
        </VStack>
      ) : (
        <VStack gap={2} align="stretch">
          {recurring.map((item) => (
            <RecurringRow
              key={item.id}
              item={item}
              onDelete={(id) => deleteRecurring.mutate(id)}
            />
          ))}
        </VStack>
      )}
    </VStack>
  );
}
