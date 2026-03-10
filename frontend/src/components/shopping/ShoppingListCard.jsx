import { useState } from "react";
import { Box, Flex, Text, Icon } from "@chakra-ui/react";
import { LuTrash2, LuCheck, LuShoppingCart } from "react-icons/lu";

export default function ShoppingListCard({ list, onClick, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const total = list.items?.length || 0;
  const checked = list.items?.filter((i) => i.is_checked).length || 0;
  const allDone = total > 0 && checked === total;
  const progress = total > 0 ? (checked / total) * 100 : 0;
  const unchecked = total - checked;

  return (
    <Flex
      direction="column"
      bg="white"
      borderRadius="2xl"
      borderWidth="1px"
      borderColor={allDone ? "sage.200" : "gray.100"}
      shadow="0 1px 4px 0 rgba(0,0,0,0.04)"
      overflow="hidden"
      cursor="pointer"
      _hover={{ shadow: "0 2px 12px 0 rgba(32,201,151,0.10)", borderColor: "sage.300" }}
      _active={{ transform: "scale(0.99)" }}
      transition="all 0.2s"
      onClick={onClick}
      opacity={list.is_completed ? 0.6 : 1}
    >
      <Flex p={4} align="center" gap={3}>
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
          <Flex align="center" gap={1.5}>
            <Text fontWeight="600" fontSize="md" truncate>
              {list.name}
            </Text>
            {list.store_name && (
              <Text fontSize="2xs" color="sage.400" fontWeight="500" flexShrink={0}>
                {list.store_name}
              </Text>
            )}
          </Flex>
          <Text fontSize="xs" color="gray.400">
            {total === 0
              ? "Pusta lista"
              : allDone
                ? "Wszystko kupione!"
                : `${unchecked} do kupienia`}
          </Text>
        </Box>

        {/* Delete button / confirm */}
        {confirmDelete ? (
          <Flex
            align="center"
            gap={1}
            onClick={(e) => e.stopPropagation()}
          >
            <Text
              as="button"
              fontSize="xs"
              fontWeight="600"
              color="red.500"
              px={2}
              py={1}
              borderRadius="md"
              bg="red.50"
              _hover={{ bg: "red.100" }}
              transition="all 0.15s"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              {"Usu\u0144"}
            </Text>
            <Text
              as="button"
              fontSize="xs"
              color="gray.500"
              px={2}
              py={1}
              _hover={{ color: "textSecondary" }}
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete(false);
              }}
            >
              Nie
            </Text>
          </Flex>
        ) : (
          <Icon
            as={LuTrash2}
            boxSize={4}
            color="gray.300"
            cursor="pointer"
            _hover={{ color: "red.400" }}
            transition="color 0.2s"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete(true);
            }}
          />
        )}
      </Flex>

      {/* Progress bar */}
      {total > 0 && (
        <Box h="3px" bg="gray.100">
          <Box
            h="full"
            bg={allDone ? "sage.400" : "sage.300"}
            w={`${progress}%`}
            transition="width 0.3s ease"
            borderRadius="full"
          />
        </Box>
      )}
    </Flex>
  );
}
