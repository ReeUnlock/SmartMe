import { useState } from "react";
import { Box, Flex, Text, Input, Heading } from "@chakra-ui/react";
import { LuChevronLeft, LuChevronRight, LuCalendar, LuX } from "react-icons/lu";

const CATEGORIES = [
  { value: "finanse", label: "Finanse" },
  { value: "zdrowie", label: "Zdrowie" },
  { value: "rozwoj", label: "Rozwój" },
  { value: "podroze", label: "Podróże" },
  { value: "dom", label: "Dom" },
  { value: "inne", label: "Inne" },
];

const MONTH_NAMES = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];
const DAY_LABELS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

function toDateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function MiniCalendar({ value, onChange }) {
  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const initial = value ? new Date(value) : today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1);
  const startDow = (firstDay.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <Box
      bg="rose.50"
      borderRadius="xl"
      p={3}
      mb={4}
      borderWidth="1px"
      borderColor="rose.200"
    >
      {/* Month nav */}
      <Flex align="center" justify="space-between" mb={2}>
        <Box
          as="button" type="button" onClick={prevMonth}
          p={1} borderRadius="md" cursor="pointer"
          _hover={{ bg: "rose.100" }}
        >
          <Box as={LuChevronLeft} boxSize={4} color="rose.500" />
        </Box>
        <Text fontSize="sm" fontWeight="700" color="rose.700">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </Text>
        <Box
          as="button" type="button" onClick={nextMonth}
          p={1} borderRadius="md" cursor="pointer"
          _hover={{ bg: "rose.100" }}
        >
          <Box as={LuChevronRight} boxSize={4} color="rose.500" />
        </Box>
      </Flex>

      {/* Day labels */}
      <Flex mb={1}>
        {DAY_LABELS.map((dl, i) => (
          <Text
            key={dl}
            flex={1}
            textAlign="center"
            fontSize="2xs"
            fontWeight="600"
            color={i >= 5 ? "rose.400" : "gray.400"}
          >
            {dl}
          </Text>
        ))}
      </Flex>

      {/* Day cells */}
      <Flex flexWrap="wrap">
        {cells.map((day, i) => {
          if (day === null) {
            return <Box key={`e${i}`} flex="0 0 14.2857%" h={8} />;
          }
          const dateStr = toDateStr(viewYear, viewMonth, day);
          const isSelected = dateStr === value;
          const isToday = dateStr === todayStr;
          const dow = i % 7;
          const isWeekend = dow >= 5;

          return (
            <Flex
              key={day}
              flex="0 0 14.2857%"
              h={8}
              align="center"
              justify="center"
            >
              <Flex
                as="button"
                type="button"
                align="center"
                justify="center"
                w={7}
                h={7}
                borderRadius="full"
                cursor="pointer"
                fontSize="xs"
                fontWeight={isSelected || isToday ? "700" : "500"}
                bg={isSelected ? "rose.400" : "transparent"}
                color={isSelected ? "white" : isToday ? "rose.500" : isWeekend ? "rose.400" : "gray.600"}
                borderWidth={isToday && !isSelected ? "1.5px" : "0"}
                borderColor="rose.300"
                _hover={{ bg: isSelected ? "rose.500" : "rose.100" }}
                transition="all 0.15s"
                onClick={() => onChange(dateStr)}
              >
                {day}
              </Flex>
            </Flex>
          );
        })}
      </Flex>
    </Box>
  );
}

export default function GoalFormDialog({ open, onClose, onSubmit, isLoading }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [deadline, setDeadline] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);

  if (!open) return null;

  const reset = () => { setTitle(""); setDescription(""); setCategory(""); setDeadline(""); setShowCalendar(false); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      category: category || null,
      deadline: deadline || null,
    });
    reset();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={2000}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Box position="absolute" inset={0} bg="blackAlpha.400" onClick={onClose} />
      <Box
        as="form"
        onSubmit={handleSubmit}
        bg="white"
        borderRadius="2xl"
        p={6}
        w="90%"
        maxW="420px"
        shadow="xl"
        position="relative"
        zIndex={1}
        maxH="90vh"
        overflowY="auto"
      >
        <Heading size="md" mb={4} color="rose.700" fontFamily="'Nunito', sans-serif">
          {"Nowy cel"}
        </Heading>

        <Text fontSize="xs" fontWeight="600" color="gray.500" mb={1}>{"Tytuł *"}</Text>
        <Input
          placeholder={"np. Zaoszczędzić na wakacje"}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          mb={3}
          borderColor="rose.200"
          _focus={{ borderColor: "rose.400", boxShadow: "0 0 0 1px var(--chakra-colors-rose-400)" }}
        />

        <Text fontSize="xs" fontWeight="600" color="gray.500" mb={1}>{"Opis"}</Text>
        <Input
          placeholder={"Opcjonalny opis celu"}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          mb={3}
          borderColor="rose.200"
          _focus={{ borderColor: "rose.400", boxShadow: "0 0 0 1px var(--chakra-colors-rose-400)" }}
        />

        <Text fontSize="xs" fontWeight="600" color="gray.500" mb={1}>{"Kategoria"}</Text>
        <Flex gap={2} mb={3} flexWrap="wrap">
          {CATEGORIES.map((cat) => (
            <Text
              key={cat.value}
              as="button"
              type="button"
              fontSize="xs"
              fontWeight="600"
              px={3}
              py={1.5}
              borderRadius="full"
              cursor="pointer"
              bg={category === cat.value ? "rose.400" : "rose.50"}
              color={category === cat.value ? "white" : "rose.500"}
              _hover={{ bg: category === cat.value ? "rose.500" : "rose.100" }}
              transition="all 0.2s"
              onClick={() => setCategory(category === cat.value ? "" : cat.value)}
            >
              {cat.label}
            </Text>
          ))}
        </Flex>

        <Text fontSize="xs" fontWeight="600" color="gray.500" mb={1}>{"Termin"}</Text>
        {/* Date picker trigger */}
        <Flex
          align="center"
          gap={2}
          px={3}
          py={2}
          mb={showCalendar ? 2 : 4}
          borderRadius="lg"
          borderWidth="1px"
          borderColor={showCalendar ? "rose.400" : "rose.200"}
          cursor="pointer"
          transition="all 0.2s"
          _hover={{ borderColor: "rose.300" }}
          onClick={() => setShowCalendar(!showCalendar)}
        >
          <Box as={LuCalendar} boxSize={4} color="rose.400" />
          <Text flex={1} fontSize="sm" color={deadline ? "gray.700" : "gray.400"}>
            {deadline ? formatDate(deadline) : "Wybierz termin"}
          </Text>
          {deadline && (
            <Box
              as="button"
              type="button"
              p={0.5}
              borderRadius="full"
              _hover={{ bg: "rose.100" }}
              onClick={(e) => { e.stopPropagation(); setDeadline(""); }}
            >
              <Box as={LuX} boxSize={3.5} color="gray.400" />
            </Box>
          )}
        </Flex>

        {showCalendar && (
          <MiniCalendar
            value={deadline}
            onChange={(d) => { setDeadline(d); setShowCalendar(false); }}
          />
        )}

        <Flex gap={3} justify="flex-end">
          <Text
            as="button"
            type="button"
            onClick={() => { onClose(); reset(); }}
            color="gray.500"
            fontWeight="500"
            cursor="pointer"
            px={4}
            py={2}
            _hover={{ color: "gray.700" }}
          >
            {"Anuluj"}
          </Text>
          <Text
            as="button"
            type="submit"
            bg="rose.400"
            color="white"
            fontWeight="600"
            px={5}
            py={2}
            borderRadius="lg"
            cursor="pointer"
            opacity={!title.trim() || isLoading ? 0.5 : 1}
            _hover={{ bg: "rose.500" }}
          >
            {isLoading ? "Tworzę…" : "Utwórz"}
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}
