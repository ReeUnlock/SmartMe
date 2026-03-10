import { useState, useCallback, useRef } from "react";
import { Box, Flex, Text, Icon, VStack } from "@chakra-ui/react";
import { LuArrowLeft, LuLock, LuCheck, LuSparkles } from "react-icons/lu";
import useRewards from "../../hooks/useRewards";
import AVATAR_CONFIG, { getSelectedAvatar, saveSelectedAvatar } from "./avatarConfig";

// ─── Local micro-feedback ───────────────────────────────────────
const PAGE_STYLES = `
  @keyframes avSelectPulse {
    0% { transform: scale(1); box-shadow: 0 4px 20px 0 rgba(244,143,177,0.15); }
    40% { transform: scale(1.015); box-shadow: 0 6px 28px 0 rgba(244,143,177,0.22); }
    100% { transform: scale(1); box-shadow: 0 4px 20px 0 rgba(244,143,177,0.15); }
  }
  @keyframes avBadgeIn {
    0% { opacity: 0; transform: scale(0.6); }
    60% { opacity: 1; transform: scale(1.1); }
    100% { opacity: 1; transform: scale(1); }
  }
`;

// Per-avatar accent colors for visual variety
const THEME_ACCENTS = {
  sol: { ring: "rgba(253,208,177,0.25)", glow: "rgba(253,208,177,0.12)", gradient: "#FDD0B1, #FFE0B2" },
  nox: { ring: "rgba(195,177,225,0.25)", glow: "rgba(232,191,232,0.12)", gradient: "#C3B1E1, #E8D5F5" },
  bloom: { ring: "rgba(244,143,177,0.2)", glow: "rgba(252,194,215,0.1)", gradient: "#FCC2D7, #F8BBD0" },
  aura: { ring: "rgba(195,177,225,0.25)", glow: "rgba(200,180,230,0.12)", gradient: "#C3B1E1, #D1C4E9" },
};

function AvatarPreviewCard({ config, level, isSelected, onSelect, justSelected }) {
  const isUnlocked = level >= config.requiredLevel;
  const accent = THEME_ACCENTS[config.key] || THEME_ACCENTS.sol;

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      shadow={isSelected
        ? "0 4px 20px 0 rgba(244,143,177,0.15)"
        : "0 1px 8px 0 rgba(0,0,0,0.04)"}
      borderWidth={isSelected ? "2px" : "1px"}
      borderColor={isSelected ? "rose.200" : "gray.100"}
      p={5}
      position="relative"
      overflow="hidden"
      transition="all 0.35s cubic-bezier(0.22, 1, 0.36, 1)"
      _hover={isUnlocked && !isSelected ? {
        shadow: "0 4px 16px 0 rgba(0,0,0,0.06)",
        borderColor: "rose.100",
        transform: "translateY(-1px)",
      } : {}}
      style={justSelected ? { animation: "avSelectPulse 0.5s ease-out" } : undefined}
    >
      {/* Selected badge */}
      {isSelected && (
        <Flex
          position="absolute"
          top={3}
          right={3}
          align="center"
          gap={1}
          px={2.5}
          py={1}
          borderRadius="full"
          style={{
            background: `linear-gradient(135deg, ${accent.gradient})`,
            animation: justSelected ? "avBadgeIn 0.4s cubic-bezier(0.22, 1, 0.36, 1)" : "none",
          }}
          zIndex={2}
        >
          <Icon as={LuCheck} boxSize={3} color="white" strokeWidth={3} />
          <Text fontSize="2xs" fontWeight="700" color="white" letterSpacing="0.03em">
            {"Aktywna"}
          </Text>
        </Flex>
      )}

      {/* Lock badge */}
      {!isUnlocked && (
        <Flex
          position="absolute"
          top={3}
          right={3}
          align="center"
          gap={1}
          px={2.5}
          py={1}
          borderRadius="full"
          bg="gray.100"
          zIndex={2}
        >
          <Icon as={LuLock} boxSize={3} color="gray.400" />
          <Text fontSize="2xs" fontWeight="600" color="gray.400">
            {"Poz. "}{config.requiredLevel}
          </Text>
        </Flex>
      )}

      {/* Avatar preview area */}
      <Flex
        justify="center"
        align="center"
        py={5}
        mb={4}
        borderRadius="2xl"
        position="relative"
        style={{
          background: isUnlocked
            ? `linear-gradient(180deg, ${accent.glow}, rgba(255,255,255,0))`
            : "linear-gradient(180deg, rgba(247,247,248,0.8), rgba(240,240,242,0.4))",
          filter: isUnlocked ? "none" : "grayscale(0.75) brightness(1.05)",
        }}
      >
        {/* Subtle glow ring behind active avatar */}
        {isSelected && (
          <Box
            position="absolute"
            top="50%"
            left="50%"
            w="160px"
            h="160px"
            borderRadius="full"
            pointerEvents="none"
            style={{
              transform: "translate(-50%, -50%)",
              background: `radial-gradient(circle, ${accent.ring} 0%, transparent 70%)`,
            }}
          />
        )}

        <Box
          transform="scale(0.72)"
          transformOrigin="center"
          pointerEvents="none"
          position="relative"
        >
          <config.component
            phase="idle"
            showTapParticles={false}
            onTap={() => {}}
          />
        </Box>
      </Flex>

      {/* Avatar info */}
      <Box mb={3.5}>
        <Flex align="center" gap={2} mb={1}>
          <Text fontSize="lg" lineHeight="1">{config.icon}</Text>
          <Text fontSize="md" fontWeight="700" color={isUnlocked ? "textSecondary" : "gray.400"}>
            {config.name}
          </Text>
        </Flex>
        <Text
          fontSize="sm"
          color={isUnlocked ? "gray.500" : "gray.400"}
          lineHeight="1.6"
          fontStyle={isUnlocked ? "normal" : "italic"}
        >
          {config.description}
        </Text>
      </Box>

      {/* Action area */}
      {isUnlocked && !isSelected && (
        <Flex
          as="button"
          align="center"
          justify="center"
          gap={1.5}
          w="full"
          py={2.5}
          borderRadius="xl"
          fontWeight="700"
          fontSize="sm"
          color="white"
          cursor="pointer"
          transition="all 0.2s cubic-bezier(0.22, 1, 0.36, 1)"
          _hover={{ transform: "scale(1.02)", shadow: "0 4px 16px rgba(244,115,64,0.2)" }}
          _active={{ transform: "scale(0.97)" }}
          style={{
            background: "linear-gradient(135deg, #FAA2C1, #F9915E)",
          }}
          onClick={() => onSelect(config.key)}
        >
          <Icon as={LuSparkles} boxSize={3.5} />
          {"Wybierz"}
        </Flex>
      )}

      {isSelected && (
        <Flex
          align="center"
          justify="center"
          gap={1.5}
          w="full"
          py={2.5}
          borderRadius="xl"
          fontWeight="700"
          fontSize="sm"
          color="rose.400"
          bg="rose.50"
          borderWidth="1px"
          borderColor="rose.100"
        >
          <Icon as={LuCheck} boxSize={3.5} strokeWidth={3} />
          {"Twoja posta\u0107"}
        </Flex>
      )}

      {!isUnlocked && (
        <Flex
          align="center"
          justify="center"
          gap={1.5}
          w="full"
          py={2.5}
          borderRadius="xl"
          fontWeight="600"
          fontSize="sm"
          color="gray.400"
          bg="gray.50"
          borderWidth="1px"
          borderColor="gray.100"
        >
          <Icon as={LuLock} boxSize={3.5} />
          {"Odblokuj na poziomie "}{config.requiredLevel}
        </Flex>
      )}
    </Box>
  );
}

export default function AvatarSelectionPage({ onBack }) {
  const level = useRewards((s) => s.level);
  const [selected, setSelected] = useState(() => getSelectedAvatar(level));
  const [justSelectedKey, setJustSelectedKey] = useState(null);
  const timerRef = useRef(null);

  const handleSelect = useCallback((key) => {
    saveSelectedAvatar(key);
    setSelected(key);
    setJustSelectedKey(key);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setJustSelectedKey(null), 600);
  }, []);

  const unlockedCount = AVATAR_CONFIG.filter((a) => level >= a.requiredLevel).length;
  const totalCount = AVATAR_CONFIG.length;
  const progressPct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <Box
      maxW="480px"
      mx="auto"
      px={{ base: "1", md: "2" }}
      py={{ base: "2", md: "4" }}
      pb={{ base: "16", md: "4" }}
    >
      <style>{PAGE_STYLES}</style>

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
            {"Twoje postacie"}
          </Text>
          <Text fontSize="xs" color="gray.400">
            {"Wybierz swoj\u0105 posta\u0107 afirmacji"}
          </Text>
        </Box>
      </Flex>

      {/* Collection summary */}
      <Box
        borderRadius="2xl"
        p={4}
        mb={6}
        style={{
          background: "linear-gradient(135deg, rgba(252,194,215,0.1), rgba(232,191,232,0.08))",
        }}
        borderWidth="1px"
        borderColor="rose.100"
      >
        <Flex justify="space-between" align="center" mb={2.5}>
          <Flex align="center" gap={2}>
            <Icon as={LuSparkles} boxSize={4} color="rose.300" />
            <Text fontSize="sm" fontWeight="600" color="textSecondary">
              {"Kolekcja postaci"}
            </Text>
          </Flex>
          <Text fontSize="sm" fontWeight="700" color="rose.400">
            {unlockedCount}/{totalCount}
          </Text>
        </Flex>

        {/* Collection progress bar */}
        <Box bg="rose.50" borderRadius="full" h="5px" overflow="hidden">
          <Box
            h="100%"
            borderRadius="full"
            transition="width 0.6s cubic-bezier(0.22, 1, 0.36, 1)"
            style={{
              width: `${progressPct}%`,
              background: "linear-gradient(90deg, #FCC2D7, #F9915E)",
            }}
          />
        </Box>

        {unlockedCount < totalCount && (
          <Text fontSize="xs" color="gray.400" mt={2}>
            {"Zdobywaj poziomy, aby odblokowa\u0107 nowe postacie"}
          </Text>
        )}
      </Box>

      {/* Avatar gallery */}
      <VStack gap={5} align="stretch">
        {AVATAR_CONFIG.map((config) => (
          <AvatarPreviewCard
            key={config.key}
            config={config}
            level={level}
            isSelected={selected === config.key}
            justSelected={justSelectedKey === config.key}
            onSelect={handleSelect}
          />
        ))}
      </VStack>
    </Box>
  );
}
