import { useEffect } from "react";
import { Box, Flex, Text, Icon } from "@chakra-ui/react";
import { LuStar } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import useChallenges from "../../hooks/useChallenges";

export default function ChallengesWidget() {
  const navigate = useNavigate();
  const daily = useChallenges((s) => s.daily);
  const weekly = useChallenges((s) => s.weekly);
  const sync = useChallenges((s) => s.sync);

  useEffect(() => {
    sync();
  }, [sync]);

  const dailyDone = daily.items.filter((i) => i.completed).length;
  const dailyTotal = daily.items.length;
  const weeklyDone = weekly.items.filter((i) => i.completed).length;
  const weeklyTotal = weekly.items.length;

  const dailyPct = dailyTotal > 0 ? (dailyDone / dailyTotal) * 100 : 0;
  const weeklyPct = weeklyTotal > 0 ? (weeklyDone / weeklyTotal) * 100 : 0;

  // Count unclaimed rewards
  const unclaimedDaily = daily.items.filter((i) => i.completed && !i.claimed).length;
  const unclaimedWeekly = weekly.items.filter((i) => i.completed && !i.claimed).length;
  const totalUnclaimed = unclaimedDaily + unclaimedWeekly;

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      px={4}
      py={3.5}
      shadow="0 1px 8px 0 rgba(0,0,0,0.04)"
      borderWidth="1px"
      borderColor="gray.100"
      cursor="pointer"
      _hover={{ borderColor: "lavender.200", shadow: "0 2px 12px 0 rgba(195,177,225,0.12)" }}
      transition="all 0.2s"
      onClick={() => navigate("/wyzwania")}
    >
      <Flex align="center" justify="space-between" mb={2.5}>
        <Flex align="center" gap={2}>
          <Flex
            align="center"
            justify="center"
            w="28px"
            h="28px"
            borderRadius="lg"
            bg="lavender.50"
          >
            <Icon as={LuStar} boxSize="14px" color="lavender.500" strokeWidth="2.5" />
          </Flex>
          <Text fontSize="sm" fontWeight="700" color="textSecondary">
            {"Wyzwania"}
          </Text>
        </Flex>

        {totalUnclaimed > 0 && (
          <Flex
            align="center"
            justify="center"
            px={2}
            py={0.5}
            borderRadius="full"
            style={{ background: "linear-gradient(135deg, #C3B1E1, #E8D5F5)" }}
          >
            <Text fontSize="2xs" fontWeight="700" color="white">
              {totalUnclaimed} {"do odebrania"}
            </Text>
          </Flex>
        )}
      </Flex>

      {/* Daily progress */}
      <Flex align="center" gap={2} mb={1.5}>
        <Text fontSize="2xs" color="gray.400" fontWeight="500" w="56px" flexShrink={0}>
          {"Dziś"}
        </Text>
        <Box flex={1} bg="lavender.50" borderRadius="full" h="5px" overflow="hidden">
          <Box
            h="100%"
            borderRadius="full"
            transition="width 0.4s ease"
            style={{
              width: `${dailyPct}%`,
              background: "linear-gradient(90deg, #C3B1E1, #FCC2D7)",
            }}
          />
        </Box>
        <Text fontSize="2xs" fontWeight="600" color="lavender.500" w="24px" textAlign="right">
          {dailyDone}/{dailyTotal}
        </Text>
      </Flex>

      {/* Weekly progress */}
      <Flex align="center" gap={2}>
        <Text fontSize="2xs" color="gray.400" fontWeight="500" w="56px" flexShrink={0}>
          {"Tydzień"}
        </Text>
        <Box flex={1} bg="lavender.50" borderRadius="full" h="5px" overflow="hidden">
          <Box
            h="100%"
            borderRadius="full"
            transition="width 0.4s ease"
            style={{
              width: `${weeklyPct}%`,
              background: "linear-gradient(90deg, #FCC2D7, #FDD0B1)",
            }}
          />
        </Box>
        <Text fontSize="2xs" fontWeight="600" color="rose.400" w="24px" textAlign="right">
          {weeklyDone}/{weeklyTotal}
        </Text>
      </Flex>

      {/* CTA */}
      <Flex justify="center" mt={2.5}>
        <Text fontSize="2xs" fontWeight="600" color="lavender.400" letterSpacing="0.02em">
          {"Zobacz wyzwania →"}
        </Text>
      </Flex>
    </Box>
  );
}
