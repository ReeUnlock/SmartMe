import { Flex, Text, Icon, Box } from "@chakra-ui/react";
import { LuTrash2 } from "react-icons/lu";

export default function ShoppingItemRow({ item, onToggle, onDelete }) {
  return (
    <Flex
      align="center"
      gap={2}
      px={2}
      py={2}
      bg="white"
      borderRadius="lg"
      borderWidth="1px"
      borderColor={item.is_checked ? "gray.100" : "sage.100"}
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

      {/* Item info */}
      <Box flex={1} minW={0}>
        <Text
          fontSize="sm"
          fontWeight="500"
          textDecoration={item.is_checked ? "line-through" : "none"}
          color={item.is_checked ? "gray.400" : "gray.700"}
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

      {/* Delete */}
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
    </Flex>
  );
}
