import { useState, useEffect } from "react";
import { Box, Flex, Text, Input, Heading, VStack } from "@chakra-ui/react";
import BottomSheetDialog, { DialogActions } from "../common/BottomSheetDialog";
import { EVENT_ICONS, getIconEmoji } from "./eventIcons";
import { MAX_TEMPLATES, DEFAULT_TEMPLATES } from "../../hooks/useQuickTemplates";

const EVENT_COLORS = [
  { value: "sky", label: "Niebieski", hex: "#7DD3FC" },
  { value: "peach", label: "Brzoskwinia", hex: "#FDBA74" },
  { value: "lavender", label: "Fiolet", hex: "#C4B5FD" },
  { value: "pink", label: "Róż", hex: "#F9A8D4" },
  { value: "green", label: "Zieleń", hex: "#86EFAC" },
  { value: "yellow", label: "Żółty", hex: "#FDE68A" },
  { value: "red", label: "Czerwony", hex: "#FCA5A5" },
  { value: "sage", label: "Szałwia", hex: "#A7C4A0" },
];

export default function QuickAddEditor({ open, onClose, templates, onSave }) {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (open) {
      setItems(templates.map((t) => ({ ...t })));
      setEditingId(null);
    }
  }, [open, templates]);

  const editingItem = editingId ? items.find((t) => t.id === editingId) : null;

  const handleFieldChange = (id, field, value) => {
    setItems((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, [field]: value };
        if (field === "label") updated.title = value;
        if (field === "title") updated.label = value;
        return updated;
      })
    );
  };

  const handleMoveUp = (id) => {
    setItems((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const handleMoveDown = (id) => {
    setItems((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const handleDelete = (id) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleAddNew = () => {
    if (items.length >= MAX_TEMPLATES) return;
    const newItem = {
      id: Date.now().toString(36),
      label: "",
      title: "",
      icon: "clipboard",
      color: "sky",
      startH: "09:00",
      endH: "10:00",
      allDay: false,
    };
    setItems((prev) => [...prev, newItem]);
    setEditingId(newItem.id);
  };

  const handleReset = () => {
    setItems(DEFAULT_TEMPLATES.map((t) => ({ ...t })));
    setEditingId(null);
  };

  const handleSave = () => {
    // Filter out items without a title
    const valid = items.filter((t) => t.title && t.title.trim());
    onSave(valid);
  };

  const canSave = items.some((t) => t.title && t.title.trim());

  return (
    <BottomSheetDialog open={open} onClose={onClose} maxW="440px">
      <Box p={6} pb={0}>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md" color="sky.600" fontFamily="'Nunito', sans-serif">
            {"Edytuj szablony"}
          </Heading>
          <Text
            as="button"
            type="button"
            fontSize="xs"
            color="gray.400"
            fontWeight="500"
            _hover={{ color: "gray.600" }}
            onClick={handleReset}
          >
            {"Przywróć domyślne"}
          </Text>
        </Flex>

        {/* Template list */}
        <VStack gap={0} align="stretch" mb={3}>
          {items.map((tpl, idx) => {
            const emoji = getIconEmoji(tpl.icon);
            const isEditing = editingId === tpl.id;

            return (
              <Box key={tpl.id}>
                {/* Row */}
                <Flex
                  align="center"
                  gap={2}
                  py={2.5}
                  px={2}
                  borderRadius="xl"
                  bg={isEditing ? "sky.50" : "transparent"}
                  _hover={{ bg: isEditing ? "sky.50" : "gray.50" }}
                  transition="background 0.15s"
                  cursor="pointer"
                  onClick={() => setEditingId(isEditing ? null : tpl.id)}
                >
                  {/* Reorder arrows */}
                  <Flex direction="column" gap={0} flexShrink={0}>
                    <Box
                      as="button"
                      type="button"
                      color={idx === 0 ? "gray.200" : "gray.400"}
                      _hover={idx === 0 ? {} : { color: "sky.500" }}
                      transition="color 0.15s"
                      lineHeight="1"
                      onClick={(e) => { e.stopPropagation(); handleMoveUp(tpl.id); }}
                      disabled={idx === 0}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </Box>
                    <Box
                      as="button"
                      type="button"
                      color={idx === items.length - 1 ? "gray.200" : "gray.400"}
                      _hover={idx === items.length - 1 ? {} : { color: "sky.500" }}
                      transition="color 0.15s"
                      lineHeight="1"
                      onClick={(e) => { e.stopPropagation(); handleMoveDown(tpl.id); }}
                      disabled={idx === items.length - 1}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </Box>
                  </Flex>

                  {/* Emoji */}
                  <Text fontSize="lg" lineHeight="1" flexShrink={0}>{emoji || "📋"}</Text>

                  {/* Label */}
                  <Text
                    fontSize="sm"
                    fontWeight="600"
                    color="gray.700"
                    flex={1}
                    isTruncated
                  >
                    {tpl.label || "Bez nazwy"}
                  </Text>

                  {/* Expand indicator */}
                  <Box
                    color="gray.300"
                    transition="transform 0.2s"
                    transform={isEditing ? "rotate(180deg)" : "rotate(0)"}
                    flexShrink={0}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </Box>
                </Flex>

                {/* Expanded editor */}
                {isEditing && (
                  <Box px={2} pb={3} className="sm-expand-in">
                    {/* Name */}
                    <Text fontSize="xs" fontWeight="600" color="gray.500" mb={1} mt={1}>{"Nazwa"}</Text>
                    <Input
                      size="sm"
                      value={tpl.label || ""}
                      onChange={(e) => handleFieldChange(tpl.id, "label", e.target.value)}
                      placeholder={"np. Szpital"}
                      borderColor="sky.200"
                      borderRadius="lg"
                      _focus={{ borderColor: "sky.400", boxShadow: "0 0 0 1px var(--chakra-colors-sky-400)" }}
                      maxLength={30}
                      autoFocus
                      mb={2}
                    />

                    {/* Icon picker */}
                    <Text fontSize="xs" fontWeight="600" color="gray.500" mb={1}>{"Ikona"}</Text>
                    <Flex gap={1.5} flexWrap="wrap" mb={2}>
                      {EVENT_ICONS.map((ic) => (
                        <Box
                          key={ic.key}
                          as="button"
                          type="button"
                          w="36px"
                          h="36px"
                          borderRadius="lg"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          fontSize="lg"
                          bg={tpl.icon === ic.key ? "sky.100" : "gray.50"}
                          borderWidth="1.5px"
                          borderColor={tpl.icon === ic.key ? "sky.400" : "transparent"}
                          _hover={{ bg: tpl.icon === ic.key ? "sky.100" : "gray.100" }}
                          transition="all 0.15s"
                          onClick={(e) => { e.stopPropagation(); handleFieldChange(tpl.id, "icon", ic.key); }}
                        >
                          {ic.emoji}
                        </Box>
                      ))}
                    </Flex>

                    {/* Color picker */}
                    <Text fontSize="xs" fontWeight="600" color="gray.500" mb={1}>{"Kolor"}</Text>
                    <Flex gap={1.5} flexWrap="wrap" mb={3}>
                      {EVENT_COLORS.map((c) => (
                        <Box
                          key={c.value}
                          as="button"
                          type="button"
                          w="28px"
                          h="28px"
                          borderRadius="full"
                          bg={c.hex}
                          borderWidth="2.5px"
                          borderColor={tpl.color === c.value ? "gray.700" : "transparent"}
                          _hover={{ transform: "scale(1.15)" }}
                          transition="all 0.15s"
                          onClick={(e) => { e.stopPropagation(); handleFieldChange(tpl.id, "color", c.value); }}
                        />
                      ))}
                    </Flex>

                    {/* Delete */}
                    <Text
                      as="button"
                      type="button"
                      fontSize="xs"
                      color="red.400"
                      fontWeight="500"
                      _hover={{ color: "red.600" }}
                      onClick={(e) => { e.stopPropagation(); handleDelete(tpl.id); }}
                    >
                      {"Usuń szablon"}
                    </Text>
                  </Box>
                )}

                {/* Divider */}
                {idx < items.length - 1 && (
                  <Box h="1px" bg="gray.100" mx={2} />
                )}
              </Box>
            );
          })}
        </VStack>

        {/* Add new */}
        {items.length < MAX_TEMPLATES && (
          <Box
            as="button"
            type="button"
            w="full"
            py={2.5}
            textAlign="center"
            fontSize="sm"
            fontWeight="600"
            color="sky.500"
            _hover={{ color: "sky.600", bg: "sky.50" }}
            borderRadius="xl"
            transition="all 0.15s"
            onClick={handleAddNew}
            mb={1}
          >
            {"+ Dodaj nowy szablon"}
          </Box>
        )}

        <Text fontSize="2xs" color="gray.400" textAlign="center" mb={1}>
          {`${items.length}/${MAX_TEMPLATES} szablonów`}
        </Text>
      </Box>

      <DialogActions>
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
            {"Anuluj"}
          </Text>
          <Text
            as="button"
            type="button"
            bg="sky.400"
            color="white"
            fontWeight="600"
            px={5}
            py={2}
            borderRadius="xl"
            cursor="pointer"
            opacity={canSave ? 1 : 0.5}
            _hover={{ bg: "sky.500" }}
            onClick={handleSave}
          >
            {"Zapisz"}
          </Text>
        </Flex>
      </DialogActions>
    </BottomSheetDialog>
  );
}
