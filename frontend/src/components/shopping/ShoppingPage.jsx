import { useState } from "react";
import { Box, Flex, Heading, Text, Icon, VStack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { LuPlus, LuShoppingCart } from "react-icons/lu";
import SmartMeLoader from "../common/SmartMeLoader";
import EmptyState from "../common/EmptyState";
import { useShoppingLists, useCreateList, useDeleteList, useAddItem } from "../../hooks/useShopping";
import { getSubscription } from "../../api/billing";
import ShoppingListCard from "./ShoppingListCard";
import ShoppingListDetail from "./ShoppingListDetail";
import NewListDialog from "./NewListDialog";

export default function ShoppingPage() {
  const { data: lists, isLoading } = useShoppingLists();
  const createList = useCreateList();
  const deleteList = useDeleteList();
  const addItemMut = useAddItem();
  const [selectedListId, setSelectedListId] = useState(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const { data: sub } = useQuery({
    queryKey: ["billing", "subscription"],
    queryFn: getSubscription,
    staleTime: 60_000,
  });
  const isFree = !sub || sub.plan === "free";
  const activeLists = lists?.filter((l) => !l.is_completed)?.length || 0;

  const handleCreate = async (name, storeName = null, templateItems = null) => {
    try {
      const newList = await createList.mutateAsync({ name, store_name: storeName });
      // If created from a template, add all template items
      if (templateItems?.length) {
        for (const item of templateItems) {
          await addItemMut.mutateAsync({
            listId: newList.id,
            data: {
              name: item.name,
              quantity: item.quantity || null,
              unit: item.unit || null,
              category_id: item.category_id || null,
            },
          });
        }
      }
      setShowNewDialog(false);
      setSelectedListId(newList.id);
    } catch {
      // mutation error handled by TanStack Query
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteList.mutateAsync(id);
      if (selectedListId === id) setSelectedListId(null);
    } catch {
      // mutation error handled by TanStack Query
    }
  };

  const groupedLists = (() => {
    if (!lists?.length) return [];

    const groups = {};
    [...lists]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .forEach((list) => {
        const dateKey = new Date(list.created_at).toLocaleDateString("pl-PL", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(list);
      });

    return Object.entries(groups);
  })();

  if (selectedListId) {
    return (
      <Box className="sm-slide-right">
        <ShoppingListDetail
          listId={selectedListId}
          onBack={() => setSelectedListId(null)}
        />
      </Box>
    );
  }

  return (
    <Box px={{ base: 0, md: 6 }} py={{ base: 0, md: 4 }} maxW="600px" mx="auto" w="100%" overflow="hidden">
      <Flex align="center" justify="space-between" mb={5}>
        <Flex align="baseline" gap={2}>
          <Heading size={{ base: "lg", md: "xl" }} color="sage.700" fontFamily="'Nunito', sans-serif">
            Zakupy
          </Heading>
          {isFree && lists?.length > 0 && (
            <Text fontSize="xs" color={activeLists >= 3 ? "orange.500" : "gray.400"} fontWeight="500">
              {`${activeLists}/3`}
            </Text>
          )}
        </Flex>
        <Flex
          align="center"
          gap={2}
          px={3}
          py={2}
          bg="sage.400"
          color="white"
          borderRadius="xl"
          cursor="pointer"
          fontWeight="600"
          fontSize="sm"
          _hover={{ bg: "sage.500" }}
          _active={{ transform: "scale(0.97)" }}
          transition="all 0.2s"
          onClick={() => setShowNewDialog(true)}
        >
          <Icon as={LuPlus} boxSize={4} />
          <Text>Nowa lista</Text>
        </Flex>
      </Flex>

      {isLoading ? (
        <SmartMeLoader color="sage" />
      ) : !lists?.length ? (
        <EmptyState
          icon={LuShoppingCart}
          title={"Brak list zakupów"}
          description={'Utwórz pierwsz\u0105 list\u0119, klikaj\u0105c \u201ENowa lista\u201D'}
          color="sage"
        />
      ) : (
        <VStack gap={3} align="stretch">
          {groupedLists.map(([dateLabel, groupLists], groupIndex) => (
            <Box key={dateLabel}>
              <Flex align="center" gap={3} mb={2} mt={groupIndex === 0 ? 0 : 2}>
                <Text
                  fontSize="xs"
                  fontWeight="600"
                  color="sage.400"
                  whiteSpace="nowrap"
                  letterSpacing="0.03em"
                >
                  {dateLabel}
                </Text>
                <Box flex="1" h="1px" bg="sage.100" borderRadius="full" />
              </Flex>
              <VStack gap={3} align="stretch">
                {groupLists.map((list) => (
                  <ShoppingListCard
                    key={list.id}
                    list={list}
                    onClick={() => setSelectedListId(list.id)}
                    onDelete={() => handleDelete(list.id)}
                  />
                ))}
              </VStack>
            </Box>
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
