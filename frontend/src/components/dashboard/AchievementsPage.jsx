import { useMemo, useState } from "react";
import { Box, Flex, Text, VStack, Icon } from "@chakra-ui/react";
import { LuArrowLeft, LuAward, LuFlame, LuStar, LuChevronDown } from "react-icons/lu";
import useAchievements from "../../hooks/useAchievements";
import useRewards from "../../hooks/useRewards";
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES, LEVEL_MILESTONES } from "../../utils/achievementEngine";

// --- Trophy Room Showcase ---

function SummaryHeader({ level, sparks, streakDays, unlockedCount, totalCount, maxStreak }) {
  return (
    <Box
      borderRadius="2xl"
      p={5}
      mb={5}
      style={{
        background: "linear-gradient(135deg, rgba(252,194,215,0.12), rgba(253,208,177,0.1))",
      }}
      borderWidth="1px"
      borderColor="rose.100"
    >
      <Flex justify="space-between" align="center" mb={3}>
        <Text fontSize="md" fontWeight="700" color="textSecondary">
          {"Twoja kolekcja"}
        </Text>
        <Flex align="center" gap={1.5}>
          <Icon as={LuAward} boxSize={4} color="rose.400" />
          <Text fontSize="sm" fontWeight="700" color="rose.400">
            {unlockedCount}/{totalCount}
          </Text>
        </Flex>
      </Flex>

      <Flex gap={3} flexWrap="wrap">
        {/* Level */}
        <Flex
          align="center"
          gap={1.5}
          bg="white"
          px={3}
          py={1.5}
          borderRadius="full"
          shadow="0 1px 4px rgba(0,0,0,0.04)"
        >
          <Flex
            align="center"
            justify="center"
            w="20px"
            h="20px"
            borderRadius="full"
            style={{ background: "linear-gradient(135deg, #FCC2D7, #FDD0B1)" }}
          >
            <Text fontSize="2xs" fontWeight="800" color="white" lineHeight="1">{level}</Text>
          </Flex>
          <Text fontSize="xs" fontWeight="600" color="textSecondary">{"Poziom"} {level}</Text>
        </Flex>

        {/* Sparks */}
        <Flex align="center" gap={1} bg="white" px={3} py={1.5} borderRadius="full" shadow="0 1px 4px rgba(0,0,0,0.04)">
          <Text fontSize="xs" lineHeight="1">{"✨"}</Text>
          <Text fontSize="xs" fontWeight="600" color="peach.600">{sparks}</Text>
        </Flex>

        {/* Streak */}
        {streakDays > 0 && (
          <Flex align="center" gap={1} bg="white" px={3} py={1.5} borderRadius="full" shadow="0 1px 4px rgba(0,0,0,0.04)">
            <Icon as={LuFlame} boxSize={3.5} color="peach.500" />
            <Text fontSize="xs" fontWeight="600" color="peach.500">{streakDays} {"dni"}</Text>
          </Flex>
        )}

        {/* Best streak */}
        {maxStreak > 0 && (
          <Flex align="center" gap={1} bg="white" px={3} py={1.5} borderRadius="full" shadow="0 1px 4px rgba(0,0,0,0.04)">
            <Icon as={LuStar} boxSize={3.5} color="rose.300" />
            <Text fontSize="xs" fontWeight="600" color="rose.300">{"Rekord:"} {maxStreak}</Text>
          </Flex>
        )}
      </Flex>
    </Box>
  );
}

function RecentlyUnlocked({ recentIds }) {
  if (recentIds.length === 0) return null;

  const achievements = recentIds
    .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
    .filter(Boolean);

  return (
    <Box mb={5}>
      <Flex align="center" gap={2} mb={3} px={1}>
        <Text fontSize="md" lineHeight="1">{"🎉"}</Text>
        <Text fontSize="sm" fontWeight="700" color="textSecondary">
          {"Ostatnio odblokowane"}
        </Text>
      </Flex>

      <Flex gap={2} overflowX="auto" pb={1} css={{ "&::-webkit-scrollbar": { display: "none" }, scrollbarWidth: "none" }}>
        {achievements.map((a) => {
          const catInfo = ACHIEVEMENT_CATEGORIES[a.category];
          return (
            <Flex
              key={a.id}
              direction="column"
              align="center"
              gap={1.5}
              px={4}
              py={3}
              borderRadius="2xl"
              bg="white"
              borderWidth="1px"
              borderColor={`${catInfo.color}.200`}
              shadow="0 2px 12px 0 rgba(0,0,0,0.04)"
              flexShrink={0}
              minW="100px"
              position="relative"
            >
              {/* "Nowe" pill */}
              <Box
                position="absolute"
                top="-6px"
                right="-4px"
                px={1.5}
                py={0.5}
                borderRadius="full"
                fontSize="2xs"
                fontWeight="700"
                color="white"
                style={{ background: "linear-gradient(135deg, #FCC2D7, #F9915E)" }}
              >
                {"Nowe"}
              </Box>

              <Flex
                align="center"
                justify="center"
                w="40px"
                h="40px"
                borderRadius="full"
                bg={`${catInfo.color}.50`}
              >
                <Text fontSize="lg" lineHeight="1">{a.icon}</Text>
              </Flex>
              <Text fontSize="2xs" fontWeight="700" color="textSecondary" textAlign="center" lineHeight="1.3" maxW="80px">
                {a.title}
              </Text>
            </Flex>
          );
        })}
      </Flex>
    </Box>
  );
}

function CategorySection({ catKey, catInfo, achievements, unlockedSet, progress, isExpanded, onToggle }) {
  const catUnlocked = achievements.filter((a) => unlockedSet.has(a.id)).length;

  return (
    <Box mb={3}>
      <Flex
        as="button"
        align="center"
        gap={2}
        px={3}
        py={2.5}
        w="full"
        cursor="pointer"
        borderRadius="xl"
        bg="white"
        borderWidth="1px"
        borderColor={isExpanded ? `${catInfo.color}.200` : "gray.100"}
        shadow="0 1px 8px 0 rgba(0,0,0,0.04)"
        transition="all 0.2s"
        _hover={{ borderColor: `${catInfo.color}.200` }}
        onClick={onToggle}
      >
        <Box
          w="8px"
          h="8px"
          borderRadius="full"
          bg={`${catInfo.color}.400`}
          flexShrink={0}
        />
        <Text fontSize="sm" fontWeight="700" color="textSecondary" flex={1} textAlign="left">
          {catInfo.label}
        </Text>
        <Text fontSize="xs" color="gray.400" mr={1}>
          {catUnlocked}/{achievements.length}
        </Text>
        <Icon
          as={LuChevronDown}
          boxSize={4}
          color="gray.400"
          transition="transform 0.2s"
          transform={isExpanded ? "rotate(180deg)" : "rotate(0deg)"}
        />
      </Flex>

      {isExpanded && (
        <VStack gap={2} align="stretch" mt={2} className="sm-expand-in">
          {achievements.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              isUnlocked={unlockedSet.has(achievement.id)}
              progress={progress}
            />
          ))}
        </VStack>
      )}
    </Box>
  );
}

function AchievementBadge({ achievement, isUnlocked, progress }) {
  const currentProgress = progress[achievement.progressKey] || 0;
  const progressPct = Math.min((currentProgress / achievement.target) * 100, 100);
  const catInfo = ACHIEVEMENT_CATEGORIES[achievement.category];

  return (
    <Flex
      bg="white"
      borderRadius="2xl"
      p={4}
      shadow={isUnlocked ? "0 2px 12px 0 rgba(0,0,0,0.04)" : "0 1px 8px 0 rgba(0,0,0,0.04)"}
      borderWidth="1px"
      borderColor={isUnlocked ? `${catInfo.color}.200` : "gray.100"}
      align="center"
      gap={3}
      opacity={isUnlocked ? 1 : 0.55}
      transition="all 0.2s"
      _hover={isUnlocked ? { shadow: "0 4px 16px 0 rgba(0,0,0,0.06)", borderColor: `${catInfo.color}.300` } : {}}
    >
      {/* Badge icon */}
      <Flex
        align="center"
        justify="center"
        w="48px"
        h="48px"
        borderRadius="full"
        bg={isUnlocked ? `${catInfo.color}.50` : "gray.50"}
        flexShrink={0}
        style={{
          filter: isUnlocked ? "none" : "grayscale(1)",
          boxShadow: isUnlocked ? `0 0 0 3px var(--chakra-colors-${catInfo.color}-100)` : "none",
        }}
      >
        <Text fontSize="xl" lineHeight="1">
          {achievement.icon}
        </Text>
      </Flex>

      {/* Info */}
      <Box flex={1} minW={0}>
        <Text
          fontSize="sm"
          fontWeight="700"
          color={isUnlocked ? "textSecondary" : "gray.400"}
          mb={0.5}
        >
          {achievement.title}
        </Text>
        <Text fontSize="xs" color="gray.400" lineHeight="1.4">
          {achievement.description}
        </Text>

        {/* Progress bar for locked achievements */}
        {!isUnlocked && achievement.target > 1 && (
          <Box mt={2}>
            <Box bg="gray.100" borderRadius="full" h="4px" overflow="hidden">
              <Box
                bg={`${catInfo.color}.300`}
                h="100%"
                borderRadius="full"
                w={`${progressPct}%`}
                transition="width 0.4s ease"
              />
            </Box>
            <Text fontSize="2xs" color="gray.400" mt={1}>
              {currentProgress} / {achievement.target}
            </Text>
          </Box>
        )}
      </Box>

      {/* Unlocked indicator */}
      {isUnlocked && (
        <Flex
          align="center"
          justify="center"
          w="24px"
          h="24px"
          borderRadius="full"
          bg={`${catInfo.color}.100`}
          flexShrink={0}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6L5 9L10 3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: `var(--chakra-colors-${catInfo.color}-500)` }}
            />
          </svg>
        </Flex>
      )}
    </Flex>
  );
}

function FeatureUnlock({ milestone, isUnlocked }) {
  return (
    <Flex
      bg="white"
      borderRadius="2xl"
      p={3.5}
      shadow="0 1px 8px 0 rgba(0,0,0,0.04)"
      borderWidth="1px"
      borderColor={isUnlocked ? "rose.200" : "gray.100"}
      align="center"
      gap={3}
      opacity={isUnlocked ? 1 : 0.5}
      transition="all 0.2s"
    >
      <Flex
        align="center"
        justify="center"
        w="36px"
        h="36px"
        borderRadius="full"
        style={{
          background: isUnlocked
            ? "linear-gradient(135deg, #FCC2D7, #FDD0B1)"
            : "#F7F7F8",
          boxShadow: isUnlocked ? "0 0 0 3px rgba(252,194,215,0.3)" : "none",
        }}
        flexShrink={0}
      >
        <Text fontSize="sm" fontWeight="800" color={isUnlocked ? "white" : "gray.400"} lineHeight="1">
          {milestone.level}
        </Text>
      </Flex>
      <Box flex={1}>
        <Text fontSize="sm" fontWeight="600" color={isUnlocked ? "textSecondary" : "gray.400"}>
          {milestone.label}
        </Text>
        <Text fontSize="xs" color="gray.400">
          {"Poziom"} {milestone.level} {!isUnlocked && `· ${milestone.description}`}
        </Text>
      </Box>
      {isUnlocked && (
        <Text fontSize="xs" lineHeight="1">{"🎁"}</Text>
      )}
    </Flex>
  );
}

export default function AchievementsPage({ onBack }) {
  const unlocked = useAchievements((s) => s.unlocked);
  const progress = useAchievements((s) => s.progress);
  const unlockedFeatures = useAchievements((s) => s.unlockedFeatures);
  const level = useRewards((s) => s.level);
  const sparks = useRewards((s) => s.sparks);
  const streakDays = useRewards((s) => s.streakDays);

  // All categories and milestones collapsed by default
  const [expandedCats, setExpandedCats] = useState({});
  const [milestonesExpanded, setMilestonesExpanded] = useState(false);

  const unlockedSet = new Set(unlocked);
  const totalAchievements = ACHIEVEMENTS.length;
  const unlockedCount = unlocked.length;

  // Last 5 unlocked (most recent first)
  const recentIds = useMemo(() => {
    return unlocked.slice(-5).reverse();
  }, [unlocked]);

  // Group achievements by category, unlocked first within each category
  const grouped = useMemo(() => {
    const result = {};
    for (const cat of Object.keys(ACHIEVEMENT_CATEGORIES)) {
      const catAchievements = ACHIEVEMENTS.filter((a) => a.category === cat);
      result[cat] = [...catAchievements].sort((a, b) => {
        const aUnlocked = unlockedSet.has(a.id) ? 0 : 1;
        const bUnlocked = unlockedSet.has(b.id) ? 0 : 1;
        return aUnlocked - bUnlocked;
      });
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

  const isFeatureUnlocked = (milestone) => {
    const features = unlockedFeatures[milestone.feature] || [];
    return features.includes(milestone.value);
  };

  const overallPct = totalAchievements > 0 ? Math.round((unlockedCount / totalAchievements) * 100) : 0;

  return (
    <Box
      maxW="480px"
      mx="auto"
      px={{ base: "1", md: "2" }}
      py={{ base: "2", md: "4" }}
      pb={{ base: "16", md: "4" }}
    >
      {/* Header */}
      <Flex align="center" gap={3} mb={4}>
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
            {"Gablotka"}
          </Text>
          <Text fontSize="xs" color="gray.400">
            {"Twoje osiągnięcia i nagrody"}
          </Text>
        </Box>
      </Flex>

      {/* Summary header */}
      <SummaryHeader
        level={level}
        sparks={sparks}
        streakDays={streakDays}
        unlockedCount={unlockedCount}
        totalCount={totalAchievements}
        maxStreak={progress.max_streak || 0}
      />

      {/* Overall progress bar */}
      <Box
        bg="white"
        borderRadius="2xl"
        p={4}
        mb={5}
        shadow="0 1px 8px 0 rgba(0,0,0,0.04)"
        borderWidth="1px"
        borderColor="gray.100"
      >
        <Flex justify="space-between" align="center" mb={2}>
          <Text fontSize="sm" fontWeight="600" color="textSecondary">
            {"Postęp kolekcji"}
          </Text>
          <Text fontSize="sm" fontWeight="700" color="rose.400">
            {overallPct}%
          </Text>
        </Flex>
        <Box bg="gray.100" borderRadius="full" h="6px" overflow="hidden">
          <Box
            h="100%"
            borderRadius="full"
            minW={overallPct > 0 ? "24px" : "0px"}
            transition="width 0.6s cubic-bezier(0.22, 1, 0.36, 1)"
            style={{
              width: `${overallPct}%`,
              background: "linear-gradient(90deg, #FCC2D7, #F9915E)",
            }}
          />
        </Box>
      </Box>

      {/* Recently unlocked */}
      <RecentlyUnlocked recentIds={recentIds} />

      {/* Achievement categories — collapsed by default */}
      <Box mb={5}>
        <Flex align="center" gap={2} mb={3} px={1}>
          <Icon as={LuAward} boxSize={4} color="rose.300" />
          <Text fontSize="sm" fontWeight="700" color="textSecondary">
            {"Osiągnięcia"}
          </Text>
        </Flex>
        {Object.entries(grouped).map(([catKey, achievements]) => (
          <CategorySection
            key={catKey}
            catKey={catKey}
            catInfo={ACHIEVEMENT_CATEGORIES[catKey]}
            achievements={achievements}
            unlockedSet={unlockedSet}
            progress={progress}
            isExpanded={!!expandedCats[catKey]}
            onToggle={() => setExpandedCats((prev) => ({ ...prev, [catKey]: !prev[catKey] }))}
          />
        ))}
      </Box>

      {/* Level milestones — collapsible */}
      <Box mb={5}>
        <Flex
          as="button"
          align="center"
          gap={2}
          px={3}
          py={2.5}
          w="full"
          cursor="pointer"
          borderRadius="xl"
          bg="white"
          borderWidth="1px"
          borderColor={milestonesExpanded ? "rose.200" : "gray.100"}
          shadow="0 1px 8px 0 rgba(0,0,0,0.04)"
          transition="all 0.2s"
          _hover={{ borderColor: "rose.200" }}
          onClick={() => setMilestonesExpanded((v) => !v)}
        >
          <Text fontSize="md" lineHeight="1">{"⭐"}</Text>
          <Text fontSize="sm" fontWeight="700" color="textSecondary" flex={1} textAlign="left">
            {"Nagrody za poziom"}
          </Text>
          <Text fontSize="xs" color="gray.400" mr={1}>
            {LEVEL_MILESTONES.filter((m) => isFeatureUnlocked(m)).length}/{LEVEL_MILESTONES.length}
          </Text>
          <Icon
            as={LuChevronDown}
            boxSize={4}
            color="gray.400"
            transition="transform 0.2s"
            transform={milestonesExpanded ? "rotate(180deg)" : "rotate(0deg)"}
          />
        </Flex>

        {milestonesExpanded && (
          <VStack gap={2} align="stretch" mt={2} className="sm-expand-in">
            {LEVEL_MILESTONES.map((milestone, idx) => (
              <FeatureUnlock
                key={`${milestone.level}-${milestone.feature}-${idx}`}
                milestone={milestone}
                isUnlocked={isFeatureUnlocked(milestone)}
              />
            ))}
          </VStack>
        )}
      </Box>
    </Box>
  );
}
