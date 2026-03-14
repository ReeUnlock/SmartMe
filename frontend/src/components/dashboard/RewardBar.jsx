import { Box, Flex, Text } from "@chakra-ui/react";
import useRewards from "../../hooks/useRewards";

function sparkLabel(n) {
  if (n === 1) return "Iskra";
  if (n < 5) return "Iskry";
  return "Iskier";
}

export default function RewardBar() {
  const level = useRewards((s) => s.level);
  const xp = useRewards((s) => s.xp);
  const xpToNextLevel = useRewards((s) => s.xpToNextLevel);
  const sparks = useRewards((s) => s.sparks);
  const streakDays = useRewards((s) => s.streakDays);

  const progress = xpToNextLevel > 0 ? Math.min((xp / xpToNextLevel) * 100, 100) : 0;

  return (
    <Box
      id="reward-bar"
      bg="white"
      borderRadius="2xl"
      px={4}
      py={3.5}
      shadow="0 1px 8px 0 rgba(0,0,0,0.04)"
      borderWidth="1px"
      borderColor="gray.100"
    >
      {/* Top row: level + sparks + streak */}
      <Flex align="center" justify="space-between" mb={2.5}>
        <Flex align="center" gap={2}>
          <Flex
            align="center"
            justify="center"
            w="28px"
            h="28px"
            borderRadius="full"
            style={{ background: "linear-gradient(135deg, #FCC2D7, #FDD0B1)" }}
          >
            <Text fontSize="xs" fontWeight="800" color="white" lineHeight="1">
              {level}
            </Text>
          </Flex>
          <Box>
            <Text fontSize="sm" fontWeight="700" color="textSecondary" lineHeight="1.2">
              {"Poziom"} {level}
            </Text>
            <Text fontSize="2xs" color="gray.400" fontWeight="500" lineHeight="1.2" mt={0.5}>
              {sparks} {sparkLabel(sparks)}
            </Text>
          </Box>
        </Flex>

        {streakDays > 0 && (
          <Flex
            align="center"
            gap={1.5}
            bg="peach.50"
            px={2.5}
            py={1}
            borderRadius="full"
          >
            <Text fontSize="xs" lineHeight="1">{"🔥"}</Text>
            <Text fontSize="xs" fontWeight="700" color="peach.500" lineHeight="1">
              {streakDays} {streakDays === 1 ? "dzień" : "dni"}
            </Text>
          </Flex>
        )}
      </Flex>

      {/* Progress bar */}
      <Box position="relative" h="6px" bg="gray.100" borderRadius="full" overflow="hidden">
        <Box
          position="absolute"
          left={0}
          top={0}
          h="100%"
          borderRadius="full"
          minW={progress > 0 ? "24px" : "0px"}
          transition="width 0.6s cubic-bezier(0.22, 1, 0.36, 1)"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, #FCC2D7, #F9915E)",
          }}
        />
      </Box>

      <Flex justify="space-between" mt={1.5}>
        <Text fontSize="2xs" color="gray.400" fontWeight="500">
          {xp} / {xpToNextLevel}
        </Text>
        <Text fontSize="2xs" color="rose.300" fontWeight="600">
          {"Poziom"} {level + 1} {"→"}
        </Text>
      </Flex>
    </Box>
  );
}
