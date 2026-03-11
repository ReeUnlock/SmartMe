import { useState } from "react";
import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import ExpensesDashboard from "./ExpensesDashboard";
import ExpensesList from "./ExpensesList";
import BudgetView from "./BudgetView";
import RecurringExpenses from "./RecurringExpenses";
import ExpenseUndoBar from "./ExpenseUndoBar";

const TABS = [
  { key: "dashboard", label: "Przegląd" },
  { key: "list", label: "Lista" },
  { key: "budget", label: "Budżet" },
  { key: "recurring", label: "Stałe" },
];

export default function ExpensesPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [activeTab, setActiveTab] = useState("dashboard");

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

      <ExpenseUndoBar />
    </Box>
  );
}
