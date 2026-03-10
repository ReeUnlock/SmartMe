import { useState } from "react";
import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { LuTarget, LuStar } from "react-icons/lu";
import { usePlansSummary } from "../../hooks/usePlans";
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
      {/* Header + Summary */}
      <Flex align="center" justify="space-between" mb={1}>
        <Heading
          size={{ base: "lg", md: "xl" }}
          color="rose.700"
          fontFamily="'Nunito', sans-serif"
        >
          {"Cele"}
        </Heading>
        {summary && !summaryLoading && (
          <Flex gap={3}>
            <Text fontSize="2xs" color="gray.400" fontWeight="500">
              {summary.completed_goals}/{summary.total_goals}{" cel."}
            </Text>
            <Text fontSize="2xs" color="gray.400" fontWeight="500">
              {summary.completed_bucket_items}/{summary.total_bucket_items}{" bucket"}
            </Text>
          </Flex>
        )}
      </Flex>

      {/* Tabs */}
      <Flex gap={0} mb={4} bg="rose.50" borderRadius="xl" p="3px" overflow="hidden">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Flex
              key={t.key}
              align="center"
              justify="center"
              flex={1}
              gap={1.5}
              px={4}
              py={2}
              borderRadius="lg"
              cursor="pointer"
              fontWeight="600"
              fontSize="sm"
              bg={active ? "white" : "transparent"}
              color={active ? "rose.500" : "gray.500"}
              shadow={active ? "sm" : "none"}
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

      <Box key={tab} className="sm-fade-in">
        {tab === "goals" && <GoalsView />}
        {tab === "bucket" && <BucketListView />}
      </Box>
    </Box>
  );
}
