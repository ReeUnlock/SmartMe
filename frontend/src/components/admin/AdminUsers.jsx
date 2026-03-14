import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  Text,
  Heading,
  Input,
  Button,
  HStack,
  Table,
  Spinner,
} from "@chakra-ui/react";
import { LuSearch, LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { adminApi } from "../../api/admin";
import PlanBadge from "./components/PlanBadge";
import CostBadge from "./components/CostBadge";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatRelative(dateStr) {
  if (!dateStr) return "nigdy";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "przed chwilą";
  if (diffMin < 60) return `${diffMin} min temu`;
  if (diffH < 24) return `${diffH}h temu`;
  if (diffD < 7) return `${diffD} dni temu`;
  if (diffD < 30) return `${Math.floor(diffD / 7)} tyg. temu`;
  return `${Math.floor(diffD / 30)} mies. temu`;
}

const PLAN_OPTIONS = [
  { value: "", label: "Wszyscy" },
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
];

export default function AdminUsers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [plan, setPlan] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const perPage = 50;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const params = {
    page,
    per_page: perPage,
    sort_by: sortBy,
    sort_dir: sortDir,
  };
  if (debouncedSearch) params.search = debouncedSearch;
  if (plan) params.plan = plan;

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => adminApi.users(params),
    staleTime: 30_000,
  });

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
    setPage(1);
  };

  const sortIndicator = (col) => {
    if (sortBy !== col) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  const users = data?.users || [];
  const total = data?.total || 0;
  const pages = data?.pages || 1;

  return (
    <Box>
      <Heading size="lg" color="gray.100" mb={6}>
        {"Użytkownicy"}
      </Heading>

      {/* Toolbar */}
      <Flex
        gap={3}
        mb={4}
        direction={{ base: "column", md: "row" }}
        align={{ base: "stretch", md: "center" }}
      >
        <Box position="relative" flex={1} maxW={{ md: "300px" }}>
          <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.500">
            <LuSearch size={16} />
          </Box>
          <Input
            pl={9}
            placeholder="Szukaj po email lub nazwie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            bg="gray.800"
            borderColor="gray.700"
            color="gray.100"
            _placeholder={{ color: "gray.500" }}
            size="sm"
          />
        </Box>

        <HStack gap={1}>
          {PLAN_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={plan === opt.value ? "solid" : "ghost"}
              bg={plan === opt.value ? "blue.500/20" : "transparent"}
              color={plan === opt.value ? "blue.400" : "gray.400"}
              _hover={{ bg: "gray.700/50" }}
              onClick={() => { setPlan(opt.value); setPage(1); }}
            >
              {opt.label}
            </Button>
          ))}
        </HStack>

        <Text fontSize="sm" color="gray.500" ml="auto">
          {"Pokazuję "}{users.length}{" z "}{total}{" użytkowników"}
        </Text>
      </Flex>

      {/* Table */}
      <Box
        bg="gray.800"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="gray.700"
        overflowX="auto"
      >
        {isLoading ? (
          <Flex justify="center" align="center" py={12}>
            <Spinner color="blue.400" />
          </Flex>
        ) : (
          <Table.Root size="sm" variant="plain">
            <Table.Header>
              <Table.Row borderBottomWidth="1px" borderColor="gray.700">
                <Table.ColumnHeader color="gray.400" fontSize="xs" w="40px">{"#"}</Table.ColumnHeader>
                <Table.ColumnHeader
                  color="gray.400"
                  fontSize="xs"
                  cursor="pointer"
                  onClick={() => handleSort("email")}
                  _hover={{ color: "gray.200" }}
                >
                  {"Użytkownik"}{sortIndicator("email")}
                </Table.ColumnHeader>
                <Table.ColumnHeader color="gray.400" fontSize="xs">{"Plan"}</Table.ColumnHeader>
                <Table.ColumnHeader
                  color="gray.400"
                  fontSize="xs"
                  cursor="pointer"
                  onClick={() => handleSort("created_at")}
                  _hover={{ color: "gray.200" }}
                >
                  {"Rejestracja"}{sortIndicator("created_at")}
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color="gray.400"
                  fontSize="xs"
                  cursor="pointer"
                  onClick={() => handleSort("last_seen_at")}
                  _hover={{ color: "gray.200" }}
                >
                  {"Ostatnio"}{sortIndicator("last_seen_at")}
                </Table.ColumnHeader>
                <Table.ColumnHeader color="gray.400" fontSize="xs" textAlign="right">{"\uD83C\uDF99 Voice"}</Table.ColumnHeader>
                <Table.ColumnHeader color="gray.400" fontSize="xs" textAlign="right">{"\uD83E\uDDFE Skany"}</Table.ColumnHeader>
                <Table.ColumnHeader color="gray.400" fontSize="xs" textAlign="right">{"Koszt"}</Table.ColumnHeader>
                <Table.ColumnHeader color="gray.400" fontSize="xs" textAlign="right">{"\u2728 Poziom"}</Table.ColumnHeader>
                <Table.ColumnHeader color="gray.400" fontSize="xs"></Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {users.map((user, i) => (
                <Table.Row
                  key={user.id}
                  borderBottomWidth="1px"
                  borderColor="gray.800"
                  cursor="pointer"
                  _hover={{ bg: "gray.700/30" }}
                  onClick={() => navigate(`/admin/users/${user.id}`)}
                >
                  <Table.Cell color="gray.500" fontSize="xs">
                    {(page - 1) * perPage + i + 1}
                  </Table.Cell>
                  <Table.Cell>
                    <Flex align="center" gap={2}>
                      <Flex
                        w="32px"
                        h="32px"
                        borderRadius="full"
                        bg={user.plan === "pro" ? "blue.500/20" : "gray.600/30"}
                        color={user.plan === "pro" ? "blue.400" : "gray.400"}
                        align="center"
                        justify="center"
                        fontSize="xs"
                        fontWeight="bold"
                        flexShrink={0}
                      >
                        {user.username?.slice(0, 2).toUpperCase() || "??"}
                      </Flex>
                      <Box>
                        <Text fontSize="sm" color="gray.200" lineClamp={1}>{user.email}</Text>
                        <Text fontSize="xs" color="gray.500">{user.username}</Text>
                      </Box>
                    </Flex>
                  </Table.Cell>
                  <Table.Cell><PlanBadge plan={user.plan} /></Table.Cell>
                  <Table.Cell color="gray.400" fontSize="sm">{formatDate(user.created_at)}</Table.Cell>
                  <Table.Cell color="gray.400" fontSize="sm">{formatRelative(user.last_seen_at)}</Table.Cell>
                  <Table.Cell textAlign="right" color="gray.300" fontSize="sm">{user.voice_calls_total}</Table.Cell>
                  <Table.Cell textAlign="right" color="gray.300" fontSize="sm">{user.receipt_scans_total}</Table.Cell>
                  <Table.Cell textAlign="right"><CostBadge cost={user.estimated_cost_usd} /></Table.Cell>
                  <Table.Cell textAlign="right" color="gray.300" fontSize="sm">
                    {user.rewards_level != null ? `${user.rewards_level}` : "—"}
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                      size="xs"
                      variant="ghost"
                      color="blue.400"
                      _hover={{ bg: "blue.500/10" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/users/${user.id}`);
                      }}
                    >
                      {"Szczegóły"}
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
              {users.length === 0 && (
                <Table.Row>
                  <Table.Cell colSpan={10} textAlign="center" py={8} color="gray.500">
                    {"Brak użytkowników"}
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Root>
        )}
      </Box>

      {/* Pagination */}
      {pages > 1 && (
        <Flex justify="space-between" align="center" mt={4}>
          <Text fontSize="sm" color="gray.500">
            {"Strona "}{page}{" z "}{pages}
          </Text>
          <HStack gap={2}>
            <Button
              size="sm"
              variant="ghost"
              color="gray.400"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              _hover={{ bg: "gray.700/50" }}
            >
              <LuChevronLeft />
              {"Poprzednia"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              color="gray.400"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
              _hover={{ bg: "gray.700/50" }}
            >
              {"Następna"}
              <LuChevronRight />
            </Button>
          </HStack>
        </Flex>
      )}
    </Box>
  );
}
