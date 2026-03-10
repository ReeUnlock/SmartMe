import { useState } from "react";
import { Flex, Text, Icon, Box, Input } from "@chakra-ui/react";
import { LuTrash2, LuCheck, LuX, LuChevronUp, LuChevronDown } from "react-icons/lu";
import { parseItemInput } from "../../utils/shoppingUtils";

export default function ShoppingItemRow({
  item,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onToggle,
  onDelete,
  reorderMode,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
}) {
  const [editValue, setEditValue] = useState("");

  const startEdit = () => {
    if (item.is_checked || !onStartEdit) return;
    const display = item.quantity
      ? `${item.quantity}${item.unit ? " " + item.unit : ""} ${item.name}`
      : item.name;
    setEditValue(display);
    onStartEdit();
  };

  const saveEdit = () => {
    if (!editValue.trim()) {
      onCancelEdit?.();
      return;
    }
    const parsed = parseItemInput(editValue.trim());
    onSaveEdit?.(parsed);
  };

  const handleEditKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      onCancelEdit?.();
    }
  };

  // Edit mode
  if (isEditing) {
    return (
      <Flex
        align="center"
        gap={2}
        px={2}
        py={1.5}
        bg="sage.50"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="sage.300"
      >
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleEditKeyDown}
          size="sm"
          flex={1}
          minW={0}
          borderColor="sage.300"
          borderRadius="md"
          bg="white"
          autoFocus
          _focus={{ borderColor: "sage.400", boxShadow: "0 0 0 1px var(--chakra-colors-sage-400)" }}
        />
        <Icon
          as={LuCheck}
          boxSize={4}
          color="sage.500"
          cursor="pointer"
          flexShrink={0}
          _hover={{ color: "sage.700" }}
          onClick={saveEdit}
        />
        <Icon
          as={LuX}
          boxSize={4}
          color="gray.400"
          cursor="pointer"
          flexShrink={0}
          _hover={{ color: "gray.600" }}
          onClick={onCancelEdit}
        />
      </Flex>
    );
  }

  return (
    <Flex
      align="center"
      gap={2}
      px={2}
      py={2}
      bg={item.is_checked ? "gray.50" : "white"}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={item.is_checked ? "gray.100" : "sage.100"}
      opacity={item.is_checked ? 0.7 : 1}
      _hover={{ shadow: "sm" }}
      transition="all 0.15s"
    >
      {/* Checkbox */}
      <Box
        as="button"
        type="button"
        onClick={onToggle}
        w={4.5}
        h={4.5}
        borderRadius="sm"
        borderWidth="2px"
        borderColor={item.is_checked ? "sage.400" : "gray.300"}
        bg={item.is_checked ? "sage.400" : "transparent"}
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
        cursor="pointer"
        transition="all 0.15s"
        _hover={{ borderColor: "sage.500" }}
      >
        {item.is_checked && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </Box>

      {/* Item info — click to edit */}
      <Box
        flex={1}
        minW={0}
        cursor={item.is_checked ? "default" : "pointer"}
        onClick={startEdit}
      >
        <Text
          fontSize="sm"
          fontWeight="500"
          textDecoration={item.is_checked ? "line-through" : "none"}
          color={item.is_checked ? "gray.400" : "textPrimary"}
          truncate
        >
          {item.name}
          {(item.quantity || item.unit) && (
            <Text as="span" fontSize="xs" color="gray.400" ml={1}>
              {item.quantity}{item.unit ? ` ${item.unit}` : ""}
            </Text>
          )}
        </Text>
      </Box>

      {/* Reorder buttons */}
      {reorderMode && !item.is_checked && (
        <Flex direction="column" gap={0} flexShrink={0}>
          <Icon
            as={LuChevronUp}
            boxSize={4}
            color={isFirst ? "gray.200" : "sage.400"}
            cursor={isFirst ? "default" : "pointer"}
            _hover={isFirst ? {} : { color: "sage.600" }}
            onClick={(e) => { e.stopPropagation(); if (!isFirst) onMoveUp?.(); }}
          />
          <Icon
            as={LuChevronDown}
            boxSize={4}
            color={isLast ? "gray.200" : "sage.400"}
            cursor={isLast ? "default" : "pointer"}
            _hover={isLast ? {} : { color: "sage.600" }}
            onClick={(e) => { e.stopPropagation(); if (!isLast) onMoveDown?.(); }}
          />
        </Flex>
      )}

      {/* Delete */}
      {!reorderMode && (
        <Icon
          as={LuTrash2}
          boxSize={3.5}
          color="gray.300"
          cursor="pointer"
          flexShrink={0}
          _hover={{ color: "red.400" }}
          transition="color 0.15s"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        />
      )}
    </Flex>
  );
}

