import { useState, useMemo } from "react";
import { Box, Flex, Text, Icon, VStack, Spinner, Input } from "@chakra-ui/react";
import { LuPlus, LuStar, LuTrash2, LuSparkles, LuSearch } from "react-icons/lu";
import {
  useBucketItems, useCreateBucketItem, useDeleteBucketItem, useToggleBucketItem,
} from "../../hooks/usePlans";
import BucketItemFormDialog from "./BucketItemFormDialog";
import { playSound } from "../../utils/soundManager";

const CATEGORY_LABELS = {
  podroze: "Podróże",
  rozwoj: "Rozwój",
  zdrowie: "Zdrowie",
  finanse: "Finanse",
  inne: "Inne",
};

const CATEGORY_COLORS = {
  podroze: "blue.400",
  rozwoj: "purple.400",
  zdrowie: "green.400",
  finanse: "orange.400",
  inne: "gray.400",
};

const CATEGORIES = [
  { value: "podroze", label: "Podróże" },
  { value: "rozwoj", label: "Rozwój" },
  { value: "zdrowie", label: "Zdrowie" },
  { value: "finanse", label: "Finanse" },
  { value: "inne", label: "Inne" },
];

export default function BucketListView() {
  const { data: items, isLoading } = useBucketItems();
  const createItem = useCreateBucketItem();
  const deleteItem = useDeleteBucketItem();
  const toggleItem = useToggleBucketItem();
  const [showForm, setShowForm] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const filtered = useMemo(() => {
    if (!items) return [];
    let list = items;

    if (categoryFilter) list = list.filter((i) => i.category === categoryFilter);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.description && i.description.toLowerCase().includes(q))
      );
    }

    return list;
  }, [items, search, categoryFilter]);

  const handleCreate = async (data) => {
    try {
      await createItem.mutateAsync(data);
      setShowForm(false);
    } catch {
      // mutation error handled by TanStack Query
    }
  };

  const pending = filtered.filter((i) => !i.is_completed);
  const completed = filtered.filter((i) => i.is_completed);
  const hasFilters = search || categoryFilter;

  return (
    <>
      <Flex align="center" justify="space-between" mb={3}>
        <Text fontSize="md" fontWeight="600" color="gray.600">
          {"Lista marzeń"}
        </Text>
        <Flex
          align="center"
          gap={2}
          px={3}
          py={2}
          bg="rose.300"
          color="white"
          borderRadius="xl"
          cursor="pointer"
          fontWeight="600"
          fontSize="sm"
          _hover={{ bg: "rose.400" }}
          _active={{ transform: "scale(0.97)" }}
          transition="all 0.2s"
          onClick={() => setShowForm(true)}
        >
          <Icon as={LuPlus} boxSize={4} />
          <Text>{"Nowe marzenie"}</Text>
        </Flex>
      </Flex>

      {/* Search */}
      <Flex align="center" gap={2} mb={2} position="relative">
        <Icon as={LuSearch} boxSize={4} color="gray.400" position="absolute" left={3} zIndex={1} />
        <Input
          placeholder={"Szukaj marzeń…"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="sm"
          pl={9}
          borderColor="rose.200"
          borderRadius="xl"
          _focus={{ borderColor: "rose.400", boxShadow: "0 0 0 1px var(--chakra-colors-rose-400)" }}
        />
      </Flex>

      {/* Category filter */}
      <Flex gap={1.5} mb={4} flexWrap="wrap">
        {CATEGORIES.map((cat) => (
          <Text
            key={cat.value}
            as="button"
            type="button"
            fontSize="2xs"
            fontWeight="600"
            px={2}
            py={0.5}
            borderRadius="full"
            cursor="pointer"
            bg={categoryFilter === cat.value ? "rose.300" : "gray.50"}
            color={categoryFilter === cat.value ? "white" : "gray.500"}
            _hover={{ bg: categoryFilter === cat.value ? "rose.400" : "gray.100" }}
            transition="all 0.2s"
            onClick={() => setCategoryFilter(categoryFilter === cat.value ? "" : cat.value)}
          >
            {cat.label}
          </Text>
        ))}
      </Flex>

      {isLoading ? (
        <Flex justify="center" py={12}>
          <Spinner color="rose.400" size="lg" />
        </Flex>
      ) : !filtered.length ? (
        <VStack py={16} gap={3} color="gray.400">
          <Icon as={LuStar} boxSize={16} strokeWidth={1} color="rose.200" />
          <Text fontSize="lg" fontWeight="600">
            {hasFilters ? "Brak wyników" : "Brak marzeń"}
          </Text>
          <Text fontSize="sm" textAlign="center">
            {hasFilters
              ? "Spróbuj zmienić filtry lub wyszukiwaną frazę"
              : 'Dodaj swoje pierwsze marzenie, klikaj\u0105c \u201ENowe marzenie\u201D'}
          </Text>
        </VStack>
      ) : (
        <VStack gap={3} align="stretch">
          {/* Pending items */}
          {pending.map((item) => (
            <BucketCard
              key={item.id}
              item={item}
              onToggle={() => {
                if (!item.is_completed) playSound("taskComplete");
                toggleItem.mutate(item.id);
              }}
              onDelete={() => deleteItem.mutate(item.id)}
            />
          ))}

          {/* Completed section */}
          {completed.length > 0 && (
            <>
              <Flex align="center" gap={2} mt={2}>
                <Icon as={LuSparkles} boxSize={4} color="rose.400" />
                <Text fontSize="sm" fontWeight="600" color="rose.400">
                  {"Spełnione"} ({completed.length})
                </Text>
              </Flex>
              {completed.map((item) => (
                <BucketCard
                  key={item.id}
                  item={item}
                  onToggle={() => toggleItem.mutate(item.id)}
                  onDelete={() => deleteItem.mutate(item.id)}
                />
              ))}
            </>
          )}
        </VStack>
      )}

      <BucketItemFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
        isLoading={createItem.isPending}
      />
    </>
  );
}

function BucketCard({ item, onToggle, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete();
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <Flex
      bg="white"
      borderRadius="2xl"
      borderWidth="1px"
      borderColor={item.is_completed ? "rose.200" : "gray.100"}
      shadow="0 1px 4px 0 rgba(0,0,0,0.04)"
      p={4}
      align="center"
      gap={3}
      opacity={item.is_completed ? 0.6 : 1}
      transition="all 0.2s"
    >
      {/* Toggle checkbox */}
      <Flex
        align="center"
        justify="center"
        w={6}
        h={6}
        borderRadius="full"
        borderWidth="2px"
        borderColor={item.is_completed ? "rose.400" : "gray.300"}
        bg={item.is_completed ? "rose.400" : "transparent"}
        cursor="pointer"
        transition="all 0.2s"
        flexShrink={0}
        onClick={onToggle}
      >
        {item.is_completed && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </Flex>

      <Box flex={1} minW={0}>
        <Text
          fontWeight="600"
          fontSize="md"
          truncate
          textDecoration={item.is_completed ? "line-through" : "none"}
          color={item.is_completed ? "gray.400" : "textPrimary"}
        >
          {item.title}
        </Text>
        <Flex gap={2} align="center">
          {item.category && (
            <Text fontSize="xs" color={CATEGORY_COLORS[item.category] || "gray.400"}>
              {CATEGORY_LABELS[item.category] || item.category}
            </Text>
          )}
          {item.description && (
            <Text fontSize="xs" color="gray.400" truncate>
              {item.description}
            </Text>
          )}
          {item.completed_date && (
            <Text fontSize="xs" color="gray.400">
              {new Date(item.completed_date).toLocaleDateString("pl-PL")}
            </Text>
          )}
        </Flex>
      </Box>

      {confirmDelete ? (
        <Text
          as="button"
          fontSize="xs"
          fontWeight="600"
          color="red.500"
          bg="red.50"
          px={2}
          py={1}
          borderRadius="md"
          cursor="pointer"
          _hover={{ bg: "red.100" }}
          onClick={handleDeleteClick}
        >
          {"Usuń?"}
        </Text>
      ) : (
        <Icon
          as={LuTrash2}
          boxSize={4}
          color="gray.300"
          cursor="pointer"
          _hover={{ color: "red.400" }}
          transition="color 0.2s"
          onClick={handleDeleteClick}
        />
      )}
    </Flex>
  );
}
