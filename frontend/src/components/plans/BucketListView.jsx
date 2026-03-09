import { useState } from "react";
import { Box, Flex, Text, Icon, VStack, Spinner } from "@chakra-ui/react";
import { LuPlus, LuStar, LuTrash2, LuSparkles } from "react-icons/lu";
import {
  useBucketItems, useCreateBucketItem, useDeleteBucketItem, useToggleBucketItem,
} from "../../hooks/usePlans";
import BucketItemFormDialog from "./BucketItemFormDialog";

const CATEGORY_LABELS = {
  podroze: "Podróże",
  rozwoj: "Rozwój",
  zdrowie: "Zdrowie",
  finanse: "Finanse",
  inne: "Inne",
};

const CATEGORY_COLORS = {
  podroze: "blue.400",
  rozwoj: "purple.400",
  zdrowie: "green.400",
  finanse: "orange.400",
  inne: "gray.400",
};

export default function BucketListView() {
  const { data: items, isLoading } = useBucketItems();
  const createItem = useCreateBucketItem();
  const deleteItem = useDeleteBucketItem();
  const toggleItem = useToggleBucketItem();
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (data) => {
    await createItem.mutateAsync(data);
    setShowForm(false);
  };

  const pending = items?.filter((i) => !i.is_completed) || [];
  const completed = items?.filter((i) => i.is_completed) || [];

  return (
    <>
      <Flex align="center" justify="space-between" mb={4}>
        <Text fontSize="md" fontWeight="600" color="gray.600">
          {"Lista marzeń"}
        </Text>
        <Flex
          align="center"
          gap={2}
          px={3}
          py={2}
          bg="rose.400"
          color="white"
          borderRadius="xl"
          cursor="pointer"
          fontWeight="600"
          fontSize="sm"
          _hover={{ bg: "rose.500" }}
          _active={{ transform: "scale(0.97)" }}
          transition="all 0.2s"
          onClick={() => setShowForm(true)}
        >
          <Icon as={LuPlus} boxSize={4} />
          <Text>{"Nowe marzenie"}</Text>
        </Flex>
      </Flex>

      {isLoading ? (
        <Flex justify="center" py={12}>
          <Spinner color="rose.400" size="lg" />
        </Flex>
      ) : !items?.length ? (
        <VStack py={16} gap={3} color="gray.400">
          <Icon as={LuStar} boxSize={16} strokeWidth={1} />
          <Text fontSize="lg" fontWeight="600">{"Pusta bucket lista"}</Text>
          <Text fontSize="sm">{"Dodaj swoje marzenia i cele życiowe"}</Text>
        </VStack>
      ) : (
        <VStack gap={3} align="stretch">
          {/* Pending items */}
          {pending.map((item) => (
            <BucketCard
              key={item.id}
              item={item}
              onToggle={() => toggleItem.mutateAsync(item.id)}
              onDelete={() => deleteItem.mutateAsync(item.id)}
            />
          ))}

          {/* Completed section */}
          {completed.length > 0 && (
            <>
              <Flex align="center" gap={2} mt={2}>
                <Icon as={LuSparkles} boxSize={4} color="rose.400" />
                <Text fontSize="sm" fontWeight="600" color="rose.400">
                  {"Spełnione"} ({completed.length})
                </Text>
              </Flex>
              {completed.map((item) => (
                <BucketCard
                  key={item.id}
                  item={item}
                  onToggle={() => toggleItem.mutateAsync(item.id)}
                  onDelete={() => deleteItem.mutateAsync(item.id)}
                />
              ))}
            </>
          )}
        </VStack>
      )}

      <BucketItemFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
        isLoading={createItem.isPending}
      />
    </>
  );
}

function BucketCard({ item, onToggle, onDelete }) {
  return (
    <Flex
      bg="white"
      borderRadius="xl"
      borderWidth="1px"
      borderColor={item.is_completed ? "rose.200" : "gray.100"}
      shadow="0 1px 4px 0 rgba(0,0,0,0.04)"
      p={4}
      align="center"
      gap={3}
      opacity={item.is_completed ? 0.6 : 1}
      transition="all 0.2s"
    >
      {/* Toggle checkbox */}
      <Flex
        align="center"
        justify="center"
        w={6}
        h={6}
        borderRadius="full"
        borderWidth="2px"
        borderColor={item.is_completed ? "rose.400" : "gray.300"}
        bg={item.is_completed ? "rose.400" : "transparent"}
        cursor="pointer"
        transition="all 0.2s"
        flexShrink={0}
        onClick={onToggle}
      >
        {item.is_completed && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </Flex>

      <Box flex={1} minW={0}>
        <Text
          fontWeight="600"
          fontSize="md"
          truncate
          textDecoration={item.is_completed ? "line-through" : "none"}
          color={item.is_completed ? "gray.400" : "gray.700"}
        >
          {item.title}
        </Text>
        <Flex gap={2} align="center">
          {item.category && (
            <Text fontSize="xs" color={CATEGORY_COLORS[item.category] || "gray.400"}>
              {CATEGORY_LABELS[item.category] || item.category}
            </Text>
          )}
          {item.description && (
            <Text fontSize="xs" color="gray.400" truncate>
              {item.description}
            </Text>
          )}
          {item.completed_date && (
            <Text fontSize="xs" color="gray.400">
              {new Date(item.completed_date).toLocaleDateString("pl-PL")}
            </Text>
          )}
        </Flex>
      </Box>

      <Icon
        as={LuTrash2}
        boxSize={4}
        color="gray.300"
        cursor="pointer"
        _hover={{ color: "red.400" }}
        transition="color 0.2s"
        onClick={onDelete}
      />
    </Flex>
  );
}
