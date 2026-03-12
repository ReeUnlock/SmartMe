import { useState, useEffect } from "react";
import { Box, Flex, Text, Input, Heading } from "@chakra-ui/react";
import { useExpenseCategories, useMembers } from "../../hooks/useExpenses";
import DateInput from "../common/DateInput";
import BottomSheetDialog, { DialogActions } from "../common/BottomSheetDialog";

export default function AddExpenseDialog({ open, onClose, onSubmit, isLoading, defaultDate, expense }) {
  const isEdit = !!expense;

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split("T")[0]);
  const [categoryId, setCategoryId] = useState(null);
  const [paidById, setPaidById] = useState(null);
  const [isShared, setIsShared] = useState(false);

  const { data: categories } = useExpenseCategories();
  const { data: members } = useMembers();

  useEffect(() => {
    if (expense) {
      setAmount(String(expense.amount));
      setDescription(expense.description || "");
      setDate(expense.date);
      setCategoryId(expense.category_id);
      setPaidById(expense.paid_by_id);
      setIsShared(expense.is_shared || false);
    } else {
      setAmount("");
      setDescription("");
      setDate(defaultDate || new Date().toISOString().split("T")[0]);
      setCategoryId(null);
      setPaidById(null);
      setIsShared(false);
    }
  }, [expense, defaultDate, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return;

    onSubmit({
      amount: val,
      description: description.trim() || null,
      date,
      category_id: categoryId,
      paid_by_id: paidById,
      is_shared: isShared,
    });
  };

  return (
    <BottomSheetDialog open={open} onClose={onClose} maxW="400px" onSubmit={handleSubmit}>
      <Box px={4} pt={4} pb={1}>
        <Heading size="sm" mb={3} color="peach.600" fontFamily="'Nunito', sans-serif">
          {isEdit ? "Edytuj wydatek" : "Nowy wydatek"}
        </Heading>

        <Text fontSize="2xs" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" mb={1}>{"Kwota (zł) *"}</Text>
        <Input
          placeholder={"np. 49.90"}
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
          size="sm"
          mb={2.5}
          bg="gray.50"
          borderRadius="lg"
          borderColor="peach.200"
          _focus={{ bg: "white", borderColor: "peach.400", boxShadow: "0 0 0 1px var(--chakra-colors-peach-400)" }}
          _placeholder={{ color: "gray.400" }}
        />

        <Text fontSize="2xs" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" mb={1}>Opis</Text>
        <Input
          placeholder={"np. obiad, zakupy…"}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          size="sm"
          mb={2.5}
          bg="gray.50"
          borderRadius="lg"
          borderColor="peach.200"
          _focus={{ bg: "white", borderColor: "peach.400", boxShadow: "0 0 0 1px var(--chakra-colors-peach-400)" }}
          _placeholder={{ color: "gray.400" }}
        />

        <Text fontSize="2xs" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" mb={1}>Data</Text>
        <DateInput value={date} onChange={setDate} accentColor="peach" mb={2.5} />

        {categories?.length > 0 && (
          <Box mb={2.5}>
            <Text fontSize="2xs" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" mb={1}>Kategoria</Text>
            <Flex gap={1.5} flexWrap="wrap">
              {categories.map((cat) => (
                <Text
                  key={cat.id}
                  as="button"
                  type="button"
                  fontSize="xs"
                  fontWeight="600"
                  px={3}
                  py={1}
                  borderRadius="full"
                  bg={categoryId === cat.id ? "peach.400" : "peach.50"}
                  color={categoryId === cat.id ? "white" : "peach.600"}
                  cursor="pointer"
                  transition="all 0.15s"
                  onClick={() => setCategoryId(categoryId === cat.id ? null : cat.id)}
                  _hover={{ bg: categoryId === cat.id ? "peach.500" : "peach.100" }}
                >
                  {cat.name}
                </Text>
              ))}
            </Flex>
          </Box>
        )}

        {members?.length > 0 && (
          <Box mb={2.5}>
            <Text fontSize="2xs" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" mb={1}>{"Kto płaci"}</Text>
            <Flex gap={1.5}>
              {members.map((m) => (
                <Text
                  key={m.id}
                  as="button"
                  type="button"
                  fontSize="xs"
                  fontWeight="600"
                  px={3}
                  py={1}
                  borderRadius="full"
                  bg={paidById === m.id ? "peach.400" : "peach.50"}
                  color={paidById === m.id ? "white" : "peach.600"}
                  cursor="pointer"
                  transition="all 0.15s"
                  onClick={() => setPaidById(paidById === m.id ? null : m.id)}
                  _hover={{ bg: paidById === m.id ? "peach.500" : "peach.100" }}
                >
                  {m.name}
                </Text>
              ))}
            </Flex>
          </Box>
        )}

        <Flex
          align="center"
          gap={2}
          cursor="pointer"
          onClick={() => setIsShared(!isShared)}
          py={1.5}
          px={2}
          borderRadius="lg"
          bg={isShared ? "peach.50" : "transparent"}
          transition="all 0.15s"
          _hover={{ bg: "peach.50" }}
        >
          <Flex
            w="18px" h="18px" borderRadius="sm" border="2px solid"
            borderColor={isShared ? "peach.400" : "gray.300"}
            bg={isShared ? "peach.400" : "transparent"}
            align="center" justify="center" transition="all 0.15s" flexShrink={0}
          >
            {isShared && <Text color="white" fontSize="2xs" fontWeight="700" lineHeight="1">{"✓"}</Text>}
          </Flex>
          <Text fontSize="sm" color={isShared ? "peach.600" : "gray.600"} fontWeight="500">{"Wydatek wspólny"}</Text>
        </Flex>
      </Box>

      <DialogActions>
        <Flex gap={3} justify="flex-end">
          <Text as="button" type="button" onClick={onClose} color="gray.500" fontWeight="500" cursor="pointer" px={3} py={1.5} fontSize="sm" _hover={{ color: "textSecondary" }}>
            Anuluj
          </Text>
          <Text
            as="button" type="submit" bg="peach.400" color="white" fontWeight="600"
            px={5} py={2} borderRadius="xl" cursor="pointer" fontSize="sm"
            opacity={!amount || isLoading ? 0.5 : 1}
            _hover={{ bg: "peach.500" }} transition="all 0.15s"
          >
            {isLoading ? (isEdit ? "Zapisuję…" : "Dodaję…") : (isEdit ? "Zapisz" : "Dodaj")}
          </Text>
        </Flex>
      </DialogActions>
    </BottomSheetDialog>
  );
}
