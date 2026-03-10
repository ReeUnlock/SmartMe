import { useState } from "react";
import { Box, Flex, Text, Heading } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import useRewards from "../../hooks/useRewards";

const GREETINGS = [
  "Dzień dobry",
  "Cześć Piękna",
  "Hej Słoneczko",
  "Witaj Gwiazdo",
  "Dobrego dnia",
  "Miłego dnia",
  "Hej Kochana",
  "Cześć Kochana",
  "Witaj Piękna",
  "Hej Gwiazdo",
];

const EMOJIS = ["☀️", "✨", "🌸", "🌷", "💛", "💖", "⭐", "🌼", "🌺"];

const BADGE_PULSE = `
  @keyframes badgePulse {
    0%, 85% { transform: scale(1); }
    90% { transform: scale(1.05); }
    95% { transform: scale(1); }
    100% { transform: scale(1); }
  }
`;

function getDateString() {
  return new Date().toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function DashboardGreeting() {
  const [greeting] = useState(() => `${pickRandom(GREETINGS)} ${pickRandom(EMOJIS)}`);
  const navigate = useNavigate();
  const level = useRewards((s) => s.level);

  return (
    <Flex align="center" justify="space-between" px={1} pt={2} pb={1}>
      <style>{BADGE_PULSE}</style>
      <Box>
        <Text
          fontSize="xs"
          fontWeight="600"
          color="gray.500"
          textTransform="capitalize"
          letterSpacing="0.04em"
          mb={1}
        >
          {getDateString()}
        </Text>
        <Heading
          as="h1"
          fontSize={{ base: "xl", md: "2xl" }}
          fontFamily="'Nunito', sans-serif"
          fontWeight="800"
          color="textPrimary"
          lineHeight="1.3"
          whiteSpace="nowrap"
        >
          {greeting}
        </Heading>
      </Box>

      {/* Level badge — navigates to /odznaki */}
      <Flex
        align="center"
        gap={1.5}
        cursor="pointer"
        onClick={() => navigate("/odznaki")}
        _hover={{ opacity: 0.85 }}
        _active={{ transform: "scale(0.95)" }}
        transition="all 0.2s"
        style={{ animation: "badgePulse 3.5s ease-in-out infinite" }}
      >
        <Flex
          align="center"
          justify="center"
          w="40px"
          h="40px"
          borderRadius="full"
          position="relative"
          style={{
            background: "linear-gradient(135deg, #FCC2D7 0%, #F9915E 100%)",
            boxShadow: "0 2px 12px rgba(249,145,94,0.25), inset 0 1px 2px rgba(255,255,255,0.3)",
          }}
        >
          {/* Inner ring */}
          <Box
            position="absolute"
            inset="3px"
            borderRadius="full"
            borderWidth="1.5px"
            borderColor="rgba(255,255,255,0.4)"
          />
          <Text fontSize="md" fontWeight="800" color="white" lineHeight="1">
            {level}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
}
