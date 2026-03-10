import { useEffect } from "react";
import { Box, Flex, Text, VStack, Icon } from "@chakra-ui/react";
import { LuArrowLeft, LuCheck, LuSparkles } from "react-icons/lu";
import useChallenges from "../../hooks/useChallenges";
import useRewards from "../../hooks/useRewards";
import { DAILY_COMPLETION_BONUS, WEEKLY_COMPLETION_BONUS, allCompleted } from "../../utils/challengeEngine";

// ─── Local micro-feedback keyframes ─────────────────────────────
const CARD_STYLES = `
  @keyframes chProgressPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(195,177,225,0); }
    50% { box-shadow: 0 0 8px 2px rgba(195,177,225,0.25); }
  }
`;

function ChallengeItem({ item, period, onClaim }) {
  const progressPct = item.target > 0 ? Math.min((item.progress / item.target) * 100, 100) : 0;
  const isReady = item.completed && !item.claimed;
  const isDone = item.claimed;

  return (
    <Flex
      bg="white"
      borderRadius="2xl"
      p={4}
      shadow={isReady
        ? "0 2px 12px 0 rgba(195,177,225,0.12)"
        : "0 1px 8px 0 rgba(0,0,0,0.04)"
      }
      borderWidth="1px"
      borderColor={isReady ? "lavender.200" : "gray.100"}
      gap={3}
      transition="all 0.25s cubic-bezier(0.22, 1, 0.36, 1)"
      direction="column"
      position="relative"
      overflow="hidden"
      _hover={isReady ? { shadow: "0 4px 16px 0 rgba(195,177,225,0.18)", borderColor: "lavender.300" } : {}}
      style={isDone ? { opacity: 0.7 } : undefined}
    >
      {/* Top row: icon + title + reward badge */}
      <Flex align="flex-start" gap={3}>
        {/* Icon circle */}
        <Flex
          align="center"
          justify="center"
          w="42px"
          h="42px"
          borderRadius="full"
          flexShrink={0}
          style={{
            background: isReady
              ? "linear-gradient(135deg, rgba(195,177,225,0.15), rgba(232,213,245,0.2))"
              : isDone
                ? "#F7F7F8"
                : "linear-gradient(135deg, rgba(247,247,248,1), rgba(240,240,242,1))",
            boxShadow: isReady ? "0 0 0 3px rgba(195,177,225,0.15)" : "none",
          }}
        >
          <Text fontSize="lg" lineHeight="1" style={{ filter: isDone ? "grayscale(0.6)" : "none" }}>
            {item.icon}
          </Text>
        </Flex>

        {/* Title + description */}
        <Box flex={1} minW={0}>
          <Flex align="center" gap={1.5} mb={0.5}>
            <Text
              fontSize="sm"
              fontWeight="700"
              color={isDone ? "gray.400" : "textSecondary"}
              lineHeight="1.3"
              style={isDone ? { textDecoration: "line-through", textDecorationColor: "var(--chakra-colors-gray-300)" } : undefined}
            >
              {item.title}
            </Text>
            {isDone && (
              <Flex
                align="center"
                justify="center"
                w="16px"
                h="16px"
                borderRadius="full"
                bg="lavender.100"
                flexShrink={0}
              >
                <Icon as={LuCheck} boxSize={2.5} color="lavender.500" strokeWidth={3} />
              </Flex>
            )}
          </Flex>
          <Text fontSize="xs" color="gray.400" lineHeight="1.4">
            {item.description}
          </Text>
        </Box>

        {/* Reward pill */}
        <Flex
          align="center"
          gap={1}
          px={2}
          py={1}
          borderRadius="full"
          flexShrink={0}
          bg={isDone ? "gray.50" : isReady ? "lavender.50" : "gray.50"}
        >
          <Text fontSize="2xs" lineHeight="1">{"\u2728"}</Text>
          <Text
            fontSize="2xs"
            fontWeight="700"
            color={isDone ? "gray.300" : isReady ? "lavender.500" : "gray.400"}
          >
            +{item.reward}
          </Text>
        </Flex>
      </Flex>

      {/* Progress row */}
      <Box>
        <Box
          bg="gray.100"
          borderRadius="full"
          h="5px"
          overflow="hidden"
          position="relative"
        >
          <Box
            h="100%"
            borderRadius="full"
            transition="width 0.5s cubic-bezier(0.22, 1, 0.36, 1)"
            style={{
              width: `${progressPct}%`,
              background: isDone
                ? "linear-gradient(90deg, #D4D4D8, #E4E4E7)"
                : isReady
                  ? "linear-gradient(90deg, #C3B1E1, #E8D5F5)"
                  : "linear-gradient(90deg, #E8D5F5, #FCC2D7)",
              animation: isReady ? "chProgressPulse 2s ease-in-out infinite" : "none",
            }}
          />
        </Box>
        <Flex justify="space-between" align="center" mt={1.5}>
          <Text fontSize="2xs" fontWeight="500" color="gray.400">
            {item.progress}/{item.target}
          </Text>

          {/* Claim CTA or done state */}
          {isReady ? (
            <Flex
              as="button"
              align="center"
              justify="center"
              gap={1}
              px={3.5}
              py={1.5}
              borderRadius="full"
              cursor="pointer"
              fontWeight="700"
              fontSize="xs"
              color="white"
              _hover={{ transform: "scale(1.05)", shadow: "0 4px 16px rgba(195,177,225,0.3)" }}
              _active={{ transform: "scale(0.96)" }}
              transition="all 0.2s cubic-bezier(0.22, 1, 0.36, 1)"
              style={{
                background: "linear-gradient(135deg, #C3B1E1, #D8C4F0)",
                boxShadow: "0 2px 10px rgba(195,177,225,0.2)",
              }}
              onClick={() => onClaim(item.id, period)}
            >
              <Icon as={LuSparkles} boxSize={3} />
              {"Odbierz"}
            </Flex>
          ) : isDone ? (
            <Text fontSize="2xs" fontWeight="600" color="gray.300" letterSpacing="0.02em">
              {"Odebrano"}
            </Text>
          ) : (
            <Text fontSize="2xs" fontWeight="600" color="lavender.300">
              {Math.round(progressPct)}%
            </Text>
          )}
        </Flex>
      </Box>
    </Flex>
  );
}

function CompletionBonusCard({ period, items, allCompletedClaimed, onClaimBonus }) {
  const bonus = period === "daily" ? DAILY_COMPLETION_BONUS : WEEKLY_COMPLETION_BONUS;
  const isAllDone = allCompleted(items);
  const allItemsClaimed = items.every((i) => i.claimed);

  if (!isAllDone) return null;

  return (
    <Box
      borderRadius="2xl"
      p={4}
      borderWidth="1px"
      borderColor={allCompletedClaimed ? "gray.100" : "lavender.200"}
      shadow={allCompletedClaimed ? "0 1px 8px 0 rgba(0,0,0,0.04)" : "0 2px 16px 0 rgba(195,177,225,0.12)"}
      style={{
        background: allCompletedClaimed
          ? "white"
          : "linear-gradient(135deg, rgba(195,177,225,0.06), rgba(232,213,245,0.1))",
      }}
    >
      <Flex align="center" gap={3}>
        <Flex
          align="center"
          justify="center"
          w="44px"
          h="44px"
          borderRadius="full"
          flexShrink={0}
          style={{
            background: allCompletedClaimed
              ? "#F7F7F8"
              : "linear-gradient(135deg, rgba(195,177,225,0.2), rgba(252,194,215,0.15))",
            boxShadow: allCompletedClaimed ? "none" : "0 0 0 3px rgba(195,177,225,0.12)",
          }}
        >
          <Text fontSize="xl" lineHeight="1">
            {period === "daily" ? "\u{1F31F}" : "\u{1F451}"}
          </Text>
        </Flex>

        <Box flex={1}>
          <Text fontSize="sm" fontWeight="700" color={allCompletedClaimed ? "gray.400" : "textSecondary"}>
            {allCompletedClaimed
              ? "Bonus odebrany"
              : period === "daily"
                ? "Brawo, ca\u0142y zestaw!"
                : "Tygodniowy komplet!"}
          </Text>
          <Flex align="center" gap={1} mt={0.5}>
            <Text fontSize="xs" lineHeight="1">{"\u2728"}</Text>
            <Text fontSize="xs" fontWeight="600" color={allCompletedClaimed ? "gray.300" : "lavender.500"}>
              +{bonus} {"Iskier"}
            </Text>
          </Flex>
        </Box>

        {!allCompletedClaimed && allItemsClaimed && (
          <Flex
            as="button"
            align="center"
            justify="center"
            gap={1}
            px={4}
            py={2}
            borderRadius="full"
            cursor="pointer"
            fontWeight="700"
            fontSize="xs"
            color="white"
            flexShrink={0}
            _hover={{ transform: "scale(1.05)", shadow: "0 6px 20px rgba(244,115,64,0.25)" }}
            _active={{ transform: "scale(0.96)" }}
            transition="all 0.2s cubic-bezier(0.22, 1, 0.36, 1)"
            style={{
              background: "linear-gradient(135deg, #FAA2C1, #F9915E)",
              boxShadow: "0 3px 12px rgba(244,115,64,0.2)",
            }}
            onClick={() => onClaimBonus(period)}
          >
            <Icon as={LuSparkles} boxSize={3.5} />
            {"Odbierz bonus"}
          </Flex>
        )}

        {allCompletedClaimed && (
          <Flex align="center" justify="center" w="24px" h="24px" borderRadius="full" bg="lavender.100" flexShrink={0}>
            <Icon as={LuCheck} boxSize={3} color="lavender.500" strokeWidth={3} />
          </Flex>
        )}
      </Flex>
    </Box>
  );
}

function SectionProgress({ items, accent }) {
  const completed = items.filter((i) => i.completed).length;
  const total = items.length;
  const pct = total > 0 ? (completed / total) * 100 : 0;
  const allDone = completed === total;

  return (
    <Flex align="center" gap={2.5} mb={3}>
      <Box flex={1} bg="gray.100" borderRadius="full" h="5px" overflow="hidden">
        <Box
          h="100%"
          borderRadius="full"
          transition="width 0.6s cubic-bezier(0.22, 1, 0.36, 1)"
          style={{
            width: `${pct}%`,
            background: accent,
          }}
        />
      </Box>
      <Flex
        align="center"
        gap={1}
        px={2}
        py={0.5}
        borderRadius="full"
        bg={allDone ? "lavender.50" : "transparent"}
      >
        {allDone && <Icon as={LuCheck} boxSize={3} color="lavender.500" strokeWidth={3} />}
        <Text fontSize="xs" fontWeight="600" color={allDone ? "lavender.500" : "gray.400"}>
          {completed}/{total}
        </Text>
      </Flex>
    </Flex>
  );
}

export default function ChallengesPage({ onBack }) {
  const daily = useChallenges((s) => s.daily);
  const weekly = useChallenges((s) => s.weekly);
  const sync = useChallenges((s) => s.sync);
  const claimReward = useChallenges((s) => s.claimReward);
  const claimAllBonus = useChallenges((s) => s.claimAllBonus);
  const addBonusSparks = useRewards((s) => s.addBonusSparks);

  useEffect(() => {
    sync();
  }, [sync]);

  const handleClaim = (id, period) => {
    claimReward(id, period, addBonusSparks);
  };

  const handleClaimBonus = (period) => {
    claimAllBonus(period, addBonusSparks);
  };

  return (
    <Box
      maxW="480px"
      mx="auto"
      px={{ base: "1", md: "2" }}
      py={{ base: "2", md: "4" }}
      pb={{ base: "16", md: "4" }}
    >
      <style>{CARD_STYLES}</style>

      {/* Header */}
      <Flex align="center" gap={3} mb={5}>
        <Icon
          as={LuArrowLeft}
          boxSize={5}
          color="gray.500"
          cursor="pointer"
          _hover={{ color: "textSecondary" }}
          onClick={onBack}
        />
        <Box flex={1}>
          <Text fontSize="lg" fontWeight="700" color="textSecondary">
            {"Wyzwania"}
          </Text>
          <Text fontSize="xs" color="gray.400">
            {"Ma\u0142e kroki, pi\u0119kny progres"}
          </Text>
        </Box>
      </Flex>

      {/* \u2500\u2500 Daily Challenges \u2500\u2500 */}
      <Box mb={7}>
        <Flex align="center" gap={2} mb={2.5} px={1}>
          <Flex
            align="center"
            justify="center"
            w="28px"
            h="28px"
            borderRadius="full"
            style={{ background: "linear-gradient(135deg, rgba(195,177,225,0.15), rgba(232,213,245,0.2))" }}
          >
            <Text fontSize="sm" lineHeight="1">{"\u2600\uFE0F"}</Text>
          </Flex>
          <Box>
            <Text fontSize="sm" fontWeight="700" color="textSecondary">
              {"Dzisiejsze wyzwania"}
            </Text>
            <Text fontSize="2xs" color="gray.400" lineHeight="1.2">
              {"Odnawiane codziennie"}
            </Text>
          </Box>
        </Flex>

        <SectionProgress items={daily.items} accent="linear-gradient(90deg, #C3B1E1, #E8D5F5)" />

        <VStack gap={2.5} align="stretch">
          {daily.items.map((item) => (
            <ChallengeItem
              key={item.id}
              item={item}
              period="daily"
              onClaim={handleClaim}
            />
          ))}
        </VStack>

        <Box mt={2.5}>
          <CompletionBonusCard
            period="daily"
            items={daily.items}
            allCompletedClaimed={daily.allCompletedClaimed}
            onClaimBonus={handleClaimBonus}
          />
        </Box>
      </Box>

      {/* Section divider */}
      <Box px={6} mb={7}>
        <Box
          h="1px"
          borderRadius="full"
          style={{ background: "linear-gradient(90deg, transparent, rgba(195,177,225,0.2), rgba(252,194,215,0.2), transparent)" }}
        />
      </Box>

      {/* \u2500\u2500 Weekly Challenges \u2500\u2500 */}
      <Box mb={6}>
        <Flex align="center" gap={2} mb={2.5} px={1}>
          <Flex
            align="center"
            justify="center"
            w="28px"
            h="28px"
            borderRadius="full"
            style={{ background: "linear-gradient(135deg, rgba(252,194,215,0.15), rgba(253,208,177,0.15))" }}
          >
            <Text fontSize="sm" lineHeight="1">{"\u{1F4C5}"}</Text>
          </Flex>
          <Box>
            <Text fontSize="sm" fontWeight="700" color="textSecondary">
              {"Wyzwania tygodnia"}
            </Text>
            <Text fontSize="2xs" color="gray.400" lineHeight="1.2">
              {"Nowy zestaw co poniedzia\u0142ek"}
            </Text>
          </Box>
        </Flex>

        <SectionProgress items={weekly.items} accent="linear-gradient(90deg, #FCC2D7, #FDD0B1)" />

        <VStack gap={2.5} align="stretch">
          {weekly.items.map((item) => (
            <ChallengeItem
              key={item.id}
              item={item}
              period="weekly"
              onClaim={handleClaim}
            />
          ))}
        </VStack>

        <Box mt={2.5}>
          <CompletionBonusCard
            period="weekly"
            items={weekly.items}
            allCompletedClaimed={weekly.allCompletedClaimed}
            onClaimBonus={handleClaimBonus}
          />
        </Box>
      </Box>
    </Box>
  );
}
