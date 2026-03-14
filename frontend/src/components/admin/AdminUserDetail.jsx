import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Flex,
  Text,
  Heading,
  Button,
  SimpleGrid,
  Badge,
  Table,
  Spinner,
} from "@chakra-ui/react";
import {
  LuArrowLeft,
  LuCalendar,
  LuReceipt,
  LuShoppingCart,
  LuTarget,
  LuMic,
  LuScanLine,
} from "react-icons/lu";
import { adminApi } from "../../api/admin";
import { estimate_cost_breakdown } from "./utils";
import PlanBadge from "./components/PlanBadge";
import CostBadge from "./components/CostBadge";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function InfoCard({ icon, label, value, color = "blue.400" }) {
  return (
    <Box
      bg="gray.800"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="gray.700"
      p={4}
    >
      <Flex align="center" gap={2} mb={2} color={color}>
        {icon}
        <Text fontSize="xs" color="gray.400">{label}</Text>
      </Flex>
      <Text fontSize="2xl" fontWeight="bold" color="gray.100">
        {value}
      </Text>
    </Box>
  );
}

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery({
    queryKey: ["admin", "users", id],
    queryFn: () => adminApi.user(id),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="200px">
        <Spinner color="blue.400" size="lg" />
      </Flex>
    );
  }

  if (!user) {
    return (
      <Box>
        <Text color="gray.400">{"Nie znaleziono użytkownika"}</Text>
        <Button mt={4} onClick={() => navigate("/admin/users")} variant="ghost" color="gray.400">
          <LuArrowLeft /> {"Wróć do listy"}
        </Button>
      </Box>
    );
  }

  const costBreakdown = estimate_cost_breakdown(user.voice_calls_total);

  return (
    <Box>
      <Button
        variant="ghost"
        color="gray.400"
        size="sm"
        mb={4}
        onClick={() => navigate("/admin/users")}
        _hover={{ color: "blue.400" }}
      >
        <LuArrowLeft /> {"Wróć do listy"}
      </Button>

      {/* Header */}
      <Flex
        bg="gray.800"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="gray.700"
        p={5}
        mb={6}
        align="center"
        gap={4}
        direction={{ base: "column", sm: "row" }}
      >
        <Flex
          w="50px"
          h="50px"
          borderRadius="full"
          bg={user.plan === "pro" ? "blue.500/20" : "gray.600/30"}
          color={user.plan === "pro" ? "blue.400" : "gray.400"}
          align="center"
          justify="center"
          fontSize="lg"
          fontWeight="bold"
          flexShrink={0}
        >
          {user.username?.slice(0, 2).toUpperCase() || "??"}
        </Flex>
        <Box flex={1}>
          <Flex align="center" gap={2} mb={1} wrap="wrap">
            <Heading size="md" color="gray.100">{user.email}</Heading>
            <PlanBadge plan={user.plan} />
            {user.is_email_verified ? (
              <Badge bg="green.500/15" color="green.400" fontSize="xs" px={2} borderRadius="md">
                {"Zweryfikowany"}
              </Badge>
            ) : (
              <Badge bg="red.500/15" color="red.400" fontSize="xs" px={2} borderRadius="md">
                {"Niezweryfikowany"}
              </Badge>
            )}
          </Flex>
          <Text fontSize="sm" color="gray.400">
            {"@"}{user.username}{" · Rejestracja: "}{formatDate(user.created_at)}
            {" · Logowania: "}{user.login_count}
          </Text>
        </Box>
      </Flex>

      {/* Activity grid */}
      <Heading size="sm" color="gray.300" mb={3}>{"Aktywność"}</Heading>
      <SimpleGrid columns={{ base: 2, md: 3 }} gap={3} mb={6}>
        <InfoCard icon={<LuCalendar size={16} />} label="Wydarzenia" value={user.events_count} color="sky.400" />
        <InfoCard icon={<LuReceipt size={16} />} label="Wydatki" value={user.expenses_count} color="orange.400" />
        <InfoCard icon={<LuShoppingCart size={16} />} label="Listy zakupów" value={user.shopping_lists_count} color="green.400" />
        <InfoCard icon={<LuTarget size={16} />} label="Cele" value={user.goals_count} color="pink.400" />
        <InfoCard icon={<LuMic size={16} />} label="Wywołania głosowe" value={user.voice_calls_total} color="purple.400" />
        <InfoCard icon={<LuScanLine size={16} />} label="Skany paragonów" value={user.receipt_scans_total} color="teal.400" />
      </SimpleGrid>

      {/* AI & Costs */}
      <Box
        bg="gray.800"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="gray.700"
        p={5}
        mb={6}
      >
        <Heading size="sm" color="gray.300" mb={3}>{"AI i Koszty"}</Heading>
        <Flex align="center" gap={3} mb={3}>
          <Text color="gray.400" fontSize="sm">{"Szacowany koszt:"}</Text>
          <CostBadge cost={user.estimated_cost_usd} />
        </Flex>
        <Text fontSize="xs" color="gray.500" mb={2}>
          {"Whisper: $"}{costBreakdown.whisper.toFixed(6)}{" | GPT-4o mini: $"}{costBreakdown.gpt.toFixed(6)}
        </Text>
        <Text fontSize="xs" color="gray.600">
          {"Szacunek na podstawie "}{user.voice_calls_total}{" wywołań głosowych × śr. 30s × $0.006/min + tokeny GPT-4o mini"}
        </Text>
      </Box>

      {/* Rewards */}
      <Box
        bg="gray.800"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="gray.700"
        p={5}
        mb={6}
      >
        <Heading size="sm" color="gray.300" mb={3}>{"Nagrody"}</Heading>
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
          <Box>
            <Text fontSize="xs" color="gray.500">{"Poziom"}</Text>
            <Text fontSize="lg" fontWeight="bold" color="gray.100">
              {user.rewards_level ?? "—"}{" / 30"}
            </Text>
          </Box>
          <Box>
            <Text fontSize="xs" color="gray.500">{"Sparki ✨"}</Text>
            <Text fontSize="lg" fontWeight="bold" color="gray.100">
              {user.rewards_sparks ?? "—"}
            </Text>
          </Box>
          <Box>
            <Text fontSize="xs" color="gray.500">{"Streak 🔥"}</Text>
            <Text fontSize="lg" fontWeight="bold" color="gray.100">
              {user.rewards_streak ?? "—"}{" dni"}
            </Text>
          </Box>
          <Box>
            <Text fontSize="xs" color="gray.500">{"Avatar"}</Text>
            <Text fontSize="lg" fontWeight="bold" color="gray.100">
              {user.avatar_key || "—"}
            </Text>
          </Box>
        </SimpleGrid>
        {user.achievements_count > 0 && (
          <Text fontSize="sm" color="gray.400" mt={3}>
            {"Osiągnięcia: "}{user.achievements_count}{" odblokowanych"}
          </Text>
        )}
      </Box>

      {/* Recent expenses */}
      {user.recent_expenses?.length > 0 && (
        <Box
          bg="gray.800"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="gray.700"
          p={5}
          mb={6}
        >
          <Heading size="sm" color="gray.300" mb={3}>{"Ostatnie wydatki"}</Heading>
          <Table.Root size="sm" variant="plain">
            <Table.Header>
              <Table.Row borderBottomWidth="1px" borderColor="gray.700">
                <Table.ColumnHeader color="gray.400" fontSize="xs">{"Data"}</Table.ColumnHeader>
                <Table.ColumnHeader color="gray.400" fontSize="xs" textAlign="right">{"Kwota"}</Table.ColumnHeader>
                <Table.ColumnHeader color="gray.400" fontSize="xs">{"Opis"}</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {user.recent_expenses.map((exp, i) => (
                <Table.Row key={i} borderBottomWidth="1px" borderColor="gray.800">
                  <Table.Cell color="gray.400" fontSize="sm">{exp.date}</Table.Cell>
                  <Table.Cell textAlign="right" color="gray.200" fontSize="sm" fontWeight="600">
                    {Number(exp.amount).toFixed(2)}{" zł"}
                  </Table.Cell>
                  <Table.Cell color="gray.400" fontSize="sm">{exp.description || "—"}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      {/* Recent events */}
      {user.recent_events?.length > 0 && (
        <Box
          bg="gray.800"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="gray.700"
          p={5}
          mb={6}
        >
          <Heading size="sm" color="gray.300" mb={3}>{"Ostatnie wydarzenia"}</Heading>
          {user.recent_events.map((ev, i) => (
            <Flex
              key={i}
              py={2}
              borderBottomWidth={i < user.recent_events.length - 1 ? "1px" : "0"}
              borderColor="gray.800"
              justify="space-between"
            >
              <Text fontSize="sm" color="gray.200">{ev.title}</Text>
              <Text fontSize="sm" color="gray.500">{ev.start_at}</Text>
            </Flex>
          ))}
        </Box>
      )}

      {/* Subscription */}
      <Box
        bg="gray.800"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="gray.700"
        p={5}
      >
        <Heading size="sm" color="gray.300" mb={3}>{"Subskrypcja"}</Heading>
        <Flex gap={6} wrap="wrap">
          <Box>
            <Text fontSize="xs" color="gray.500">{"Status"}</Text>
            <Text fontSize="sm" color="gray.200">{user.subscription_status || "brak"}</Text>
          </Box>
          <Box>
            <Text fontSize="xs" color="gray.500">{"Koniec okresu"}</Text>
            <Text fontSize="sm" color="gray.200">{formatDate(user.subscription_end)}</Text>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
}
