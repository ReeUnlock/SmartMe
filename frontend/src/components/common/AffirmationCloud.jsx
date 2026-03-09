import { useState, useEffect, useCallback } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";

const AFFIRMATIONS = [
  "Zasługujesz na wszystko, co piękne",
  "Jesteś silniejsza, niż myślisz",
  "Każdy dzień to nowy początek",
  "Twoja energia przyciąga cudowne rzeczy",
  "Jesteś dokładnie tam, gdzie powinnaś być",
  "Wierzę w Ciebie — Ty też w siebie uwierz",
  "Małe kroki prowadzą do wielkich zmian",
  "Twoje marzenia są ważne i realne",
  "Pozwól sobie na odpoczynek — zasługujesz na niego",
  "Jesteś wystarczająca, dokładnie taka jaka jesteś",
  "Odwaga nie oznacza braku strachu — oznacza działanie mimo niego",
  "Twoja historia jest piękna i wciąż się pisze",
  "Dzisiaj jest dobry dzień na dobry dzień",
  "Masz w sobie światło, które oświetla innych",
  "Każde wyzwanie czyni Cię mądrzejszą",
  "Zasługujesz na miłość, którą dajesz innym",
  "Twoje uczucia są ważne i zasługują na uwagę",
  "Nie musisz być idealna, żeby być wspaniała",
  "Jutro będzie lepsze, bo Ty w nim będziesz",
  "Jesteś autorką swojego życia — pisz piękną historię",
  "Twoja delikatność to siła, nie słabość",
  "Pozwól sobie marzyć bez ograniczeń",
  "Jesteś ważna dla ludzi wokół siebie",
  "Każdy oddech to szansa na nowy start",
  "Twoja intuicja Cię nie zawodzi — ufaj jej",
  "Robisz postępy, nawet jeśli ich nie widzisz",
  "Zasługujesz na przestrzeń, którą zajmujesz",
  "Twoja wrażliwość to dar, nie obciążenie",
  "Cierpliwość wobec siebie to forma miłości",
  "Jesteś inspiracją dla kogoś, kto Cię obserwuje",
  "Nie porównuj swojego rozdziału 1 z czyimś rozdziałem 20",
  "Twoje granice są zdrowe i potrzebne",
  "Każdy zachód słońca oznacza, że przetrwałaś kolejny dzień",
  "Masz prawo do radości bez poczucia winy",
  "Twoje ciało jest Twoim domem — bądź dla niego dobra",
  "Jesteś jedyna w swoim rodzaju i to jest Twoja supermoc",
  "Wdzięczność zmienia perspektywę — i zmienia życie",
  "Nie musisz mieć wszystkiego poukładanego, żeby iść dalej",
  "Twój uśmiech potrafi rozjaśnić czyjś dzień",
  "Zasługujesz na chwilę spokoju — weź ją teraz",
  "Jesteś odważniejsza, niż Ci się wydaje",
  'Twoje „nie" jest tak samo ważne jak Twoje „tak"',
  "Każdy błąd to lekcja, nie porażka",
  "Masz prawo zmieniać zdanie i zmieniać kierunek",
  "Twoja obecność czyni świat lepszym miejscem",
  "Nie musisz się spieszyć — Twoje tempo jest właściwe",
  "Jesteś otoczona możliwościami — otwórz oczy",
  "Zasługujesz na relacje, które Cię budują",
  "Twoja siła rośnie z każdym dniem",
  "Pamiętaj — po każdej burzy wychodzi słońce",
];

const EMOJIS = ["💕", "💗", "😘", "💖", "🥰", "💞", "😽", "💓", "💝", "💋"];

function getRandomAffirmation() {
  const text = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
  const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  return `${text} ${emoji}`;
}

// Cloud shape morphing — 5 organic blob keyframes via SVG path animation
function CloudSvg() {
  return (
    <svg viewBox="0 0 220 140" width="220" height="140">
      <defs>
        <linearGradient id="cloudGradBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D0EBFF" />
          <stop offset="40%" stopColor="#A5D8FF" />
          <stop offset="100%" stopColor="#74C0FC" />
        </linearGradient>
        <filter id="cloudSoftShadow" x="-15%" y="-15%" width="130%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
          <feOffset dy="4" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.15" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path fill="url(#cloudGradBlue)" filter="url(#cloudSoftShadow)">
        <animate
          attributeName="d"
          dur="8s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
          values="
            M55,115 Q15,112 16,82 Q14,55 42,48 Q38,22 68,17 Q95,10 115,28 Q130,8 155,18 Q185,28 184,58 Q200,62 195,84 Q190,112 158,115 Z;
            M52,117 Q10,115 14,78 Q12,50 38,44 Q32,18 65,14 Q92,7 118,25 Q135,5 160,15 Q190,24 188,55 Q205,58 198,82 Q194,114 160,117 Z;
            M58,113 Q18,108 20,80 Q18,58 45,52 Q42,28 72,20 Q98,14 112,32 Q128,12 152,22 Q180,32 180,60 Q196,65 192,86 Q186,110 155,113 Z;
            M50,118 Q12,116 15,84 Q10,52 40,46 Q35,20 66,16 Q94,8 116,26 Q132,6 158,16 Q188,26 186,56 Q203,60 197,83 Q192,115 162,118 Z;
            M55,115 Q15,112 16,82 Q14,55 42,48 Q38,22 68,17 Q95,10 115,28 Q130,8 155,18 Q185,28 184,58 Q200,62 195,84 Q190,112 158,115 Z
          "
        />
      </path>
    </svg>
  );
}

export default function AffirmationCloud() {
  const [phase, setPhase] = useState("idle"); // idle | counting | reveal
  const [count, setCount] = useState(5);
  const [affirmation, setAffirmation] = useState("");

  const startCountdown = useCallback(() => {
    if (phase !== "idle") return;
    setPhase("counting");
    setCount(5);
  }, [phase]);

  useEffect(() => {
    if (phase !== "counting") return;
    if (count <= 0) {
      setAffirmation(getRandomAffirmation());
      setPhase("reveal");
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, count]);

  const handleClose = () => {
    setPhase("idle");
    setCount(5);
  };

  return (
    <>
      <style>{`
        @keyframes cloudGlowBlue {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(116,192,252,0.15)); }
          33% { filter: drop-shadow(0 0 18px rgba(116,192,252,0.3)); }
          66% { filter: drop-shadow(0 0 14px rgba(165,216,255,0.25)); }
        }
        @keyframes countSlideIn {
          0% { transform: scale(0.3) translateY(8px); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes breatheBlue {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 12px rgba(116,192,252,0.3)); }
          50% { transform: scale(1.06); filter: drop-shadow(0 0 22px rgba(116,192,252,0.45)); }
        }
        @keyframes revealBackdrop {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes revealCard {
          0% { transform: scale(0.6) translateY(30px); opacity: 0; }
          50% { transform: scale(1.03); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes shimmerBlue {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        @keyframes countPulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Cloud */}
      <Box
        position="relative"
        cursor={phase === "idle" ? "pointer" : "default"}
        onClick={startCountdown}
        style={{
          animation: phase === "idle"
            ? "cloudGlowBlue 5s ease-in-out infinite"
            : phase === "counting"
              ? "breatheBlue 1s ease-in-out infinite"
              : "none",
        }}
        userSelect="none"
        mb={5}
      >
        <CloudSvg />

        {/* Idle label */}
        {phase === "idle" && (
          <Flex position="absolute" inset={0} align="center" justify="center" pb={1}>
            <Text
              fontSize="sm"
              fontWeight="700"
              color="white"
              textShadow="0 1px 4px rgba(34,100,180,0.35)"
              letterSpacing="0.02em"
            >
              {"Kliknij mnie 😊"}
            </Text>
          </Flex>
        )}

        {/* Countdown */}
        {phase === "counting" && (
          <Flex position="absolute" inset={0} align="center" justify="center" pb={1}>
            <Text
              key={count}
              fontSize="3xl"
              fontWeight="800"
              color="white"
              textShadow="0 2px 8px rgba(34,100,180,0.4)"
              style={{ animation: "countSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
            >
              {count}
            </Text>
          </Flex>
        )}

        {/* Post-countdown sparkle */}
        {phase === "reveal" && (
          <Flex position="absolute" inset={0} align="center" justify="center" pb={1}>
            <Text fontSize="xl" style={{ animation: "countPulse 0.6s ease-in-out" }}>
              {"✨"}
            </Text>
          </Flex>
        )}
      </Box>

      {/* Affirmation popup */}
      {phase === "reveal" && (
        <Box
          position="fixed"
          inset={0}
          zIndex={3000}
          display="flex"
          alignItems="center"
          justifyContent="center"
          style={{ animation: "revealBackdrop 0.4s ease-out" }}
        >
          <Box
            position="absolute"
            inset={0}
            bg="blackAlpha.500"
            backdropFilter="blur(6px)"
            onClick={handleClose}
          />

          {/* Sparkles */}
          {[...Array(6)].map((_, i) => (
            <Text
              key={i}
              position="absolute"
              fontSize={["lg", "xl", "2xl"][i % 3]}
              style={{
                top: `${20 + Math.random() * 60}%`,
                left: `${10 + Math.random() * 80}%`,
                animation: `sparkle ${1.5 + Math.random()}s ease-in-out ${Math.random() * 0.8}s infinite`,
              }}
            >
              {"✨"}
            </Text>
          ))}

          {/* Card */}
          <Box
            position="relative"
            zIndex={1}
            bg="white"
            borderRadius="3xl"
            px={{ base: 7, md: 10 }}
            py={{ base: 8, md: 10 }}
            mx={4}
            maxW="380px"
            w="90%"
            textAlign="center"
            shadow="0 20px 60px rgba(51,154,240,0.2)"
            style={{ animation: "revealCard 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          >
            {/* Top gradient bar */}
            <Box
              position="absolute"
              top={0}
              left="50%"
              transform="translateX(-50%)"
              w="60%"
              h="4px"
              borderRadius="full"
              style={{
                background: "linear-gradient(90deg, #D0EBFF, #74C0FC, #339AF0, #74C0FC, #D0EBFF)",
                backgroundSize: "200% auto",
                animation: "shimmerBlue 3s linear infinite",
              }}
            />

            <Text fontSize="3xl" mb={3}>{"🌸"}</Text>

            <Text
              fontSize={{ base: "lg", md: "xl" }}
              fontWeight="700"
              color="sky.700"
              lineHeight="1.5"
              fontFamily="'Nunito', sans-serif"
              mb={5}
            >
              {affirmation}
            </Text>

            <Flex
              as="button"
              align="center"
              justify="center"
              mx="auto"
              px={6}
              py={2.5}
              borderRadius="full"
              fontWeight="600"
              fontSize="sm"
              color="white"
              cursor="pointer"
              transition="all 0.2s"
              _hover={{ transform: "scale(1.05)" }}
              _active={{ transform: "scale(0.97)" }}
              style={{
                background: "linear-gradient(135deg, #74C0FC, #339AF0)",
              }}
              onClick={handleClose}
            >
              {"Dziękuję ✨"}
            </Flex>
          </Box>
        </Box>
      )}
    </>
  );
}
