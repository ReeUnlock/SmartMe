import { Box, Flex, Text, VStack, Spinner, Icon } from "@chakra-ui/react";
import { LuTrendingUp, LuTrendingDown, LuWallet, LuRepeat, LuUsers } from "react-icons/lu";
import { useSummary, useComparison } from "../../hooks/useExpenses";
import QuickAdd from "./QuickAdd";

function PieChart({ data }) {
  if (!data.length) return null;
  const total = data.reduce((s, d) => s + d.total, 0);
  if (total === 0) return null;

  const size = 180;
  const cx = size / 2, cy = size / 2, r = 70;
  let cumAngle = -90;

  const slices = data.map((d) => {
    const angle = (d.total / total) * 360;
    const startAngle = cumAngle;
    cumAngle += angle;
    const endAngle = cumAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const largeArc = angle > 180 ? 1 : 0;

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);

    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { ...d, path };
  });

  return (
    <Flex direction="column" align="center" gap={3}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.category_color || "#9CA3AF"} opacity={0.85} />
        ))}
        <circle cx={cx} cy={cy} r={35} fill="white" />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="14" fontWeight="700" fill="#374151">
          {total.toFixed(0)}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="10" fill="#9CA3AF">
          zł
        </text>
      </svg>
      <Flex flexWrap="wrap" gap={2} justify="center">
        {data.map((d, i) => (
          <Flex key={i} align="center" gap={1} fontSize="xs" color="gray.600">
            <Box w="8px" h="8px" borderRadius="full" bg={d.category_color || "#9CA3AF"} />
            <Text>{d.category_name}</Text>
            <Text fontWeight="600">{d.total.toFixed(0)} zł</Text>
          </Flex>
        ))}
      </Flex>
    </Flex>
  );
}

function BarChart({ data }) {
  if (!data.length) return null;
  const maxVal = Math.max(...data.map((d) => d.total), 1);
  const barW = Math.max(4, Math.min(12, Math.floor(280 / data.length) - 2));

  return (
    <Box overflowX="auto" pb={2}>
      <Flex align="flex-end" gap="2px" h="100px" minW={data.length * (barW + 2)}>
        {data.map((d, i) => {
          const h = Math.max(1, (d.total / maxVal) * 90);
          const isWeekend = [0, 6].includes(new Date(d.date).getDay());
          return (
            <Flex key={i} direction="column" align="center" flex="none" w={`${barW}px`}>
              <Box
                w="100%"
                h={`${h}px`}
                bg={d.total > 0 ? (isWeekend ? "peach.300" : "peach.400") : "gray.100"}
                borderRadius="2px"
                title={`${new Date(d.date).getDate()}: ${d.total.toFixed(2)} zł`}
              />
            </Flex>
          );
        })}
      </Flex>
      <Flex justify="space-between" mt={1}>
        <Text fontSize="2xs" color="gray.400">1</Text>
        <Text fontSize="2xs" color="gray.400">{data.length}</Text>
      </Flex>
    </Box>
  );
}

function BudgetProgress({ total, budget, recurring }) {
  if (!budget) return null;
  const spent = total + recurring;
  const pct = Math.min((spent / budget) * 100, 100);
  const overBudget = spent > budget;
  const warning = pct >= 80;

  return (
    <Box bg="white" borderRadius="xl" p={4} shadow="xs" border="1px solid" borderColor="gray.100">
      <Flex justify="space-between" mb={2}>
        <Text fontSize="sm" fontWeight="600" color="gray.700">Budżet miesięczny</Text>
        <Text fontSize="sm" fontWeight="700" color={overBudget ? "red.500" : warning ? "orange.500" : "green.500"}>
          {spent.toFixed(0)} / {budget.toFixed(0)} zł
        </Text>
      </Flex>
      <Box bg="gray.100" borderRadius="full" h="10px" overflow="hidden">
        <Box
          h="100%"
          w={`${pct}%`}
          bg={overBudget ? "red.400" : warning ? "orange.400" : "green.400"}
          borderRadius="full"
          transition="width 0.5s ease"
        />
      </Box>
      {overBudget && (
        <Text fontSize="xs" color="red.500" mt={1}>
          Przekroczono budżet o {(spent - budget).toFixed(0)} zł
        </Text>
      )}
      <Text fontSize="xs" color="gray.400" mt={1}>
        Pozostało: {Math.max(0, budget - spent).toFixed(0)} zł
      </Text>
    </Box>
  );
}

function StatCard({ icon, label, value, color = "peach.500" }) {
  return (
    <Box bg="white" borderRadius="xl" p={3} shadow="xs" border="1px solid" borderColor="gray.100" flex={1}>
      <Flex align="center" gap={2} mb={1}>
        <Icon as={icon} boxSize={4} color={color} />
        <Text fontSize="xs" color="gray.500">{label}</Text>
      </Flex>
      <Text fontSize="lg" fontWeight="700" color="gray.800">{value}</Text>
    </Box>
  );
}

export default function ExpensesDashboard({ year, month }) {
  const { data: summary, isLoading } = useSummary(year, month);
  const { data: comparison } = useComparison(year, month);

  if (isLoading) {
    return <Flex justify="center" py={12}><Spinner color="peach.500" size="lg" /></Flex>;
  }

  if (!summary) return null;

  const diffSign = comparison?.diff_total > 0 ? "+" : "";
  const DiffIcon = comparison?.diff_total > 0 ? LuTrendingUp : LuTrendingDown;

  return (
    <VStack gap={4} align="stretch">
      {/* Quick add */}
      <QuickAdd year={year} month={month} />

      {/* Stat cards */}
      <Flex gap={3}>
        <StatCard icon={LuWallet} label="Wydano" value={`${summary.total.toFixed(0)} zł`} />
        <StatCard icon={LuRepeat} label="Stałe koszty" value={`${summary.recurring_total.toFixed(0)} zł`} color="orange.400" />
      </Flex>

      {/* Comparison */}
      {comparison && comparison.previous.total > 0 && (
        <Flex
          bg={comparison.diff_total > 0 ? "red.50" : "green.50"}
          borderRadius="xl"
          p={3}
          align="center"
          gap={2}
        >
          <Icon
            as={DiffIcon}
            boxSize={5}
            color={comparison.diff_total > 0 ? "red.500" : "green.500"}
          />
          <Text fontSize="sm" color="gray.700">
            {comparison.diff_total > 0 ? "Więcej" : "Mniej"} o{" "}
            <Text as="span" fontWeight="700">
              {Math.abs(comparison.diff_total).toFixed(0)} zł
            </Text>{" "}
            niż w poprzednim miesiącu
            {comparison.diff_percent != null && (
              <Text as="span" color="gray.500"> ({diffSign}{comparison.diff_percent}%)</Text>
            )}
          </Text>
        </Flex>
      )}

      {/* Budget progress */}
      <BudgetProgress
        total={summary.total}
        budget={summary.budget}
        recurring={summary.recurring_total}
      />

      {/* Category pie chart */}
      {summary.by_category.length > 0 && (
        <Box bg="white" borderRadius="xl" p={4} shadow="xs" border="1px solid" borderColor="gray.100">
          <Text fontSize="sm" fontWeight="600" color="gray.700" mb={3}>Podział na kategorie</Text>
          <PieChart data={summary.by_category} />
        </Box>
      )}

      {/* Daily bar chart */}
      {summary.daily.length > 0 && (
        <Box bg="white" borderRadius="xl" p={4} shadow="xs" border="1px solid" borderColor="gray.100">
          <Text fontSize="sm" fontWeight="600" color="gray.700" mb={3}>Wydatki dzienne</Text>
          <BarChart data={summary.daily} />
        </Box>
      )}

      {/* By member */}
      {summary.by_member.length > 0 && (
        <Box bg="white" borderRadius="xl" p={4} shadow="xs" border="1px solid" borderColor="gray.100">
          <Flex align="center" gap={2} mb={3}>
            <Icon as={LuUsers} boxSize={4} color="peach.500" />
            <Text fontSize="sm" fontWeight="600" color="gray.700">Kto płacił</Text>
          </Flex>
          <VStack gap={2} align="stretch">
            {summary.by_member.map((m, i) => {
              const pct = summary.total > 0 ? (m.total / summary.total) * 100 : 0;
              return (
                <Box key={i}>
                  <Flex justify="space-between" mb={1}>
                    <Text fontSize="sm" color="gray.600">{m.member_name}</Text>
                    <Text fontSize="sm" fontWeight="600" color="gray.700">
                      {m.total.toFixed(0)} zł ({pct.toFixed(0)}%)
                    </Text>
                  </Flex>
                  <Box bg="gray.100" borderRadius="full" h="6px">
                    <Box
                      h="100%"
                      w={`${pct}%`}
                      bg={i === 0 ? "peach.400" : "peach.200"}
                      borderRadius="full"
                    />
                  </Box>
                </Box>
              );
            })}
          </VStack>
        </Box>
      )}
    </VStack>
  );
}
