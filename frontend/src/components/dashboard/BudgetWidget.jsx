import { Box, Flex, Text, Icon } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { LuWallet, LuChevronRight, LuTriangleAlert } from "react-icons/lu";
import { useSummary } from "../../hooks/useExpenses";

function formatCurrency(val) {
  if (!val && val !== 0) return "0 zł";
  return `${Math.round(val).toLocaleString("pl-PL")} zł`;
}

export default function BudgetWidget() {
  const navigate = useNavigate();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const { data: summary, isLoading } = useSummary(year, month);

  const total = summary?.total || 0;
  const budget = summary?.budget;
  const monthName = now.toLocaleDateString("pl-PL", { month: "long" });

  const budgetUsage = budget ? Math.round((total / budget) * 100) : 0;
  const isWarning = budget && budgetUsage >= 80;
  const isOver = budget && budgetUsage >= 100;

  // Bar color
  let barColor = "peach.300";
  let barBg = "peach.50";
  if (isOver) {
    barColor = "red.400";
    barBg = "red.50";
  } else if (isWarning) {
    barColor = "orange.400";
    barBg = "orange.50";
  }

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      shadow="0 1px 8px 0 rgba(0,0,0,0.04)"
      borderWidth="1px"
      borderColor="gray.100"
      overflow="hidden"
      cursor="pointer"
      transition="all 0.2s"
      _hover={{
        shadow: "0 2px 12px 0 rgba(244,115,64,0.08)",
        borderColor: "peach.200",
      }}
      onClick={() => navigate("/wydatki")}
    >
      {/* Header */}
      <Flex align="center" justify="space-between" px={4} pt={3.5} pb={2}>
        <Flex align="center" gap={2}>
          <Flex
            align="center"
            justify="center"
            w="28px"
            h="28px"
            borderRadius="lg"
            bg="peach.50"
          >
            <Icon as={LuWallet} boxSize="14px" color="peach.500" strokeWidth="2.5" />
          </Flex>
          <Text fontSize="sm" fontWeight="700" color="textSecondary">
            {"Wydatki"}
          </Text>
        </Flex>
        <Flex align="center" gap={1}>
          {isWarning && (
            <Icon
              as={LuTriangleAlert}
              boxSize="13px"
              color={isOver ? "red.400" : "orange.400"}
            />
          )}
          <Icon as={LuChevronRight} boxSize="14px" color="gray.300" />
        </Flex>
      </Flex>

      {/* Content */}
      <Box px={4} pb={3.5}>
        {isLoading ? (
          <Text fontSize="sm" color="gray.400" fontWeight="500" py={1}>
            {"Ładowanie..."}
          </Text>
        ) : total === 0 && !budget ? (
          <Text fontSize="sm" color="gray.400" fontWeight="500" py={1} lineHeight="1.5">
            {"Brak wydatków w tym miesiącu"}
          </Text>
        ) : (
          <>
            {/* Total amount */}
            <Flex align="baseline" gap={1.5} mb={1}>
              <Text
                fontSize="xl"
                fontWeight="800"
                color={isOver ? "red.500" : "peach.600"}
                lineHeight="1.2"
              >
                {formatCurrency(total)}
              </Text>
              <Text fontSize="xs" color="gray.400" fontWeight="500">
                {monthName}
              </Text>
            </Flex>

            {/* Budget progress bar */}
            {budget ? (
              <>
                <Box h="6px" bg={barBg} borderRadius="full" overflow="hidden" mb={1.5}>
                  <Box
                    h="100%"
                    w={`${Math.min(budgetUsage, 100)}%`}
                    bg={barColor}
                    borderRadius="full"
                    transition="width 0.4s ease"
                  />
                </Box>
                <Flex align="center" justify="space-between">
                  <Text fontSize="2xs" color="gray.400" fontWeight="500">
                    {`${budgetUsage}% budżetu`}
                  </Text>
                  <Text fontSize="2xs" color="gray.400" fontWeight="500">
                    {`z ${formatCurrency(budget)}`}
                  </Text>
                </Flex>
              </>
            ) : (
              <Text fontSize="2xs" color="gray.400" fontWeight="500">
                {"Budżet nie ustawiony"}
              </Text>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
