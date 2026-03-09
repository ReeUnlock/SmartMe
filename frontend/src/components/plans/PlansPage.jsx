import { useState } from "react";
import { Box, Flex, Heading, Text, Spinner } from "@chakra-ui/react";
import { LuTarget, LuStar } from "react-icons/lu";
import { useGoals, usePlansSummary } from "../../hooks/usePlans";
import GoalsView from "./GoalsView";
import BucketListView from "./BucketListView";

const TABS = [
  { key: "goals", label: "Cele", icon: LuTarget },
  { key: "bucket", label: "Bucket Lista", icon: LuStar },
];

export default function PlansPage() {
  const [tab, setTab] = useState("goals");
  const { data: summary, isLoading: summaryLoading } = usePlansSummary();

  return (
    <Box px={{ base: 0, md: 6 }} py={{ base: 0, md: 4 }} maxW="600px" mx="auto" w="100%" overflow="hidden">
      <Heading
        size={{ base: "lg", md: "xl" }}
        color="rose.700"
        fontFamily="'Nunito', sans-serif"
        mb={1}
      >
        {"Plany"}
      </Heading>

      {/* Summary strip */}
      {summary && !summaryLoading && (
        <Flex gap={4} mb={4} flexWrap="wrap">
          <Text fontSize="xs" color="gray.500">
            {"Cele: "}{summary.completed_goals}/{summary.total_goals}{" ukończonych"}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {"Bucket lista: "}{summary.completed_bucket_items}/{summary.total_bucket_items}{" spełnionych"}
          </Text>
        </Flex>
      )}

      {/* Tabs */}
      <Flex gap={2} mb={5}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Flex
              key={t.key}
              align="center"
              gap={1.5}
              px={4}
              py={2}
              borderRadius="xl"
              cursor="pointer"
              fontWeight="600"
              fontSize="sm"
              bg={active ? "rose.400" : "rose.50"}
              color={active ? "white" : "rose.500"}
              _hover={{ bg: active ? "rose.500" : "rose.100" }}
              _active={{ transform: "scale(0.97)" }}
              transition="all 0.2s"
              onClick={() => setTab(t.key)}
            >
              <Box as={t.icon} boxSize={4} />
              <Text>{t.label}</Text>
            </Flex>
          );
        })}
      </Flex>

      {tab === "goals" && <GoalsView />}
      {tab === "bucket" && <BucketListView />}
    </Box>
  );
}
