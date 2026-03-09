import { useState } from "react";
import {
  Box, Flex, Heading, Text, Icon, Input, VStack, Spinner,
} from "@chakra-ui/react";
import { LuArrowLeft, LuPlus } from "react-icons/lu";
import {
  useShoppingList, useAddItem, useToggleItem, useDeleteItem, useCategories,
} from "../../hooks/useShopping";
import ShoppingItemRow from "./ShoppingItemRow";

export default function ShoppingListDetail({ listId, onBack }) {
  const { data: list, isLoading } = useShoppingList(listId);
  const { data: categories } = useCategories();
  const addItem = useAddItem();
  const toggleItem = useToggleItem();
  const deleteItem = useDeleteItem();
  const [newItemName, setNewItemName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const parsed = parseItemInput(newItemName.trim());
    await addItem.mutateAsync({
      listId,
      data: { ...parsed, category_id: selectedCategoryId },
    });
    setNewItemName("");
  };

  if (isLoading) {
    return (
      <Flex justify="center" py={12}>
        <Spinner color="sage.500" size="lg" />
      </Flex>
    );
  }

  if (!list) return null;

  const unchecked = list.items?.filter((i) => !i.is_checked) || [];
  const checked = list.items?.filter((i) => i.is_checked) || [];
  const grouped = groupByCategory(unchecked, categories);

  return (
    <Box px={{ base: 0, md: 6 }} py={{ base: 0, md: 4 }} maxW="600px" mx="auto" w="100%" overflow="hidden">
      {/* Header */}
      <Flex align="center" gap={2} mb={3}>
        <Icon
          as={LuArrowLeft}
          boxSize={5}
          color="gray.500"
          cursor="pointer"
          flexShrink={0}
          _hover={{ color: "sage.500" }}
          onClick={onBack}
        />
        <Heading
          size={{ base: "md", md: "xl" }}
          color="sage.700"
          fontFamily="'Nunito', sans-serif"
          flex={1}
          truncate
        >
          {list.name}
        </Heading>
        <Text fontSize="xs" color="gray.400" fontWeight="500" flexShrink={0}>
          {checked.length}/{list.items?.length || 0}
        </Text>
      </Flex>

      {/* Add item form */}
      <Flex as="form" onSubmit={handleAddItem} gap={2} mb={3}>
        <Input
          placeholder="Dodaj produkt, np. 2 kg ziemniaki"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          size="sm"
          flex={1}
          minW={0}
          borderColor="sage.200"
          borderRadius="lg"
          _focus={{ borderColor: "sage.400", boxShadow: "0 0 0 1px var(--chakra-colors-sage-400)" }}
        />
        <Flex
          as="button"
          type="submit"
          align="center"
          justify="center"
          w={8}
          h={8}
          bg="sage.500"
          color="white"
          borderRadius="lg"
          cursor="pointer"
          flexShrink={0}
          _hover={{ bg: "sage.600" }}
          opacity={!newItemName.trim() || addItem.isPending ? 0.5 : 1}
        >
          <Icon as={LuPlus} boxSize={4} />
        </Flex>
      </Flex>

      {/* Category filter */}
      {categories?.length > 0 && (
        <Box mb={3} mx={-1} overflow="hidden">
          <Flex
            gap={1.5}
            overflowX="auto"
            px={1}
            pb={1}
            css={{
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
            }}
          >
            <CategoryChip
              label="Wszystko"
              active={selectedCategoryId === null}
              onClick={() => setSelectedCategoryId(null)}
            />
            {categories.map((cat) => (
              <CategoryChip
                key={cat.id}
                label={cat.name}
                active={selectedCategoryId === cat.id}
                onClick={() => setSelectedCategoryId(
                  selectedCategoryId === cat.id ? null : cat.id
                )}
              />
            ))}
          </Flex>
        </Box>
      )}

      {/* Unchecked items */}
      {grouped.map(({ category, items }) => (
        <Box key={category || "none"} mb={2}>
          {category && (
            <Text fontSize="2xs" fontWeight="700" color="sage.500" textTransform="uppercase" mb={1} px={1}>
              {category}
            </Text>
          )}
          <VStack gap={1} align="stretch">
            {items.map((item) => (
              <ShoppingItemRow
                key={item.id}
                item={item}
                onToggle={() => toggleItem.mutate(item.id)}
                onDelete={() => deleteItem.mutate(item.id)}
              />
            ))}
          </VStack>
        </Box>
      ))}

      {/* Checked items */}
      {checked.length > 0 && (
        <Box mt={3}>
          <Text fontSize="2xs" fontWeight="700" color="gray.400" textTransform="uppercase" mb={1} px={1}>
            Kupione ({checked.length})
          </Text>
          <VStack gap={1} align="stretch">
            {checked.map((item) => (
              <ShoppingItemRow
                key={item.id}
                item={item}
                onToggle={() => toggleItem.mutate(item.id)}
                onDelete={() => deleteItem.mutate(item.id)}
              />
            ))}
          </VStack>
        </Box>
      )}

      {list.items?.length === 0 && (
        <Text color="gray.400" textAlign="center" py={6} fontSize="sm">
          Lista jest pusta. Dodaj pierwszy produkt powyżej.
        </Text>
      )}
    </Box>
  );
}

function CategoryChip({ label, active, onClick }) {
  return (
    <Text
      fontSize="2xs"
      fontWeight={active ? "700" : "500"}
      color={active ? "white" : "sage.600"}
      bg={active ? "sage.500" : "sage.50"}
      px={2.5}
      py={1}
      borderRadius="full"
      cursor="pointer"
      whiteSpace="nowrap"
      flexShrink={0}
      _hover={{ bg: active ? "sage.600" : "sage.100" }}
      transition="all 0.2s"
      onClick={onClick}
    >
      {label}
    </Text>
  );
}

function parseItemInput(input) {
  const match = input.match(/^(\d+[.,]?\d*)\s*(kg|g|l|ml|szt|x|op)?\s+(.+)$/i);
  if (match) {
    return {
      quantity: parseFloat(match[1].replace(",", ".")),
      unit: match[2]?.toLowerCase() || "szt",
      name: match[3],
    };
  }
  return { name: input };
}

function groupByCategory(items, categories) {
  const catMap = new Map();
  categories?.forEach((c) => catMap.set(c.id, c.name));

  const groups = new Map();
  for (const item of items) {
    const catName = item.category_id ? (catMap.get(item.category_id) || null) : null;
    if (!groups.has(catName)) groups.set(catName, []);
    groups.get(catName).push(item);
  }

  const result = [];
  for (const [cat, items] of groups) {
    if (cat) result.push({ category: cat, items });
  }
  const uncategorized = groups.get(null);
  if (uncategorized) result.push({ category: null, items: uncategorized });

  return result;
}
