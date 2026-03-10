import { Box, Flex, Text, Icon } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { LuShoppingCart, LuChevronRight, LuCheck } from "react-icons/lu";
import { useShoppingLists } from "../../hooks/useShopping";

function ListRow({ list }) {
  const items = list.items || [];
  const checked = items.filter((i) => i.is_checked).length;
  const total = items.length;
  const progress = total > 0 ? Math.round((checked / total) * 100) : 0;

  return (
    <Box py={2} px={1} _notLast={{ borderBottomWidth: "1px", borderColor: "gray.50" }}>
      <Flex align="center" justify="space-between" mb={1.5}>
        <Text
          fontSize="sm"
          fontWeight="600"
          color="textPrimary"
          lineHeight="1.3"
          noOfLines={1}
          flex="1"
          minW={0}
        >
          {list.name}
        </Text>
        <Flex align="center" gap={1} ml={2} flexShrink={0}>
          <Text fontSize="2xs" fontWeight="600" color="gray.400">
            {`${checked} / ${total}`}
          </Text>
          {checked === total && total > 0 && (
            <Icon as={LuCheck} boxSize="12px" color="sage.500" />
          )}
        </Flex>
      </Flex>

      {/* Progress bar */}
      <Box h="6px" bg="sage.50" borderRadius="full" overflow="hidden">
        <Box
          h="100%"
          w={`${progress}%`}
          bg="sage.400"
          borderRadius="full"
          transition="width 0.3s ease"
        />
      </Box>

      {/* Store name if present */}
      {list.store_name && (
        <Text fontSize="2xs" color="gray.400" fontWeight="500" mt={1}>
          {list.store_name}
        </Text>
      )}
    </Box>
  );
}

export default function ShoppingWidget() {
  const navigate = useNavigate();
  const { data: lists, isLoading } = useShoppingLists();

  // Active lists = not completed, with unchecked items
  const activeLists = (lists || [])
    .filter((l) => {
      if (l.is_completed) return false;
      const items = l.items || [];
      return items.length > 0 && items.some((i) => !i.is_checked);
    })
    .slice(0, 2);

  const totalActive = (lists || []).filter((l) => !l.is_completed).length;

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      shadow="0 1px 8px 0 rgba(0,0,0,0.04)"
      borderWidth="1px"
      borderColor="gray.100"
      overflow="hidden"
      cursor="pointer"
      transition="all 0.2s"
      _hover={{
        shadow: "0 2px 12px 0 rgba(32,201,151,0.08)",
        borderColor: "sage.200",
      }}
      onClick={() => navigate("/zakupy")}
    >
      {/* Header */}
      <Flex align="center" justify="space-between" px={4} pt={3.5} pb={2}>
        <Flex align="center" gap={2}>
          <Flex
            align="center"
            justify="center"
            w="28px"
            h="28px"
            borderRadius="lg"
            bg="sage.50"
          >
            <Icon as={LuShoppingCart} boxSize="14px" color="sage.500" strokeWidth="2.5" />
          </Flex>
          <Text fontSize="sm" fontWeight="700" color="textSecondary">
            {"Zakupy"}
          </Text>
        </Flex>
        <Flex align="center" gap={1}>
          {totalActive > 0 && (
            <Flex
              align="center"
              gap={1}
              px={2}
              py={0.5}
              bg="sage.50"
              borderRadius="full"
            >
              <Text fontSize="2xs" fontWeight="600" color="sage.600">
                {`${totalActive} ${totalActive === 1 ? "lista" : "listy"}`}
              </Text>
            </Flex>
          )}
          <Icon as={LuChevronRight} boxSize="14px" color="gray.300" />
        </Flex>
      </Flex>

      {/* Content */}
      <Box px={3.5} pb={3}>
        {isLoading ? (
          <Text fontSize="sm" color="gray.400" fontWeight="500" py={2} px={0.5}>
            {"Ładowanie..."}
          </Text>
        ) : activeLists.length === 0 ? (
          <Box py={2} px={0.5}>
            <Text fontSize="sm" color="gray.400" fontWeight="500" lineHeight="1.5">
              {"Wszystko kupione — lista pusta"}
            </Text>
          </Box>
        ) : (
          activeLists.map((list) => <ListRow key={list.id} list={list} />)
        )}
      </Box>
    </Box>
  );
}
