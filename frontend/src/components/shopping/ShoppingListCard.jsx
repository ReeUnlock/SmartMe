import { Box, Flex, Text, Icon } from "@chakra-ui/react";
import { LuTrash2, LuCheck, LuShoppingCart } from "react-icons/lu";

export default function ShoppingListCard({ list, onClick, onDelete }) {
  const total = list.items?.length || 0;
  const checked = list.items?.filter((i) => i.is_checked).length || 0;
  const allDone = total > 0 && checked === total;

  return (
    <Flex
      bg="white"
      borderRadius="xl"
      borderWidth="1px"
      borderColor={allDone ? "sage.200" : "gray.100"}
      shadow="0 1px 4px 0 rgba(0,0,0,0.04)"
      p={4}
      align="center"
      gap={3}
      cursor="pointer"
      _hover={{ shadow: "0 2px 12px 0 rgba(32,201,151,0.10)", borderColor: "sage.300" }}
      _active={{ transform: "scale(0.99)" }}
      transition="all 0.2s"
      onClick={onClick}
      opacity={list.is_completed ? 0.6 : 1}
    >
      <Flex
        align="center"
        justify="center"
        w={10}
        h={10}
        borderRadius="lg"
        bg={allDone ? "sage.100" : "sage.50"}
      >
        <Icon
          as={allDone ? LuCheck : LuShoppingCart}
          boxSize={5}
          color={allDone ? "sage.600" : "sage.400"}
        />
      </Flex>

      <Box flex={1} minW={0}>
        <Text fontWeight="600" fontSize="md" truncate>
          {list.name}
        </Text>
        <Text fontSize="xs" color="gray.400">
          {total === 0
            ? "Pusta lista"
            : `${checked} / ${total} produktów`}
        </Text>
      </Box>

      <Icon
        as={LuTrash2}
        boxSize={4}
        color="gray.300"
        cursor="pointer"
        _hover={{ color: "red.400" }}
        transition="color 0.2s"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      />
    </Flex>
  );
}
