import { useState } from "react";
import { Box, Flex, Heading, Text, Icon, VStack, Spinner } from "@chakra-ui/react";
import { LuPlus, LuShoppingCart } from "react-icons/lu";
import { useShoppingLists, useCreateList, useDeleteList } from "../../hooks/useShopping";
import ShoppingListCard from "./ShoppingListCard";
import ShoppingListDetail from "./ShoppingListDetail";
import NewListDialog from "./NewListDialog";

export default function ShoppingPage() {
  const { data: lists, isLoading } = useShoppingLists();
  const createList = useCreateList();
  const deleteList = useDeleteList();
  const [selectedListId, setSelectedListId] = useState(null);
  const [showNewDialog, setShowNewDialog] = useState(false);

  const handleCreate = async (name) => {
    const newList = await createList.mutateAsync({ name });
    setShowNewDialog(false);
    setSelectedListId(newList.id);
  };

  const handleDelete = async (id) => {
    await deleteList.mutateAsync(id);
    if (selectedListId === id) setSelectedListId(null);
  };

  if (selectedListId) {
    return (
      <ShoppingListDetail
        listId={selectedListId}
        onBack={() => setSelectedListId(null)}
      />
    );
  }

  return (
    <Box px={{ base: 0, md: 6 }} py={{ base: 0, md: 4 }} maxW="600px" mx="auto" w="100%" overflow="hidden">
      <Flex align="center" justify="space-between" mb={5}>
        <Heading size={{ base: "lg", md: "xl" }} color="sage.700" fontFamily="'Nunito', sans-serif">
          Zakupy
        </Heading>
        <Flex
          align="center"
          gap={2}
          px={3}
          py={2}
          bg="sage.500"
          color="white"
          borderRadius="xl"
          cursor="pointer"
          fontWeight="600"
          fontSize="sm"
          _hover={{ bg: "sage.600" }}
          _active={{ transform: "scale(0.97)" }}
          transition="all 0.2s"
          onClick={() => setShowNewDialog(true)}
        >
          <Icon as={LuPlus} boxSize={4} />
          <Text>Nowa lista</Text>
        </Flex>
      </Flex>

      {isLoading ? (
        <Flex justify="center" py={12}>
          <Spinner color="sage.500" size="lg" />
        </Flex>
      ) : !lists?.length ? (
        <VStack py={16} gap={3} color="gray.400">
          <Icon as={LuShoppingCart} boxSize={16} strokeWidth={1} />
          <Text fontSize="lg" fontWeight="600">Brak list zakupów</Text>
          <Text fontSize="sm">Utwórz pierwszą listę, klikając „Nowa lista"</Text>
        </VStack>
      ) : (
        <VStack gap={3} align="stretch">
          {lists.map((list) => (
            <ShoppingListCard
              key={list.id}
              list={list}
              onClick={() => setSelectedListId(list.id)}
              onDelete={() => handleDelete(list.id)}
            />
          ))}
        </VStack>
      )}

      <NewListDialog
        open={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        onSubmit={handleCreate}
        isLoading={createList.isPending}
      />
    </Box>
  );
}
