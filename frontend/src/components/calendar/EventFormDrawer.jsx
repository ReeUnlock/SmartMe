import { useState, useEffect } from "react";
import {
  DialogRoot,
  DialogBackdrop,
  DialogPositioner,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
  DialogTitle,
} from "@chakra-ui/react";
import {
  Box,
  Button,
  Flex,
  Input,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import dayjs from "dayjs";
import { EVENT_ICONS } from "./eventIcons";
import { useQuickTemplates } from "../../hooks/useQuickTemplates";
import DateInput from "../common/DateInput";
import DateTimeInput from "../common/DateTimeInput";

const COLOR_OPTIONS = [
  { key: "sky", value: "#339AF0" },
  { key: "yellow", value: "#FAB005" },
  { key: "peach", value: "#F47340" },
  { key: "red", value: "#F03E3E" },
  { key: "green", value: "#40C057" },
  { key: "pink", value: "#F06595" },
  { key: "rose", value: "#E64980" },
  { key: "lavender", value: "#845EF7" },
];

// Colors used by built-in quick-add templates
const BUILTIN_COLORS = ["sky", "yellow", "peach", "lavender", "red", "green", "pink"];

const DURATION_OPTIONS = [
  { value: "", label: "Brak" },
  { value: "30", label: "30 min" },
  { value: "60", label: "1 godz." },
  { value: "90", label: "1,5 godz." },
  { value: "120", label: "2 godz." },
  { value: "180", label: "3 godz." },
  { value: "240", label: "4 godz." },
  { value: "480", label: "8 godz." },
  { value: "720", label: "12 godz." },
  { value: "1440", label: "24 godz." },
];

const RECURRENCE_OPTIONS = [
  { value: "", label: "Nie powtarza si\u0119" },
  { value: "FREQ=DAILY", label: "Codziennie" },
  { value: "FREQ=WEEKLY", label: "Co tydzie\u0144" },
  { value: "FREQ=MONTHLY", label: "Co miesi\u0105c" },
  { value: "FREQ=YEARLY", label: "Co rok" },
];

function toLocalDatetime(isoStr) {
  if (!isoStr) return "";
  return dayjs(isoStr).format("YYYY-MM-DDTHH:mm");
}

function calcDurationMinutes(start, end) {
  if (!start || !end) return "";
  const diff = dayjs(end).diff(dayjs(start), "minute");
  if (diff <= 0) return "";
  const exact = DURATION_OPTIONS.find((o) => o.value === String(diff));
  if (exact) return exact.value;
  return String(diff);
}

export default function EventFormDrawer({
  isOpen,
  onClose,
  event,
  selectedDate,
  onSave,
  onDelete,
  isSaving,
  templateMode = false,
}) {
  const isEdit = !!event;
  const customTemplates = useQuickTemplates((s) => s.templates);

  const [title, setTitle] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [startDatetime, setStartDatetime] = useState("");
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState("60");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("sky");
  const [icon, setIcon] = useState("");
  const [rrule, setRrule] = useState("");

  useEffect(() => {
    if (isEdit && event) {
      setTitle(event.title || "");
      setAllDay(!!event.all_day);
      const start = event.start_at || event.start_datetime || event.start_date;
      const end = event.end_at || event.end_datetime || event.end_date;
      setStartDatetime(toLocalDatetime(start));
      setStartDate(start ? dayjs(start).format("YYYY-MM-DD") : "");
      const dur = calcDurationMinutes(start, end);
      setDuration(dur || "60");
      setDescription(event.description || "");
      setColor(event.color || "sky");
      setIcon(event.icon || "");
      setRrule(event.rrule || "");
    } else {
      setTitle("");
      setAllDay(false);
      const defaultDate = selectedDate || dayjs().format("YYYY-MM-DD");
      setStartDatetime(defaultDate + "T09:00");
      setStartDate(defaultDate);
      setDuration("60");
      setDescription("");
      setIcon("");
      setRrule("");

      // In template mode, auto-pick the first color not used by any template
      if (templateMode) {
        const usedColors = new Set([
          ...BUILTIN_COLORS,
          ...customTemplates.map((t) => t.color),
        ]);
        const freeColor = COLOR_OPTIONS.find((c) => !usedColors.has(c.key));
        setColor(freeColor ? freeColor.key : "sky");
      } else {
        setColor("sky");
      }
    }
  }, [isEdit, event, selectedDate, isOpen, templateMode, customTemplates]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const data = {
      title: title.trim(),
      all_day: allDay,
      description: description.trim() || null,
      color,
      icon: icon || null,
      category: null,
      location: null,
      rrule: rrule || null,
    };

    if (allDay) {
      data.start_at = startDate + "T00:00:00";
      data.end_at = startDate + "T23:59:59";
    } else {
      data.start_at = startDatetime;
      data.end_at = duration && startDatetime
        ? dayjs(startDatetime).add(Number(duration), "minute").format("YYYY-MM-DDTHH:mm")
        : null;
    }

    onSave(data, event?.id);
  };

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
    >
      <DialogBackdrop
        bg="blackAlpha.400"
        backdropFilter="blur(4px)"
      />
      <DialogPositioner
        display="flex"
        alignItems={{ base: "flex-end", md: "center" }}
        justifyContent="center"
        p={{ base: "0", md: "5" }}
      >
        <DialogContent
          borderRadius={{ base: "2xl 2xl 0 0", md: "2xl" }}
          maxW="400px"
          w="full"
          maxH={{ base: "90dvh", md: "85vh" }}
          overflow="hidden"
          display="flex"
          flexDirection="column"
          shadow="0 20px 60px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.04)"
          bg="white"
        >
          {/* Decorative top accent */}
          <Box
            h="3px"
            bgGradient="to-r"
            gradientFrom="rose.300"
            gradientVia="pink.300"
            gradientTo="rose.400"
            borderTopRadius="2xl"
          />

          {/* Recurring event warning */}
          {isEdit && event?.rrule && (
            <Flex
              align="center"
              gap="2"
              px="5"
              py="2"
              bg="yellow.50"
              borderBottom="1px solid"
              borderColor="yellow.100"
            >
              <Text fontSize="sm" lineHeight="1">
                {"🔁"}
              </Text>
              <Text fontSize="xs" color="yellow.700" fontWeight="500">
                {"To wydarzenie si\u0119 powtarza. Zmiany zostan\u0105 zastosowane do wszystkich wyst\u0105pie\u0144."}
              </Text>
            </Flex>
          )}

          <DialogHeader py="3" px="5">
            <Flex align="center" justify="space-between" w="full">
              <DialogTitle>
                <Text fontSize="md" fontWeight="700" color="textPrimary">
                  {templateMode ? "Nowy szablon" : isEdit ? "Edytuj wydarzenie" : "Nowe wydarzenie"}
                </Text>
              </DialogTitle>
              <DialogCloseTrigger asChild>
                <Box
                  as="button"
                  aria-label="Zamknij"
                  w="32px"
                  h="32px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  borderRadius="full"
                  color="gray.400"
                  bg="gray.50"
                  _hover={{ color: "gray.600", bg: "gray.100" }}
                  transition="all 0.15s"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Box>
              </DialogCloseTrigger>
            </Flex>
          </DialogHeader>

          <DialogBody py="2" px="5" as="form" id="event-form" onSubmit={handleSubmit} overflowY="auto" flex="1" css={{ WebkitOverflowScrolling: "touch", "&::-webkit-scrollbar": { display: "none" }, scrollbarWidth: "none" }}>
            <VStack gap="4" align="stretch">
              {/* Title */}
              <Box>
                <Text fontSize="xs" fontWeight="600" color="gray.500" mb="1.5" textTransform="uppercase" letterSpacing="0.5px">
                  {"Tytu\u0142 *"}
                </Text>
                <Input
                  placeholder="Nazwa wydarzenia"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  borderRadius="xl"
                  size="sm"
                  bg="gray.50"
                  borderColor="gray.200"
                  _hover={{ borderColor: "gray.300" }}
                  _focus={{
                    borderColor: "rose.300",
                    bg: "white",
                    boxShadow: "0 0 0 1px var(--chakra-colors-rose-300)",
                  }}
                  required
                />
              </Box>

              {/* All-day toggle */}
              <Flex
                align="center"
                justify="space-between"
                px="3"
                py="2"
                bg="gray.50"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="gray.200"
                cursor="pointer"
                onClick={() => {
                  setAllDay((v) => !v);
                  if (!allDay && startDatetime) {
                    setStartDate(dayjs(startDatetime).format("YYYY-MM-DD"));
                  } else if (allDay && startDate) {
                    setStartDatetime(startDate + "T09:00");
                  }
                }}
                _hover={{ borderColor: "gray.300" }}
                transition="all 0.15s"
              >
                <Text fontSize="sm" fontWeight="500" color="gray.600">
                  {"Ca\u0142y dzie\u0144"}
                </Text>
                <Box
                  w="36px"
                  h="20px"
                  borderRadius="full"
                  bg={allDay ? "rose.400" : "gray.300"}
                  position="relative"
                  transition="background 0.2s"
                >
                  <Box
                    position="absolute"
                    top="2px"
                    left={allDay ? "18px" : "2px"}
                    w="16px"
                    h="16px"
                    borderRadius="full"
                    bg="white"
                    shadow="0 1px 3px rgba(0,0,0,0.2)"
                    transition="left 0.2s"
                  />
                </Box>
              </Flex>

              {/* Date / DateTime input */}
              <Box>
                {allDay ? (
                  <DateInput
                    value={startDate}
                    onChange={setStartDate}
                    accentColor="sky"
                    label="Data"
                    required
                  />
                ) : (
                  <DateTimeInput
                    value={startDatetime}
                    onChange={setStartDatetime}
                    accentColor="sky"
                    label={"Data i godzina"}
                    required
                  />
                )}
              </Box>

              {/* Duration + Recurrence row */}
              <Flex gap="3">
                {/* Duration — hidden for all-day events */}
                <Box flex="1" display={allDay ? "none" : "block"}>
                  <Text fontSize="xs" fontWeight="600" color="gray.500" mb="1.5" textTransform="uppercase" letterSpacing="0.5px">
                    Czas trwania
                  </Text>
                  <Box
                    as="select"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    w="full"
                    px="3"
                    py="1.5"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="gray.200"
                    fontSize="sm"
                    bg="gray.50"
                    _hover={{ borderColor: "gray.300" }}
                    _focus={{
                      borderColor: "rose.300",
                      bg: "white",
                      outline: "none",
                      boxShadow: "0 0 0 1px var(--chakra-colors-rose-300)",
                    }}
                  >
                    {DURATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Box>
                </Box>

                {/* Recurrence */}
                <Box flex="1">
                  <Text fontSize="xs" fontWeight="600" color="gray.500" mb="1.5" textTransform="uppercase" letterSpacing="0.5px">
                    Powtarzanie
                  </Text>
                  <Box
                    as="select"
                    value={rrule}
                    onChange={(e) => setRrule(e.target.value)}
                    w="full"
                    px="3"
                    py="1.5"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="gray.200"
                    fontSize="sm"
                    bg="gray.50"
                    _hover={{ borderColor: "gray.300" }}
                    _focus={{
                      borderColor: "rose.300",
                      bg: "white",
                      outline: "none",
                      boxShadow: "0 0 0 1px var(--chakra-colors-rose-300)",
                    }}
                  >
                    {RECURRENCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Box>
                </Box>
              </Flex>

              {/* Description */}
              <Box>
                <Text fontSize="xs" fontWeight="600" color="gray.500" mb="1.5" textTransform="uppercase" letterSpacing="0.5px">
                  Opis
                </Text>
                <Textarea
                  placeholder={"Dodaj opis…"}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  borderRadius="xl"
                  rows={2}
                  resize="none"
                  size="sm"
                  bg="gray.50"
                  borderColor="gray.200"
                  _hover={{ borderColor: "gray.300" }}
                  _focus={{
                    borderColor: "rose.300",
                    bg: "white",
                    boxShadow: "0 0 0 1px var(--chakra-colors-rose-300)",
                  }}
                />
              </Box>

              {/* Icon + Color row */}
              <Flex gap="4">
                {/* Icon */}
                <Box flex="1">
                  <Text fontSize="xs" fontWeight="600" color="gray.500" mb="2" textTransform="uppercase" letterSpacing="0.5px">
                    Ikonka
                  </Text>
                  <Flex gap="1" flexWrap="wrap">
                    <Box
                      as="button"
                      type="button"
                      w="32px"
                      h="32px"
                      borderRadius="lg"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      bg={!icon ? "gray.200" : "gray.50"}
                      border="2px solid"
                      borderColor={!icon ? "gray.400" : "transparent"}
                      _hover={{ bg: "gray.100" }}
                      transition="all 0.15s"
                      onClick={() => setIcon("")}
                      cursor="pointer"
                      fontSize="11px"
                      color="gray.400"
                    >
                      {"—"}
                    </Box>
                    {EVENT_ICONS.map((ic) => (
                      <Box
                        key={ic.key}
                        as="button"
                        type="button"
                        w="32px"
                        h="32px"
                        borderRadius="lg"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        bg={icon === ic.key ? "rose.50" : "gray.50"}
                        border="2px solid"
                        borderColor={icon === ic.key ? "rose.300" : "transparent"}
                        _hover={{ transform: "scale(1.1)", bg: "rose.50" }}
                        transition="all 0.15s"
                        onClick={() => setIcon(ic.key)}
                        cursor="pointer"
                        fontSize="16px"
                        title={ic.label}
                      >
                        {ic.emoji}
                      </Box>
                    ))}
                  </Flex>
                </Box>
              </Flex>

              {/* Color */}
              <Box>
                <Text fontSize="xs" fontWeight="600" color="gray.500" mb="2" textTransform="uppercase" letterSpacing="0.5px">
                  Kolor
                </Text>
                <Flex gap="2" justify="center">
                  {COLOR_OPTIONS.map((c) => (
                    <Box
                      key={c.key}
                      as="button"
                      type="button"
                      w="30px"
                      h="30px"
                      borderRadius="full"
                      bg={c.value}
                      border="3px solid"
                      borderColor={color === c.key ? "textPrimary" : "transparent"}
                      _hover={{ transform: "scale(1.15)" }}
                      transition="all 0.15s"
                      onClick={() => setColor(c.key)}
                      cursor="pointer"
                      shadow={color === c.key ? "0 2px 8px rgba(0,0,0,0.2)" : "0 1px 3px rgba(0,0,0,0.1)"}
                    />
                  ))}
                </Flex>
              </Box>
            </VStack>
          </DialogBody>

          <DialogFooter px="5" py="4" borderTopWidth="1px" borderColor="gray.100" flexShrink={0} pb={{ base: "calc(16px + env(safe-area-inset-bottom, 0px))", md: "4" }}>
            <VStack w="full" gap="2">
              <Button
                type="submit"
                form="event-form"
                w="full"
                bg="rose.400"
                color="white"
                _hover={{ bg: "rose.500" }}
                borderRadius="xl"
                size="md"
                fontWeight="600"
                shadow="0 4px 14px 0 rgba(231, 73, 128, 0.25)"
                loading={isSaving}
              >
                {templateMode ? "Zapisz szablon" : isEdit ? "Zapisz zmiany" : "Dodaj wydarzenie"}
              </Button>

              {isEdit && (
                <Button
                  w="full"
                  variant="ghost"
                  color="red.400"
                  _hover={{ bg: "red.50", color: "red.500" }}
                  borderRadius="xl"
                  size="sm"
                  onClick={() => onDelete(event.id)}
                >
                  {"Usu\u0144 wydarzenie"}
                </Button>
              )}
            </VStack>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
