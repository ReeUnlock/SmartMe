import { useState } from "react";
import { Box, Flex, Text, Input, Icon } from "@chakra-ui/react";
import { LuPlus, LuZap } from "react-icons/lu";
import { useCreateExpense, useExpenseCategories, useMembers } from "../../hooks/useExpenses";
import useExpenseUndo from "../../hooks/useExpenseUndo";
import useRewards from "../../hooks/useRewards";
import useAchievements from "../../hooks/useAchievements";
import useChallenges from "../../hooks/useChallenges";
import { playSound } from "../../utils/soundManager";

const QUICK_AMOUNTS = [10, 20, 50, 100];

/**
 * Date rule for QuickAdd:
 * - If selected year/month is the current month → use today's date
 * - If selected year/month is a different month → use 1st of that month
 * This keeps behavior predictable: expenses always land in the month the user is viewing.
 */
function getDefaultDate(year, month) {
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === (now.getMonth() + 1);
  if (isCurrentMonth) {
    return now.toISOString().split("T")[0];
  }
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

export default function QuickAdd({ year, month }) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const { data: categories } = useExpenseCategories();
  const { data: members } = useMembers();
  const createExpense = useCreateExpense();
  const pushUndo = useExpenseUndo((s) => s.push);
  const grantReward = useRewards((s) => s.reward);
  const addBonusSparks = useRewards((s) => s.addBonusSparks);
  const trackProgress = useAchievements((s) => s.trackProgress);
  const trackChallenge = useChallenges((s) => s.trackAction);

  const expenseDate = getDefaultDate(year, month);

  const handleQuickAmount = async (val) => {
    try {
      const created = await createExpense.mutateAsync({
        amount: val,
        date: expenseDate,
        description: "",
        category_id: selectedCategory,
        paid_by_id: selectedMember,
      });
      pushUndo({ type: "create", expense: created });
      playSound("expenseAdded");
      grantReward("expense_added");
      trackProgress("expenses_logged", 1, addBonusSparks);
      trackChallenge("expense", addBonusSparks);
    } catch {
      // mutation error handled by TanStack Query
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return;

    try {
      const created = await createExpense.mutateAsync({
        amount: val,
        date: expenseDate,
        description: description.trim() || null,
        category_id: selectedCategory,
        paid_by_id: selectedMember,
      });
      pushUndo({ type: "create", expense: created });
      playSound("expenseAdded");
      grantReward("expense_added");
      trackProgress("expenses_logged", 1, addBonusSparks);
      trackChallenge("expense", addBonusSparks);
      setAmount("");
      setDescription("");
      setExpanded(false);
    } catch {
      // mutation error handled by TanStack Query
    }
  };

  // Show which date will be used
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === (now.getMonth() + 1);

  return (
    <Box bg="white" borderRadius="2xl" p={4} shadow="0 1px 8px 0 rgba(0,0,0,0.04)" borderWidth="1px" borderColor="gray.100">
      <Flex align="center" gap={2} mb={3} justify="space-between">
        <Flex align="center" gap={2}>
          <Icon as={LuZap} boxSize={4} color="peach.500" />
          <Text fontSize="sm" fontWeight="600" color="textSecondary">{"Szybkie dodawanie"}</Text>
        </Flex>
        {!isCurrentMonth && (
          <Text fontSize="2xs" color="gray.400">
            {"Data: 1."}{String(month).padStart(2, "0")}.{year}
          </Text>
        )}
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
            borderWidth="1px"
            borderColor="peach.100"
            fontWeight="700"
            fontSize="sm"
            cursor="pointer"
            _hover={{ bg: "peach.100" }}
            _active={{ transform: "scale(0.95)" }}
            transition="all 0.15s"
            onClick={() => !createExpense.isPending && handleQuickAmount(val)}
            opacity={createExpense.isPending ? 0.5 : 1}
            pointerEvents={createExpense.isPending ? "none" : "auto"}
          >
            {val} {"zł"}
          </Flex>
        ))}
      </Flex>

      {/* Custom amount form */}
      <Box as="form" onSubmit={handleSubmit}>
        <Flex gap={2}>
          <Input
            placeholder={"Kwota zł"}
            type="number"
            inputMode="decimal"
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
            placeholder={"Opis"}
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
            bg="peach.400"
            color="white"
            borderRadius="lg"
            w="36px"
            h="36px"
            cursor="pointer"
            flexShrink={0}
            _hover={{ bg: "peach.500" }}
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
                      bg={selectedCategory === cat.id ? "peach.400" : "peach.50"}
                      color={selectedCategory === cat.id ? "white" : "gray.600"}
                      cursor="pointer"
                      fontWeight="500"
                      onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                      _hover={{ bg: selectedCategory === cat.id ? "peach.500" : "peach.100" }}
                    >
                      {cat.name}
                    </Text>
                  ))}
                </Flex>
              </Box>
            )}

            {members?.length > 0 && (
              <Box>
                <Text fontSize="xs" color="gray.500" mb={1}>{"Kto płaci"}</Text>
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
                      bg={selectedMember === m.id ? "peach.400" : "peach.50"}
                      color={selectedMember === m.id ? "white" : "gray.600"}
                      cursor="pointer"
                      fontWeight="500"
                      onClick={() => setSelectedMember(selectedMember === m.id ? null : m.id)}
                      _hover={{ bg: selectedMember === m.id ? "peach.500" : "peach.100" }}
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
