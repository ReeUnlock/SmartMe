import { useState, useMemo } from "react";
import {
  Box, Flex, Heading, Text, Icon, Input, VStack, Spinner,
} from "@chakra-ui/react";
import { LuArrowLeft, LuPlus, LuTrash2, LuArrowUpDown, LuPencil, LuBookmark, LuWallet, LuCheck } from "react-icons/lu";
import {
  useShoppingList, useAddItem, useUpdateItem, useUpdateList, useToggleItem, useDeleteItem, useReorderItems, useCategories, useSaveListAsExpense,
} from "../../hooks/useShopping";
import { useMembers } from "../../hooks/useExpenses";
import ShoppingItemRow from "./ShoppingItemRow";
import DateInput from "../common/DateInput";
import { parseItemInput, inferCategoryId } from "../../utils/shoppingUtils";
import { useShoppingTemplates } from "../../hooks/useShoppingTemplates";
import { useItemHistory } from "../../hooks/useItemHistory";

export default function ShoppingListDetail({ listId, onBack }) {
  const { data: list, isLoading } = useShoppingList(listId);
  const { data: categories } = useCategories();
  const addItem = useAddItem();
  const updateItem = useUpdateItem();
  const toggleItem = useToggleItem();
  const deleteItem = useDeleteItem();
  const updateList = useUpdateList();
  const reorderItems = useReorderItems();
  const saveTemplate = useShoppingTemplates((s) => s.saveTemplate);
  const existingTemplates = useShoppingTemplates((s) => s.templates);
  const recordItem = useItemHistory((s) => s.recordItem);
  const [newItemName, setNewItemName] = useState("");
  const [templateSaved, setTemplateSaved] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [isRenamingList, setIsRenamingList] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [expenseSaved, setExpenseSaved] = useState(false);
  const saveAsExpense = useSaveListAsExpense();

  // All hooks MUST be called before any conditional returns (Rules of Hooks)
  const allItems = list?.items || [];
  const unchecked = useMemo(() => allItems.filter((i) => !i.is_checked), [allItems]);
  const checked = useMemo(() => allItems.filter((i) => i.is_checked), [allItems]);
  const grouped = useMemo(() => groupByCategory(unchecked, categories), [unchecked, categories]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    try {
      const parsed = parseItemInput(newItemName.trim());
      const categoryId = selectedCategoryId ?? inferCategoryId(parsed.name, categories);
      await addItem.mutateAsync({
        listId,
        data: { ...parsed, category_id: categoryId },
      });
      recordItem(parsed.name, categoryId);
      setNewItemName("");
    } catch {
      // mutation error handled by TanStack Query
    }
  };

  const handleUpdateItem = async (itemId, updates) => {
    try {
      await updateItem.mutateAsync({ id: itemId, data: updates });
      setEditingItemId(null);
    } catch {
      // mutation error handled by TanStack Query
    }
  };

  const handleMoveItem = async (itemId, direction) => {
    const idx = unchecked.findIndex((i) => i.id === itemId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= unchecked.length) return;

    const reordered = unchecked.map((item, i) => {
      if (i === idx) return { id: unchecked[swapIdx].id, sort_order: i };
      if (i === swapIdx) return { id: unchecked[idx].id, sort_order: i };
      return { id: item.id, sort_order: i };
    });
    try {
      await reorderItems.mutateAsync({ listId, items: reordered });
    } catch {
      // mutation error handled by TanStack Query
    }
  };

  const handleClearChecked = async () => {
    for (const item of checked) {
      try {
        await deleteItem.mutateAsync(item.id);
      } catch {
        break;
      }
    }
  };

  if (isLoading) {
    return (
      <Flex justify="center" py={12}>
        <Spinner color="sage.500" size="lg" />
      </Flex>
    );
  }

  if (!list) return null;

  // Filter groups by selected category
  const filteredGroups = selectedCategoryId === null
    ? grouped
    : grouped.filter(({ categoryId }) => categoryId === selectedCategoryId);

  // Count items per category for filter badges
  const catCounts = new Map();
  for (const item of unchecked) {
    const cid = item.category_id || null;
    catCounts.set(cid, (catCounts.get(cid) || 0) + 1);
  }

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
        {isRenamingList ? (
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (renameValue.trim() && renameValue.trim() !== list.name) {
                  updateList.mutate({ id: listId, data: { name: renameValue.trim() } });
                }
                setIsRenamingList(false);
              } else if (e.key === "Escape") {
                setIsRenamingList(false);
              }
            }}
            onBlur={() => {
              if (renameValue.trim() && renameValue.trim() !== list.name) {
                updateList.mutate({ id: listId, data: { name: renameValue.trim() } });
              }
              setIsRenamingList(false);
            }}
            size="sm"
            flex={1}
            minW={0}
            fontWeight="700"
            fontFamily="'Nunito', sans-serif"
            borderColor="sage.300"
            borderRadius="md"
            autoFocus
            _focus={{ borderColor: "sage.400", boxShadow: "0 0 0 1px var(--chakra-colors-sage-400)" }}
          />
        ) : (
          <Flex align="center" gap={1} flex={1} minW={0} cursor="pointer" onClick={() => { setRenameValue(list.name); setIsRenamingList(true); }}>
            <Heading
              size={{ base: "md", md: "xl" }}
              color="sage.700"
              fontFamily="'Nunito', sans-serif"
              flex={1}
              truncate
            >
              {list.name}
            </Heading>
            <Icon as={LuPencil} boxSize={3.5} color="gray.300" flexShrink={0} _hover={{ color: "sage.500" }} />
          </Flex>
        )}
        <Text fontSize="xs" color="gray.400" fontWeight="500" flexShrink={0}>
          {checked.length}/{allItems.length}
        </Text>
        {unchecked.length > 1 && (
          <Icon
            as={LuArrowUpDown}
            boxSize={4}
            color={reorderMode ? "sage.500" : "gray.400"}
            cursor="pointer"
            flexShrink={0}
            _hover={{ color: "sage.500" }}
            onClick={() => setReorderMode((v) => !v)}
          />
        )}
      </Flex>

      {/* Store name + save template row */}
      {(list.store_name || unchecked.length > 0) && (
        <Flex align="center" justify="space-between" mb={2} px={1}>
          {list.store_name ? (
            <Text fontSize="2xs" color="sage.400" fontWeight="500">
              {list.store_name}
            </Text>
          ) : <Box />}
          {unchecked.length > 0 && !existingTemplates.some((t) => t.name === list.name) && (
            <Text
              as="button"
              type="button"
              fontSize="2xs"
              fontWeight="600"
              color={templateSaved ? "sage.500" : "sage.400"}
              _hover={{ color: "sage.600" }}
              transition="color 0.15s"
              display="flex"
              alignItems="center"
              gap={1}
              onClick={() => {
                const saved = saveTemplate(list.name, allItems, list.store_name);
                setTemplateSaved(saved !== false);
              }}
            >
              <Icon as={LuBookmark} boxSize={3} />
              {templateSaved ? "Zapisano" : "Zapisz szablon"}
            </Text>
          )}
        </Flex>
      )}

      {/* Add item form */}
      <Flex as="form" onSubmit={handleAddItem} gap={2} mb={3}>
        <Input
          placeholder={"np. 2 kg ziemniaki"}
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          size="sm"
          flex={1}
          minW={0}
          borderColor="sage.200"
          borderRadius="xl"
          _focus={{ borderColor: "sage.400", boxShadow: "0 0 0 1px var(--chakra-colors-sage-400)" }}
        />
        <Flex
          as="button"
          type="submit"
          align="center"
          justify="center"
          w={8}
          h={8}
          bg="sage.400"
          color="white"
          borderRadius="lg"
          cursor="pointer"
          flexShrink={0}
          _hover={{ bg: "sage.500" }}
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
              count={unchecked.length}
              active={selectedCategoryId === null}
              onClick={() => setSelectedCategoryId(null)}
            />
            {categories.map((cat) => {
              const count = catCounts.get(cat.id) || 0;
              return (
                <CategoryChip
                  key={cat.id}
                  label={cat.name}
                  count={count}
                  active={selectedCategoryId === cat.id}
                  onClick={() => setSelectedCategoryId(
                    selectedCategoryId === cat.id ? null : cat.id
                  )}
                />
              );
            })}
          </Flex>
        </Box>
      )}

      {/* Unchecked items — filtered by category */}
      {filteredGroups.map(({ category, items }) => (
        <Box key={category || "none"} mb={2}>
          {category && (
            <Text fontSize="2xs" fontWeight="700" color="sage.500" textTransform="uppercase" mb={1} px={1}>
              {category}
            </Text>
          )}
          <VStack gap={1} align="stretch">
            {items.map((item, idx) => (
              <ShoppingItemRow
                key={item.id}
                item={item}
                isEditing={editingItemId === item.id}
                onStartEdit={() => setEditingItemId(item.id)}
                onCancelEdit={() => setEditingItemId(null)}
                onSaveEdit={(updates) => handleUpdateItem(item.id, updates)}
                onToggle={() => toggleItem.mutate(item.id)}
                onDelete={() => deleteItem.mutate(item.id)}
                reorderMode={reorderMode && selectedCategoryId === null}
                isFirst={idx === 0}
                isLast={idx === items.length - 1}
                onMoveUp={() => handleMoveItem(item.id, "up")}
                onMoveDown={() => handleMoveItem(item.id, "down")}
              />
            ))}
          </VStack>
        </Box>
      ))}

      {/* Empty state when filter yields nothing */}
      {selectedCategoryId !== null && filteredGroups.length === 0 && unchecked.length > 0 && (
        <Text color="gray.400" textAlign="center" py={4} fontSize="sm">
          {"Brak produkt\u00F3w w tej kategorii."}
        </Text>
      )}

      {/* Checked items — always visible below unchecked */}
      {checked.length > 0 && (
        <Box mt={3}>
          <Flex align="center" justify="space-between" px={1} mb={1}>
            <Text fontSize="2xs" fontWeight="700" color="gray.400" textTransform="uppercase">
              {"Kupione"} ({checked.length})
            </Text>
            <Flex
              as="button"
              type="button"
              align="center"
              gap={1}
              fontSize="2xs"
              color="gray.400"
              fontWeight="500"
              cursor="pointer"
              _hover={{ color: "red.400" }}
              transition="color 0.15s"
              onClick={handleClearChecked}
            >
              <Icon as={LuTrash2} boxSize={3} />
              <Text>{"Wyczy\u015B\u0107"}</Text>
            </Flex>
          </Flex>
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

      {allItems.length === 0 && (
        <Text color="gray.400" textAlign="center" py={6} fontSize="sm">
          Lista jest pusta. Dodaj pierwszy produkt powyżej.
        </Text>
      )}

      {/* Save as expense button */}
      {checked.length > 0 || list.is_completed ? (
        <Box mt={4}>
          {expenseSaved ? (
            <Flex
              align="center"
              justify="center"
              gap={2}
              py={2.5}
              bg="green.50"
              color="green.600"
              borderRadius="xl"
              fontWeight="600"
              fontSize="sm"
            >
              <Icon as={LuCheck} boxSize={4} />
              <Text>{"Zapisano jako wydatek"}</Text>
            </Flex>
          ) : (
            <Flex
              as="button"
              type="button"
              align="center"
              justify="center"
              gap={2}
              w="100%"
              py={2.5}
              bg="peach.50"
              color="peach.600"
              border="1px solid"
              borderColor="peach.200"
              borderRadius="xl"
              fontWeight="600"
              fontSize="sm"
              cursor="pointer"
              _hover={{ bg: "peach.100" }}
              _active={{ transform: "scale(0.98)" }}
              transition="all 0.15s"
              onClick={() => setShowExpenseDialog(true)}
            >
              <Icon as={LuWallet} boxSize={4} />
              <Text>{"Zapisz jako wydatek"}</Text>
            </Flex>
          )}
        </Box>
      ) : allItems.length > 0 ? (
        <Box mt={4}>
          <Flex
            align="center"
            justify="center"
            gap={2}
            py={2.5}
            color="gray.300"
            fontSize="sm"
          >
            <Icon as={LuWallet} boxSize={4} />
            <Text>{"Najpierw oznacz kupione produkty"}</Text>
          </Flex>
        </Box>
      ) : null}

      {showExpenseDialog && (
        <SaveAsExpenseDialog
          listId={listId}
          listItems={allItems}
          shoppingCategories={categories}
          onClose={() => setShowExpenseDialog(false)}
          onSuccess={() => {
            setShowExpenseDialog(false);
            setExpenseSaved(true);
          }}
          saveAsExpense={saveAsExpense}
        />
      )}
    </Box>
  );
}

function CategoryChip({ label, count, active, onClick }) {
  return (
    <Flex
      align="center"
      gap={1}
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
      <Text as="span">{label}</Text>
      {count > 0 && (
        <Text
          as="span"
          fontSize="2xs"
          fontWeight="700"
          color={active ? "whiteAlpha.800" : "sage.400"}
        >
          {count}
        </Text>
      )}
    </Flex>
  );
}

function groupByCategory(items, categories) {
  const catMap = new Map();
  categories?.forEach((c) => catMap.set(c.id, c.name));

  const groups = new Map();
  for (const item of items) {
    const catId = item.category_id || null;
    const catName = catId ? (catMap.get(catId) || null) : null;
    const key = catName || "__none__";
    if (!groups.has(key)) groups.set(key, { categoryId: catId, items: [] });
    groups.get(key).items.push(item);
  }

  const result = [];
  for (const [key, { categoryId, items }] of groups) {
    if (key !== "__none__") result.push({ category: key, categoryId, items });
  }
  const uncategorized = groups.get("__none__");
  if (uncategorized) result.push({ category: null, categoryId: null, items: uncategorized.items });

  return result;
}

// Shopping category → Expense category mapping (mirrors backend)
const SHOPPING_TO_EXPENSE = {
  "Owoce i warzywa": "Jedzenie",
  "Nabiał": "Jedzenie",
  "Pieczywo": "Jedzenie",
  "Mięso i ryby": "Jedzenie",
  "Napoje": "Jedzenie",
  "Przekąski": "Jedzenie",
  "Chemia": "Dom",
  "Inne": "Inne",
};

function computeSplitPreview(items, shoppingCategories, totalAmount) {
  if (!items?.length || !totalAmount) return [];

  const catMap = new Map();
  shoppingCategories?.forEach((c) => catMap.set(c.id, c.name));

  const counts = {};
  for (const item of items) {
    const shopCatName = catMap.get(item.category_id) || "";
    const expCatName = SHOPPING_TO_EXPENSE[shopCatName] || "Inne";
    counts[expCatName] = (counts[expCatName] || 0) + 1;
  }

  const totalItems = Object.values(counts).reduce((a, b) => a + b, 0);
  if (totalItems === 0) return [];

  const entries = Object.entries(counts);
  const splits = [];
  let allocated = 0;

  for (let i = 0; i < entries.length; i++) {
    const [name, count] = entries[i];
    let amount;
    if (i === entries.length - 1) {
      amount = Math.round((totalAmount - allocated) * 100) / 100;
    } else {
      amount = Math.round((totalAmount * count / totalItems) * 100) / 100;
      allocated += amount;
    }
    if (amount > 0) splits.push({ name, count, amount });
  }

  return splits;
}

function SaveAsExpenseDialog({ listId, listItems, shoppingCategories, onClose, onSuccess, saveAsExpense }) {
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState(null);
  const [isShared, setIsShared] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: members } = useMembers();

  const checkedItems = listItems?.filter((i) => i.is_checked) || [];
  const val = parseFloat(amount);
  const splitPreview = computeSplitPreview(
    checkedItems.length > 0 ? checkedItems : listItems,
    shoppingCategories,
    val > 0 ? val : 0,
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!val || val <= 0) return;

    try {
      await saveAsExpense.mutateAsync({
        listId,
        data: {
          amount: val,
          date,
          paid_by_id: paidById,
          is_shared: isShared,
        },
      });
      onSuccess();
    } catch {
      // mutation error handled by TanStack Query
    }
  };

  return (
    <Box position="fixed" inset={0} zIndex={400} display="flex" alignItems={{ base: "flex-end", md: "center" }} justifyContent="center">
      <Box position="absolute" inset={0} bg="blackAlpha.400" onClick={onClose} />
      <Box
        as="form"
        onSubmit={handleSubmit}
        bg="white"
        borderRadius={{ base: "2xl 2xl 0 0", md: "2xl" }}
        p={6}
        w={{ base: "100%", md: "90%" }}
        maxW="400px"
        shadow="xl"
        position="relative"
        zIndex={1}
        maxH={{ base: "90dvh", md: "90vh" }}
        overflowY="auto"
        pb={{ base: "calc(24px + env(safe-area-inset-bottom, 0px))", md: "24px" }}
      >
        <Flex align="center" gap={2} mb={4}>
          <Icon as={LuWallet} boxSize={5} color="peach.500" />
          <Heading size="md" color="peach.600" fontFamily="'Nunito', sans-serif">
            {"Zapisz jako wydatek"}
          </Heading>
        </Flex>

        {/* Amount */}
        <Text fontSize="sm" fontWeight="500" color="gray.600" mb={1}>{"Kwota (zł) *"}</Text>
        <Input
          placeholder={"np. 149.90"}
          inputMode="decimal"
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
          mb={3}
          borderColor="peach.200"
          _focus={{ borderColor: "peach.400", boxShadow: "0 0 0 1px var(--chakra-colors-peach-400)" }}
        />

        {/* Category split preview */}
        {splitPreview.length > 1 && val > 0 && (
          <Box mb={3} p={3} bg="peach.50" borderRadius="xl">
            <Text fontSize="2xs" fontWeight="700" color="peach.600" textTransform="uppercase" mb={2}>
              {"Podział na kategorie"}
            </Text>
            <VStack gap={1} align="stretch">
              {splitPreview.map((s) => (
                <Flex key={s.name} justify="space-between" align="center">
                  <Text fontSize="xs" color="gray.600" fontWeight="500">
                    {s.name}
                    <Text as="span" color="gray.400" ml={1}>({s.count} {s.count === 1 ? "produkt" : s.count < 5 ? "produkty" : "produktów"})</Text>
                  </Text>
                  <Text fontSize="xs" fontWeight="600" color="peach.600">
                    {s.amount.toFixed(2)} {"zł"}
                  </Text>
                </Flex>
              ))}
            </VStack>
          </Box>
        )}

        {/* Date */}
        <Text fontSize="sm" fontWeight="500" color="gray.600" mb={1}>Data</Text>
        <DateInput
          value={date}
          onChange={setDate}
          accentColor="peach"
          mb={3}
        />

        {/* Paid by */}
        {members?.length > 0 && (
          <Box mb={3}>
            <Text fontSize="sm" fontWeight="500" color="gray.600" mb={1}>{"Kto płaci"}</Text>
            <Flex gap={1}>
              {members.map((m) => (
                <Text
                  key={m.id}
                  as="button"
                  type="button"
                  fontSize="xs"
                  px={2}
                  py={1}
                  borderRadius="md"
                  bg={paidById === m.id ? "peach.500" : "gray.100"}
                  color={paidById === m.id ? "white" : "gray.600"}
                  cursor="pointer"
                  fontWeight="500"
                  onClick={() => setPaidById(paidById === m.id ? null : m.id)}
                  _hover={{ bg: paidById === m.id ? "peach.600" : "gray.200" }}
                >
                  {m.name}
                </Text>
              ))}
            </Flex>
          </Box>
        )}

        {/* Shared */}
        <Flex
          align="center"
          gap={2}
          mb={4}
          cursor="pointer"
          onClick={() => setIsShared(!isShared)}
        >
          <Box
            w="18px"
            h="18px"
            borderRadius="md"
            border="2px solid"
            borderColor={isShared ? "peach.500" : "gray.300"}
            bg={isShared ? "peach.500" : "transparent"}
            display="flex"
            alignItems="center"
            justifyContent="center"
            transition="all 0.15s"
          >
            {isShared && <Text color="white" fontSize="xs" fontWeight="700" lineHeight="1">{"✓"}</Text>}
          </Box>
          <Text fontSize="sm" color="gray.600">{"Wydatek wspólny"}</Text>
        </Flex>

        {/* Actions */}
        <Flex gap={3} justify="flex-end">
          <Text
            as="button"
            type="button"
            onClick={onClose}
            color="gray.500"
            fontWeight="500"
            cursor="pointer"
            px={4}
            py={2}
            _hover={{ color: "textSecondary" }}
          >
            Anuluj
          </Text>
          <Text
            as="button"
            type="submit"
            bg="peach.500"
            color="white"
            fontWeight="600"
            px={5}
            py={2}
            borderRadius="xl"
            cursor="pointer"
            opacity={!amount || saveAsExpense.isPending ? 0.5 : 1}
            _hover={{ bg: "peach.600" }}
          >
            {saveAsExpense.isPending ? "Zapisuję…" : "Zapisz wydatek"}
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}
