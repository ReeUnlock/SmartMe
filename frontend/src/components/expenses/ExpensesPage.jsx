import { useState, useCallback } from "react";
import { Box, Flex, Heading, Text, Icon } from "@chakra-ui/react";
import { LuUndo2 } from "react-icons/lu";
import ExpensesDashboard from "./ExpensesDashboard";
import ExpensesList from "./ExpensesList";
import BudgetView from "./BudgetView";
import RecurringExpenses from "./RecurringExpenses";
import useExpenseUndo from "../../hooks/useExpenseUndo";
import { useUndoExpense } from "../../hooks/useExpenses";

const TABS = [
  { key: "dashboard", label: "Przegląd" },
  { key: "list", label: "Lista" },
  { key: "budget", label: "Budżet" },
  { key: "recurring", label: "Stałe" },
];

const UNDO_LABELS = {
  create: "Wydatek dodany",
  delete: "Wydatek usunięty",
  update: "Wydatek zapisany",
};

export default function ExpensesPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [undoing, setUndoing] = useState(false);

  const stack = useExpenseUndo((s) => s.stack);
  const undoExpense = useUndoExpense();

  const handleUndo = useCallback(async () => {
    setUndoing(true);
    try {
      await undoExpense();
    } catch {
      // Error handled by global mutation error handler
    } finally {
      setUndoing(false);
    }
  }, [undoExpense]);

  const MONTH_NAMES = [
    "", "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
    "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
  ];

  const goToPrevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const goToNextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const lastAction = stack[0];

  return (
    <Box px={{ base: 0, md: 6 }} py={{ base: 0, md: 4 }} maxW="600px" mx="auto" w="100%" overflow="hidden">
      {/* Header */}
      <Flex align="center" justify="space-between" mb={3}>
        <Heading size={{ base: "lg", md: "xl" }} color="peach.600" fontFamily="'Nunito', sans-serif">
          Wydatki
        </Heading>
      </Flex>

      {/* Month selector */}
      <Flex align="center" justify="center" gap={4} mb={4}>
        <Text
          as="button"
          onClick={goToPrevMonth}
          fontSize="xl"
          color="peach.500"
          fontWeight="700"
          cursor="pointer"
          px={2}
          _hover={{ color: "peach.700" }}
        >
          ‹
        </Text>
        <Text fontWeight="700" fontSize="md" color="textSecondary" minW="160px" textAlign="center">
          {MONTH_NAMES[month]} {year}
        </Text>
        <Text
          as="button"
          onClick={goToNextMonth}
          fontSize="xl"
          color="peach.500"
          fontWeight="700"
          cursor="pointer"
          px={2}
          _hover={{ color: "peach.700" }}
        >
          ›
        </Text>
      </Flex>

      {/* Tab bar */}
      <Flex
        gap={0}
        mb={5}
        bg="peach.50"
        borderRadius="xl"
        p="3px"
        overflow="hidden"
      >
        {TABS.map((tab) => (
          <Flex
            key={tab.key}
            flex={1}
            justify="center"
            align="center"
            py={2}
            borderRadius="lg"
            cursor="pointer"
            fontWeight="600"
            fontSize="sm"
            transition="all 0.2s"
            bg={activeTab === tab.key ? "white" : "transparent"}
            color={activeTab === tab.key ? "peach.600" : "gray.500"}
            shadow={activeTab === tab.key ? "sm" : "none"}
            onClick={() => setActiveTab(tab.key)}
            _hover={{ color: "peach.600" }}
          >
            {tab.label}
          </Flex>
        ))}
      </Flex>

      {/* Content */}
      <Box key={activeTab} className="sm-fade-in">
        {activeTab === "dashboard" && <ExpensesDashboard year={year} month={month} />}
        {activeTab === "list" && <ExpensesList year={year} month={month} />}
        {activeTab === "budget" && <BudgetView year={year} month={month} />}
        {activeTab === "recurring" && <RecurringExpenses year={year} month={month} />}
      </Box>

      {/* Floating undo bar */}
      {lastAction && (
        <Flex
          position="fixed"
          bottom={{ base: "calc(68px + env(safe-area-inset-bottom, 0px) + 64px)", md: "24px" }}
          left="50%"
          transform="translateX(-50%)"
          bg="white"
          borderRadius="xl"
          shadow="0 4px 20px 0 rgba(0,0,0,0.12)"
          borderWidth="1px"
          borderColor="peach.200"
          px={4}
          py={2.5}
          align="center"
          gap={3}
          zIndex={900}
          maxW="360px"
          w="auto"
          style={{
            animation: "undoSlideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <style>{`
            @keyframes undoSlideUp {
              from { opacity: 0; transform: translateX(-50%) translateY(12px); }
              to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
          `}</style>
          <Text fontSize="sm" fontWeight="600" color="textSecondary" whiteSpace="nowrap">
            {UNDO_LABELS[lastAction.type] || "Zmiana zapisana"}
          </Text>
          <Flex
            as="button"
            align="center"
            gap={1.5}
            px={3}
            py={1.5}
            bg="peach.50"
            color="peach.600"
            borderRadius="lg"
            cursor="pointer"
            fontWeight="700"
            fontSize="sm"
            _hover={{ bg: "peach.100" }}
            _active={{ transform: "scale(0.96)" }}
            transition="all 0.15s"
            opacity={undoing ? 0.5 : 1}
            onClick={handleUndo}
            whiteSpace="nowrap"
            flexShrink={0}
          >
            <Icon as={LuUndo2} boxSize="14px" />
            {"Cofnij"}
            {stack.length > 1 && (
              <Text as="span" fontSize="2xs" color="peach.400" fontWeight="500">
                ({stack.length})
              </Text>
            )}
          </Flex>
        </Flex>
      )}
    </Box>
  );
}
