import { useState, useEffect } from "react";
import { Box, Flex, Text, Input, Heading, Spinner } from "@chakra-ui/react";
import { useExpenseCategories } from "../../hooks/useExpenses";
import DateInput from "../common/DateInput";
import BottomSheetDialog, { DialogActions } from "../common/BottomSheetDialog";

const CATEGORIES = [
  { value: "finanse", label: "Finanse" },
  { value: "zdrowie", label: "Zdrowie" },
  { value: "rozwoj", label: "Rozwój" },
  { value: "podroze", label: "Podróże" },
  { value: "dom", label: "Dom" },
  { value: "inne", label: "Inne" },
];

const GOAL_TYPES = [
  { value: "manual", label: "Ręczny" },
  { value: "savings", label: "Oszczędności" },
  { value: "spending_limit", label: "Limit wydatków" },
];


export default function GoalFormDialog({ open, onClose, onSubmit, isLoading, goal }) {
  const isEdit = !!goal;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [goalType, setGoalType] = useState("manual");
  const [linkedCategoryId, setLinkedCategoryId] = useState(null);
  const [deadline, setDeadline] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("");

  const { data: expenseCategories, isLoading: catLoading } = useExpenseCategories();

  const isFinancial = goalType === "savings" || goalType === "spending_limit";

  useEffect(() => {
    if (open && goal) {
      setTitle(goal.title || "");
      setDescription(goal.description || "");
      setCategory(goal.category || "");
      setGoalType(goal.goal_type || "manual");
      setLinkedCategoryId(goal.linked_category_id || null);
      setDeadline(goal.deadline || "");
      setTargetValue(goal.target_value ? String(goal.target_value) : "");
      setUnit(goal.unit || "");
    } else if (open && !goal) {
      setTitle("");
      setDescription("");
      setCategory("");
      setGoalType("manual");
      setLinkedCategoryId(null);
      setDeadline("");
      setTargetValue("");
      setUnit("");
    }
  }, [open, goal]);

  useEffect(() => {
    if (isFinancial) {
      setUnit("zł");
    }
  }, [goalType]);

  useEffect(() => {
    if (goalType !== "spending_limit") {
      setLinkedCategoryId(null);
    }
  }, [goalType]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (goalType === "spending_limit" && !linkedCategoryId) return;

    const data = {
      title: title.trim(),
      description: description.trim() || null,
      category: category || null,
      goal_type: goalType,
      deadline: deadline || null,
      linked_category_id: goalType === "spending_limit" ? linkedCategoryId : null,
    };

    const tv = parseFloat(targetValue);
    if (!isNaN(tv) && tv > 0) {
      data.target_value = tv;
      data.unit = isFinancial ? "zł" : (unit.trim() || null);
    } else if (isEdit) {
      data.target_value = null;
      data.unit = null;
    }

    onSubmit(data);
  };


  const canSubmit = title.trim() && !isLoading &&
    (goalType !== "spending_limit" || linkedCategoryId);

  return (
    <BottomSheetDialog open={open} onClose={onClose} maxW="420px" onSubmit={handleSubmit}>
      <Box px={4} pt={4} pb={1}>
        <Heading size="sm" mb={3} color="rose.700" fontFamily="'Nunito', sans-serif">
          {isEdit ? "Edytuj cel" : "Nowy cel"}
        </Heading>

        <Text fontSize="2xs" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" mb={1}>{"Typ celu"}</Text>
        <Flex gap={1.5} mb={2.5} flexWrap="wrap">
          {GOAL_TYPES.map((gt) => (
            <Text
              key={gt.value}
              as="button"
              type="button"
              fontSize="xs"
              fontWeight="600"
              px={3}
              py={1}
              borderRadius="full"
              cursor="pointer"
              bg={goalType === gt.value ? "rose.300" : "rose.50"}
              color={goalType === gt.value ? "white" : "rose.500"}
              _hover={{ bg: goalType === gt.value ? "rose.400" : "rose.100" }}
              transition="all 0.15s"
              onClick={() => setGoalType(gt.value)}
            >
              {gt.label}
            </Text>
          ))}
        </Flex>

        {goalType === "spending_limit" && (
          <>
            <Text fontSize="2xs" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" mb={1}>{"Kategoria wydatków *"}</Text>
            {catLoading ? (
              <Flex py={2} mb={2.5}><Spinner size="sm" color="peach.400" /></Flex>
            ) : (
              <Flex gap={1.5} mb={2.5} flexWrap="wrap">
                {expenseCategories?.map((ec) => (
                  <Text
                    key={ec.id}
                    as="button"
                    type="button"
                    fontSize="xs"
                    fontWeight="600"
                    px={3}
                    py={1}
                    borderRadius="full"
                    cursor="pointer"
                    bg={linkedCategoryId === ec.id ? "peach.400" : "peach.50"}
                    color={linkedCategoryId === ec.id ? "white" : "peach.600"}
                    _hover={{ bg: linkedCategoryId === ec.id ? "peach.500" : "peach.100" }}
                    transition="all 0.15s"
                    onClick={() => setLinkedCategoryId(linkedCategoryId === ec.id ? null : ec.id)}
                  >
                    {ec.name}
                  </Text>
                ))}
              </Flex>
            )}
          </>
        )}

        <Text fontSize="2xs" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" mb={1}>{"Tytuł *"}</Text>
        <Input
          placeholder={goalType === "spending_limit"
            ? "np. Limit na jedzenie w marcu"
            : goalType === "savings"
              ? "np. Zaoszczędzić na wakacje"
              : "np. Przebiec 100 km"}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          size="sm"
          mb={2.5}
          bg="gray.50"
          borderRadius="lg"
          borderColor="rose.200"
          _focus={{ bg: "white", borderColor: "rose.400", boxShadow: "0 0 0 1px var(--chakra-colors-rose-400)" }}
          _placeholder={{ color: "gray.400" }}
        />

        <Text fontSize="2xs" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" mb={1}>{"Opis"}</Text>
        <Input
          placeholder={"Opis celu"}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          size="sm"
          mb={2.5}
          bg="gray.50"
          borderRadius="lg"
          borderColor="rose.200"
          _focus={{ bg: "white", borderColor: "rose.400", boxShadow: "0 0 0 1px var(--chakra-colors-rose-400)" }}
          _placeholder={{ color: "gray.400" }}
        />

        <Text fontSize="2xs" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" mb={1}>{"Kategoria celu"}</Text>
        <Flex gap={1.5} mb={2.5} flexWrap="wrap">
          {CATEGORIES.map((cat) => (
            <Text
              key={cat.value}
              as="button"
              type="button"
              fontSize="xs"
              fontWeight="600"
              px={3}
              py={1}
              borderRadius="full"
              cursor="pointer"
              bg={category === cat.value ? "rose.300" : "rose.50"}
              color={category === cat.value ? "white" : "rose.500"}
              _hover={{ bg: category === cat.value ? "rose.400" : "rose.100" }}
              transition="all 0.15s"
              onClick={() => setCategory(category === cat.value ? "" : cat.value)}
            >
              {cat.label}
            </Text>
          ))}
        </Flex>

        <Text fontSize="2xs" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" mb={1}>
          {goalType === "spending_limit" ? "Limit miesięczny *" : "Cel liczbowy"}
        </Text>
        <Flex gap={2} mb={2.5} align="center">
          <Input
            placeholder={isFinancial ? "np. 500" : "np. 10000"}
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            flex={2}
            size="sm"
            bg="gray.50"
            borderRadius="lg"
            borderColor="rose.200"
            _focus={{ bg: "white", borderColor: "rose.400", boxShadow: "0 0 0 1px var(--chakra-colors-rose-400)" }}
            _placeholder={{ color: "gray.400" }}
          />
          {isFinancial ? (
            <Flex align="center" justify="center" px={3} h="32px" bg="rose.50" borderRadius="lg" minW="40px" flexShrink={0}>
              <Text fontSize="xs" color="rose.500" fontWeight="600">{"zł"}</Text>
            </Flex>
          ) : (
            <Input
              placeholder={"np. km"}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              maxW="80px"
              flexShrink={0}
              textAlign="center"
              size="sm"
              bg="gray.50"
              borderRadius="lg"
              borderColor="rose.200"
              _focus={{ bg: "white", borderColor: "rose.400", boxShadow: "0 0 0 1px var(--chakra-colors-rose-400)" }}
              _placeholder={{ color: "gray.400" }}
            />
          )}
        </Flex>

        {goalType === "spending_limit" && (
          <Text fontSize="2xs" color="gray.400" mb={2.5}>
            {"Postęp będzie automatycznie liczony z wydatków w bieżącym miesiącu."}
          </Text>
        )}

        <DateInput
          value={deadline}
          onChange={setDeadline}
          accentColor="rose"
          label="Termin"
          placeholder="Wybierz termin"
          clearable
          mb={1}
        />
      </Box>

      <DialogActions>
        <Flex gap={3} justify="flex-end">
          <Text as="button" type="button" onClick={onClose} color="gray.500" fontWeight="500" cursor="pointer" px={3} py={1.5} fontSize="sm" _hover={{ color: "textSecondary" }}>
            {"Anuluj"}
          </Text>
          <Text
            as="button" type="submit" bg="rose.300" color="white" fontWeight="600"
            px={5} py={2} borderRadius="xl" cursor="pointer" fontSize="sm" transition="all 0.15s"
            opacity={canSubmit ? 1 : 0.5} _hover={{ bg: "rose.400" }}
          >
            {isLoading
              ? (isEdit ? "Zapisuję…" : "Tworzę…")
              : (isEdit ? "Zapisz" : "Utwórz")}
          </Text>
        </Flex>
      </DialogActions>
    </BottomSheetDialog>
  );
}
