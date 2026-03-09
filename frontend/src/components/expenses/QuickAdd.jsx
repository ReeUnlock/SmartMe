import { useState } from "react";
import { Box, Flex, Text, Input, Icon } from "@chakra-ui/react";
import { LuPlus, LuZap } from "react-icons/lu";
import { useCreateExpense, useExpenseCategories, useMembers } from "../../hooks/useExpenses";

const QUICK_AMOUNTS = [10, 20, 50, 100];

export default function QuickAdd({ year, month }) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const { data: categories } = useExpenseCategories();
  const { data: members } = useMembers();
  const createExpense = useCreateExpense();

  const today = new Date().toISOString().split("T")[0];

  const handleQuickAmount = async (val) => {
    await createExpense.mutateAsync({
      amount: val,
      date: today,
      description: "",
      category_id: selectedCategory,
      paid_by_id: selectedMember,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return;

    await createExpense.mutateAsync({
      amount: val,
      date: today,
      description: description.trim() || null,
      category_id: selectedCategory,
      paid_by_id: selectedMember,
    });
    setAmount("");
    setDescription("");
    setExpanded(false);
  };

  return (
    <Box bg="white" borderRadius="xl" p={4} shadow="xs" border="1px solid" borderColor="gray.100">
      <Flex align="center" gap={2} mb={3}>
        <Icon as={LuZap} boxSize={4} color="peach.500" />
        <Text fontSize="sm" fontWeight="600" color="gray.700">Szybkie dodawanie</Text>
      </Flex>

      {/* Quick amount buttons */}
      <Flex gap={2} mb={3}>
        {QUICK_AMOUNTS.map((val) => (
          <Flex
            key={val}
            flex={1}
            justify="center"
            py={2}
            bg="peach.50"
            color="peach.600"
            borderRadius="lg"
            fontWeight="700"
            fontSize="sm"
            cursor="pointer"
            _hover={{ bg: "peach.100" }}
            _active={{ transform: "scale(0.95)" }}
            transition="all 0.15s"
            onClick={() => handleQuickAmount(val)}
            opacity={createExpense.isPending ? 0.5 : 1}
          >
            {val} zł
          </Flex>
        ))}
      </Flex>

      {/* Custom amount form */}
      <Box as="form" onSubmit={handleSubmit}>
        <Flex gap={2}>
          <Input
            placeholder="Kwota"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onFocus={() => setExpanded(true)}
            size="sm"
            borderColor="peach.200"
            _focus={{ borderColor: "peach.400", boxShadow: "0 0 0 1px var(--chakra-colors-peach-400)" }}
            flex={1}
          />
          <Input
            placeholder="Opis (opcjonalnie)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onFocus={() => setExpanded(true)}
            size="sm"
            borderColor="peach.200"
            _focus={{ borderColor: "peach.400", boxShadow: "0 0 0 1px var(--chakra-colors-peach-400)" }}
            flex={2}
          />
          <Flex
            as="button"
            type="submit"
            align="center"
            justify="center"
            bg="peach.500"
            color="white"
            borderRadius="lg"
            w="36px"
            h="36px"
            cursor="pointer"
            flexShrink={0}
            _hover={{ bg: "peach.600" }}
            opacity={!amount || createExpense.isPending ? 0.5 : 1}
          >
            <Icon as={LuPlus} boxSize={4} />
          </Flex>
        </Flex>

        {/* Category & member selector (expanded) */}
        {expanded && (
          <Box mt={3}>
            {categories?.length > 0 && (
              <Box mb={2}>
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
                      bg={selectedCategory === cat.id ? "peach.500" : "gray.100"}
                      color={selectedCategory === cat.id ? "white" : "gray.600"}
                      cursor="pointer"
                      fontWeight="500"
                      onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                      _hover={{ bg: selectedCategory === cat.id ? "peach.600" : "gray.200" }}
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
                      bg={selectedMember === m.id ? "peach.500" : "gray.100"}
                      color={selectedMember === m.id ? "white" : "gray.600"}
                      cursor="pointer"
                      fontWeight="500"
                      onClick={() => setSelectedMember(selectedMember === m.id ? null : m.id)}
                      _hover={{ bg: selectedMember === m.id ? "peach.600" : "gray.200" }}
                    >
                      {m.name}
                    </Text>
                  ))}
                </Flex>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
