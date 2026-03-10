import { useState } from "react";
import { Box, Flex, Text, VStack, Input, Spinner, Icon } from "@chakra-ui/react";
import { LuPiggyBank, LuTrendingUp, LuTrendingDown } from "react-icons/lu";
import { useSummary, useSetBudget, useComparison } from "../../hooks/useExpenses";

const MONTH_NAMES = [
  "", "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];

function CategoryBudgetBar({ name, total, color, maxTotal }) {
  const pct = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
  return (
    <Box>
      <Flex justify="space-between" mb={1}>
        <Text fontSize="sm" color="gray.600">{name}</Text>
        <Text fontSize="sm" fontWeight="600" color="textSecondary">{total.toFixed(0)} zł</Text>
      </Flex>
      <Box bg="gray.100" borderRadius="full" h="8px">
        <Box h="100%" w={`${pct}%`} bg={color || "peach.400"} borderRadius="full" transition="width 0.3s" />
      </Box>
    </Box>
  );
}

export default function BudgetView({ year, month }) {
  const { data: summary, isLoading } = useSummary(year, month);
  const { data: comparison } = useComparison(year, month);
  const setBudget = useSetBudget();
  const [budgetInput, setBudgetInput] = useState("");
  const [editing, setEditing] = useState(false);

  if (isLoading) {
    return <Flex justify="center" py={12}><Spinner color="peach.500" size="lg" /></Flex>;
  }

  if (!summary) return null;

  const totalSpent = summary.total + summary.recurring_total;
  const budget = summary.budget;
  const pct = budget ? Math.min((totalSpent / budget) * 100, 120) : 0;
  const overBudget = budget && totalSpent > budget;
  const warning = budget && pct >= 80;

  const handleSetBudget = async (e) => {
    e.preventDefault();
    const val = parseFloat(budgetInput);
    if (!val || val <= 0) return;
    try {
      await setBudget.mutateAsync({ year, month, data: { amount: val } });
      setEditing(false);
      setBudgetInput("");
    } catch {
      // mutation error handled by TanStack Query
    }
  };

  const maxCategoryTotal = summary.by_category.length > 0
    ? Math.max(...summary.by_category.map((c) => c.total))
    : 0;

  return (
    <VStack gap={4} align="stretch">
      {/* Budget setting */}
      <Box bg="white" borderRadius="2xl" p={4} shadow="0 1px 8px 0 rgba(0,0,0,0.04)" borderWidth="1px" borderColor="gray.100">
        <Flex align="center" gap={2} mb={3}>
          <Icon as={LuPiggyBank} boxSize={5} color="peach.500" />
          <Text fontSize="md" fontWeight="700" color="textSecondary">
            Budżet na {MONTH_NAMES[month]}
          </Text>
        </Flex>

        {budget && !editing ? (
          <Box>
            <Flex justify="space-between" mb={2}>
              <Text fontSize="sm" color="gray.600">
                Wydano: <Text as="span" fontWeight="700">{totalSpent.toFixed(0)} zł</Text>
              </Text>
              <Text fontSize="sm" color="gray.600">
                Limit: <Text as="span" fontWeight="700">{budget.toFixed(0)} zł</Text>
              </Text>
            </Flex>

            {/* Progress bar */}
            <Box bg="gray.100" borderRadius="full" h="14px" overflow="hidden" mb={2}>
              <Box
                h="100%"
                w={`${Math.min(pct, 100)}%`}
                bg={overBudget ? "red.400" : warning ? "orange.400" : "green.400"}
                borderRadius="full"
                transition="width 0.5s ease"
              />
            </Box>

            <Flex justify="space-between">
              <Text fontSize="xs" color={overBudget ? "red.500" : "gray.500"}>
                {overBudget
                  ? `Przekroczono o ${(totalSpent - budget).toFixed(0)} zł`
                  : `Pozostało ${(budget - totalSpent).toFixed(0)} zł`}
              </Text>
              <Text fontSize="xs" color="gray.400">
                {pct.toFixed(0)}%
              </Text>
            </Flex>

            {/* Breakdown: regular vs recurring */}
            <Box mt={3} pt={3} borderTop="1px solid" borderColor="gray.100">
              <Flex justify="space-between" mb={1}>
                <Text fontSize="xs" color="gray.500">Wydatki jednorazowe</Text>
                <Text fontSize="xs" fontWeight="600" color="gray.600">{summary.total.toFixed(0)} zł</Text>
              </Flex>
              <Flex justify="space-between">
                <Text fontSize="xs" color="gray.500">Stałe koszty</Text>
                <Text fontSize="xs" fontWeight="600" color="gray.600">{summary.recurring_total.toFixed(0)} zł</Text>
              </Flex>
            </Box>

            <Text
              as="button"
              fontSize="xs"
              color="peach.500"
              mt={2}
              cursor="pointer"
              _hover={{ color: "peach.700" }}
              onClick={() => { setEditing(true); setBudgetInput(budget.toString()); }}
            >
              Zmień limit
            </Text>
          </Box>
        ) : (
          <Box as="form" onSubmit={handleSetBudget}>
            <Text fontSize="sm" color="gray.500" mb={2}>
              {budget ? "Zmień budżet na ten miesiąc:" : "Ustaw budżet na ten miesiąc:"}
            </Text>
            <Flex gap={2}>
              <Input
                placeholder="np. 3000"
                type="number"
                step="100"
                min="1"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                autoFocus
                size="sm"
                borderColor="peach.200"
                _focus={{ borderColor: "peach.400", boxShadow: "0 0 0 1px var(--chakra-colors-peach-400)" }}
              />
              <Text
                as="button"
                type="submit"
                bg="peach.400"
                color="white"
                fontWeight="600"
                px={4}
                py={1}
                borderRadius="xl"
                cursor="pointer"
                fontSize="sm"
                whiteSpace="nowrap"
                _hover={{ bg: "peach.500" }}
                opacity={!budgetInput || setBudget.isPending ? 0.5 : 1}
              >
                Zapisz
              </Text>
              {editing && (
                <Text
                  as="button"
                  type="button"
                  onClick={() => setEditing(false)}
                  color="gray.500"
                  fontWeight="500"
                  cursor="pointer"
                  px={2}
                  py={1}
                  fontSize="sm"
                  _hover={{ color: "textSecondary" }}
                >
                  Anuluj
                </Text>
              )}
            </Flex>
          </Box>
        )}
      </Box>

      {/* Category breakdown */}
      {summary.by_category.length > 0 && (
        <Box bg="white" borderRadius="2xl" p={4} shadow="0 1px 8px 0 rgba(0,0,0,0.04)" borderWidth="1px" borderColor="gray.100">
          <Text fontSize="sm" fontWeight="600" color="textSecondary" mb={3}>Wydatki wg kategorii</Text>
          <VStack gap={3} align="stretch">
            {summary.by_category.map((cat, i) => (
              <CategoryBudgetBar
                key={i}
                name={cat.category_name}
                total={cat.total}
                color={cat.category_color}
                maxTotal={maxCategoryTotal}
              />
            ))}
          </VStack>
        </Box>
      )}

      {/* Month comparison */}
      {comparison && comparison.previous.total > 0 && (
        <Box bg="white" borderRadius="2xl" p={4} shadow="0 1px 8px 0 rgba(0,0,0,0.04)" borderWidth="1px" borderColor="gray.100">
          <Flex align="center" gap={2} mb={3}>
            <Icon
              as={comparison.diff_total > 0 ? LuTrendingUp : LuTrendingDown}
              boxSize={5}
              color={comparison.diff_total > 0 ? "red.500" : "green.500"}
            />
            <Text fontSize="sm" fontWeight="600" color="textSecondary">
              Porównanie z {MONTH_NAMES[comparison.previous.month]}
            </Text>
          </Flex>

          <Flex gap={4} mb={3}>
            <Box flex={1} textAlign="center">
              <Text fontSize="xs" color="gray.500">{MONTH_NAMES[comparison.previous.month]}</Text>
              <Text fontSize="lg" fontWeight="700" color="gray.600">
                {comparison.previous.total.toFixed(0)} zł
              </Text>
            </Box>
            <Box flex={1} textAlign="center">
              <Text fontSize="xs" color="gray.500">{MONTH_NAMES[comparison.current.month]}</Text>
              <Text fontSize="lg" fontWeight="700" color="peach.600">
                {comparison.current.total.toFixed(0)} zł
              </Text>
            </Box>
          </Flex>

          {/* Per-category comparison */}
          <VStack gap={2} align="stretch" pt={2} borderTop="1px solid" borderColor="gray.100">
            {comparison.current.by_category.map((curCat, i) => {
              const prevCat = comparison.previous.by_category.find(
                (p) => p.category_name === curCat.category_name
              );
              const diff = curCat.total - (prevCat?.total || 0);
              if (diff === 0) return null;
              return (
                <Flex key={i} justify="space-between" fontSize="xs">
                  <Text color="gray.600">{curCat.category_name}</Text>
                  <Text fontWeight="600" color={diff > 0 ? "red.500" : "green.500"}>
                    {diff > 0 ? "+" : ""}{diff.toFixed(0)} zł
                  </Text>
                </Flex>
              );
            })}
          </VStack>
        </Box>
      )}
    </VStack>
  );
}
