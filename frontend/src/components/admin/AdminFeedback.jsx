import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Flex,
  Text,
  Heading,
  Button,
  HStack,
  Table,
  Spinner,
} from "@chakra-ui/react";
import { LuChevronLeft, LuChevronRight, LuX } from "react-icons/lu";
import { adminApi } from "../../api/admin";

const CATEGORIES = [
  { value: "", label: "Wszystkie", icon: "" },
  { value: "bug", label: "Bug", icon: "\uD83D\uDC1B" },
  { value: "idea", label: "Pomysł", icon: "\uD83D\uDCA1" },
  { value: "opinion", label: "Opinia", icon: "\uD83D\uDCAC" },
  { value: "broken", label: "Nie działa", icon: "\uD83D\uDD27" },
];

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncate(str, len) {
  if (!str) return "—";
  return str.length > len ? str.slice(0, len) + "..." : str;
}

function getCategoryBadge(cat) {
  const found = CATEGORIES.find((c) => c.value === cat);
  return found ? `${found.icon} ${found.label}` : cat;
}

export default function AdminFeedback() {
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const perPage = 20;

  const params = { page, per_page: perPage };
  if (category) params.category = category;

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "feedback", params],
    queryFn: () => adminApi.feedback(params),
    staleTime: 30_000,
  });

  const feedback = data?.feedback || [];
  const total = data?.total || 0;
  const pages = data?.pages || 1;

  return (
    <Box>
      <Heading size="lg" color="gray.100" mb={6}>
        {"Feedback"}
      </Heading>

      {/* Category filter */}
      <HStack gap={1} mb={4} wrap="wrap">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.value}
            size="sm"
            variant={category === cat.value ? "solid" : "ghost"}
            bg={category === cat.value ? "blue.500/20" : "transparent"}
            color={category === cat.value ? "blue.400" : "gray.400"}
            _hover={{ bg: "gray.700/50" }}
            onClick={() => { setCategory(cat.value); setPage(1); }}
          >
            {cat.icon && `${cat.icon} `}{cat.label}
          </Button>
        ))}
        <Text fontSize="sm" color="gray.500" ml="auto">
          {"Łącznie: "}{total}
        </Text>
      </HStack>

      {/* Table */}
      <Box
        bg="gray.800"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="gray.700"
        overflowX="auto"
      >
        {isLoading ? (
          <Flex justify="center" py={12}>
            <Spinner color="blue.400" />
          </Flex>
        ) : (
          <Table.Root size="sm" variant="plain">
            <Table.Header>
              <Table.Row borderBottomWidth="1px" borderColor="gray.700">
                <Table.ColumnHeader color="gray.400" fontSize="xs">{"Data"}</Table.ColumnHeader>
                <Table.ColumnHeader color="gray.400" fontSize="xs">{"Kategoria"}</Table.ColumnHeader>
                <Table.ColumnHeader color="gray.400" fontSize="xs">{"Wiadomość"}</Table.ColumnHeader>
                <Table.ColumnHeader color="gray.400" fontSize="xs">{"Email"}</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {feedback.map((fb) => (
                <Table.Row
                  key={fb.id}
                  borderBottomWidth="1px"
                  borderColor="gray.800"
                  cursor="pointer"
                  _hover={{ bg: "gray.700/30" }}
                  onClick={() => setSelectedFeedback(fb)}
                >
                  <Table.Cell color="gray.400" fontSize="sm" whiteSpace="nowrap">
                    {formatDate(fb.created_at)}
                  </Table.Cell>
                  <Table.Cell fontSize="sm">
                    {getCategoryBadge(fb.category)}
                  </Table.Cell>
                  <Table.Cell color="gray.300" fontSize="sm">
                    {truncate(fb.message, 80)}
                  </Table.Cell>
                  <Table.Cell color="gray.500" fontSize="sm">
                    {fb.email || "—"}
                  </Table.Cell>
                </Table.Row>
              ))}
              {feedback.length === 0 && (
                <Table.Row>
                  <Table.Cell colSpan={4} textAlign="center" py={8} color="gray.500">
                    {"Brak feedbacku"}
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
            >
              <LuChevronLeft /> {"Poprzednia"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              color="gray.400"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              {"Następna"} <LuChevronRight />
            </Button>
          </HStack>
        </Flex>
      )}

      {/* Detail modal */}
      {selectedFeedback && (
        <Box
          position="fixed"
          inset={0}
          zIndex={50}
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={() => setSelectedFeedback(null)}
        >
          <Box position="absolute" inset={0} bg="blackAlpha.700" />
          <Box
            position="relative"
            bg="gray.800"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="gray.700"
            p={6}
            maxW="600px"
            w="90%"
            maxH="80vh"
            overflowY="auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="md" color="gray.100">
                {getCategoryBadge(selectedFeedback.category)}
              </Heading>
              <Button
                variant="ghost"
                color="gray.400"
                size="sm"
                onClick={() => setSelectedFeedback(null)}
              >
                <LuX />
              </Button>
            </Flex>

            <Text color="gray.200" fontSize="md" mb={4} whiteSpace="pre-wrap">
              {selectedFeedback.message}
            </Text>

            <Box borderTopWidth="1px" borderColor="gray.700" pt={3}>
              <Text fontSize="xs" color="gray.500" mb={1}>
                {"Data: "}{formatDate(selectedFeedback.created_at)}
              </Text>
              {selectedFeedback.email && (
                <Text fontSize="xs" color="gray.500" mb={1}>
                  {"Email: "}{selectedFeedback.email}
                </Text>
              )}
              {selectedFeedback.user_agent && (
                <Text fontSize="xs" color="gray.600" wordBreak="break-all">
                  {"UA: "}{selectedFeedback.user_agent}
                </Text>
              )}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
