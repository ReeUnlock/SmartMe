import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  Text,
  Heading,
  SimpleGrid,
  Table,
  Spinner,
} from "@chakra-ui/react";
import {
  LuUsers,
  LuActivity,
  LuCrown,
  LuUserPlus,
  LuMic,
  LuScanLine,
  LuMessageSquare,
  LuDollarSign,
} from "react-icons/lu";
import { adminApi } from "../../api/admin";
import StatCard from "./components/StatCard";
import CostBadge from "./components/CostBadge";
import PlanBadge from "./components/PlanBadge";

const FEEDBACK_ICONS = {
  bug: "\uD83D\uDC1B",
  idea: "\uD83D\uDCA1",
  opinion: "\uD83D\uDCAC",
  broken: "\uD83D\uDD27",
};

const FEEDBACK_LABELS = {
  bug: "Bug",
  idea: "Pomysł",
  opinion: "Opinia",
  broken: "Coś nie działa",
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminApi.stats(),
    staleTime: 30_000,
  });

  const { data: usersData } = useQuery({
    queryKey: ["admin", "users", { page: 1, per_page: 10, sort_by: "created_at" }],
    queryFn: () => adminApi.users({ page: 1, per_page: 10 }),
    staleTime: 30_000,
  });

  if (statsLoading) {
    return (
      <Flex justify="center" align="center" minH="200px">
        <Spinner color="blue.400" size="lg" />
      </Flex>
    );
  }

  if (!stats) return null;

  // Sort users by estimated cost descending for top 10 costly users
  const topCostlyUsers = usersData?.users
    ? [...usersData.users]
        .sort((a, b) => b.estimated_cost_usd - a.estimated_cost_usd)
        .filter((u) => u.estimated_cost_usd > 0)
        .slice(0, 10)
    : [];

  const feedbackCategories = stats.feedback_by_category || {};
  const maxFeedback = Math.max(...Object.values(feedbackCategories), 1);

  return (
    <Box>
      <Heading size="lg" color="gray.100" mb={6}>
        {"Dashboard"}
      </Heading>

      {/* KPI Cards Row 1 */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4} mb={4}>
        <StatCard
          label="Wszyscy użytkownicy"
          value={stats.total_users}
          icon={<LuUsers />}
          color="blue.400"
          onClick={() => navigate("/admin/users")}
        />
        <StatCard
          label="Aktywni (7d)"
          value={stats.active_last_7d}
          icon={<LuActivity />}
          color="green.400"
        />
        <StatCard
          label="Pro"
          value={stats.pro_users}
          icon={<LuCrown />}
          color="yellow.400"
        />
        <StatCard
          label="Nowi (30d)"
          value={stats.new_users_last_30d}
          icon={<LuUserPlus />}
          color="purple.400"
        />
      </SimpleGrid>

      {/* KPI Cards Row 2 */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4} mb={8}>
        <StatCard
          label="Zapytania głosowe"
          value={stats.total_voice_calls}
          icon={<LuMic />}
          color="orange.400"
        />
        <StatCard
          label="Skany paragonów"
          value={stats.total_receipt_scans}
          icon={<LuScanLine />}
          color="teal.400"
        />
        <StatCard
          label="Feedback"
          value={stats.total_feedback}
          icon={<LuMessageSquare />}
          color="pink.400"
          onClick={() => navigate("/admin/feedback")}
        />
        <StatCard
          label="Łączny koszt AI"
          value={`$${stats.total_estimated_cost_usd.toFixed(4)}`}
          icon={<LuDollarSign />}
          color="green.400"
        />
      </SimpleGrid>

      {/* Top 10 costly users */}
      {topCostlyUsers.length > 0 && (
        <Box
          bg="gray.800"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="gray.700"
          p={5}
          mb={8}
        >
          <Heading size="md" color="gray.100" mb={4}>
            {"TOP kosztowni użytkownicy"}
          </Heading>
          <Box overflowX="auto">
            <Table.Root size="sm" variant="plain">
              <Table.Header>
                <Table.Row borderBottomWidth="1px" borderColor="gray.700">
                  <Table.ColumnHeader color="gray.400" fontSize="xs">{"Użytkownik"}</Table.ColumnHeader>
                  <Table.ColumnHeader color="gray.400" fontSize="xs">{"Plan"}</Table.ColumnHeader>
                  <Table.ColumnHeader color="gray.400" fontSize="xs" textAlign="right">{"Voice"}</Table.ColumnHeader>
                  <Table.ColumnHeader color="gray.400" fontSize="xs" textAlign="right">{"Skany"}</Table.ColumnHeader>
                  <Table.ColumnHeader color="gray.400" fontSize="xs" textAlign="right">{"Koszt USD"}</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {topCostlyUsers.map((user) => (
                  <Table.Row
                    key={user.id}
                    borderBottomWidth="1px"
                    borderColor="gray.800"
                    cursor="pointer"
                    _hover={{ bg: "gray.700/30" }}
                    onClick={() => navigate(`/admin/users/${user.id}`)}
                  >
                    <Table.Cell>
                      <Flex align="center" gap={2}>
                        <Flex
                          w="32px"
                          h="32px"
                          borderRadius="full"
                          bg="blue.500/20"
                          color="blue.400"
                          align="center"
                          justify="center"
                          fontSize="xs"
                          fontWeight="bold"
                        >
                          {user.username?.slice(0, 2).toUpperCase() || "??"}
                        </Flex>
                        <Box>
                          <Text fontSize="sm" color="gray.200">{user.email}</Text>
                          <Text fontSize="xs" color="gray.500">{user.username}</Text>
                        </Box>
                      </Flex>
                    </Table.Cell>
                    <Table.Cell><PlanBadge plan={user.plan} /></Table.Cell>
                    <Table.Cell textAlign="right" color="gray.300" fontSize="sm">{user.voice_calls_total}</Table.Cell>
                    <Table.Cell textAlign="right" color="gray.300" fontSize="sm">{user.receipt_scans_total}</Table.Cell>
                    <Table.Cell textAlign="right"><CostBadge cost={user.estimated_cost_usd} /></Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        </Box>
      )}

      {/* Feedback breakdown & Activity */}
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
        {/* Feedback breakdown */}
        <Box
          bg="gray.800"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="gray.700"
          p={5}
        >
          <Heading size="md" color="gray.100" mb={4}>
            {"Feedback"}
          </Heading>
          <Box>
            {["bug", "idea", "opinion", "broken"].map((cat) => {
              const count = feedbackCategories[cat] || 0;
              const pct = maxFeedback > 0 ? (count / maxFeedback) * 100 : 0;
              return (
                <Flex key={cat} align="center" gap={3} mb={3}>
                  <Text fontSize="lg" w="24px" textAlign="center">
                    {FEEDBACK_ICONS[cat]}
                  </Text>
                  <Text fontSize="sm" color="gray.400" w="100px" flexShrink={0}>
                    {FEEDBACK_LABELS[cat]}
                  </Text>
                  <Box flex={1} bg="gray.700" borderRadius="full" h="8px">
                    <Box
                      bg="blue.400"
                      h="100%"
                      borderRadius="full"
                      w={`${pct}%`}
                      transition="width 0.3s"
                    />
                  </Box>
                  <Text fontSize="sm" color="gray.300" fontWeight="600" w="30px" textAlign="right">
                    {count}
                  </Text>
                </Flex>
              );
            })}
          </Box>
        </Box>

        {/* Activity */}
        <Box
          bg="gray.800"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="gray.700"
          p={5}
        >
          <Heading size="md" color="gray.100" mb={4}>
            {"Aktywność"}
          </Heading>
          <SimpleGrid columns={2} gap={4}>
            <Box
              bg="gray.700/30"
              borderRadius="lg"
              p={4}
              textAlign="center"
            >
              <Text fontSize="3xl" fontWeight="bold" color="green.400">
                {stats.active_last_7d}
              </Text>
              <Text fontSize="sm" color="gray.400">
                {"Aktywni 7 dni"}
              </Text>
            </Box>
            <Box
              bg="gray.700/30"
              borderRadius="lg"
              p={4}
              textAlign="center"
            >
              <Text fontSize="3xl" fontWeight="bold" color="blue.400">
                {stats.active_last_30d}
              </Text>
              <Text fontSize="sm" color="gray.400">
                {"Aktywni 30 dni"}
              </Text>
            </Box>
          </SimpleGrid>
        </Box>
      </SimpleGrid>
    </Box>
  );
}
