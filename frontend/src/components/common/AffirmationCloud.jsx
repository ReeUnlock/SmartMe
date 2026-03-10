import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import { createPortal } from "react-dom";
import { Box, Flex, Text } from "@chakra-ui/react";
import useRewards from "../../hooks/useRewards";
import useAchievements from "../../hooks/useAchievements";
import useChallenges from "../../hooks/useChallenges";
import useCelebration from "../../hooks/useCelebration";

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
  "Jesteś wystarczająca taka, jaka jesteś dziś",
  "Twoja wartość nie zależy od opinii innych",
  "Masz prawo stawiać granice",
  "Twoje potrzeby są ważne",
  "Możesz zmieniać zdanie i nadal być sobą",
  "Twoje tempo jest właściwe",
  "Możesz ufać sobie coraz bardziej",
  "Masz w sobie więcej siły, niż czasem widzisz",
  "Nie musisz być idealna, żeby być wartościowa",
  "Zasługujesz na szacunek i spokój",
  "Możesz dbać o siebie bez poczucia winy",
  "Twoje emocje mają znaczenie",
  "Masz prawo odpoczywać",
  'Możesz mówić „nie" bez tłumaczenia się',
  "Twoja wrażliwość jest częścią Twojej siły",
  "Możesz dawać sobie czas na rozwój",
  "Nie musisz nikomu udowadniać swojej wartości",
  "Możesz zaczynać od nowa tyle razy, ile potrzebujesz",
  "Twoja intuicja jest ważnym głosem",
  "Możesz wybierać to, co jest dla Ciebie dobre",
  "Twoja przeszłość nie musi decydować o Twojej przyszłości",
  "Możesz traktować siebie z większą życzliwością",
  "Twoje granice chronią Twój spokój",
  "Możesz być jednocześnie silna i wrażliwa",
  "Zasługujesz na relacje oparte na szacunku",
  "Jesteś ważną osobą w swoim własnym życiu",
  "Masz wpływ na kierunek, w którym idziesz",
  "Twoje ciało zasługuje na troskę",
  "Jesteś kimś więcej niż Twoje błędy",
  "Możesz ufać swoim decyzjom",
  "Masz prawo iść własną drogą",
  "Twoja wartość nie zależy od tego, ile robisz",
  "Możesz odnajdywać spokój nawet w trudnych chwilach",
  "Możesz dawać sobie przestrzeń na zmianę",
  "Jesteś wystarczająco dobra już teraz",
  "Twoje życie nie musi wyglądać jak życie innych",
  "Zasługujesz na spokój w głowie",
  "Twoje uczucia są ważnym sygnałem",
  "Możesz być dumna z małych kroków",
  "Jesteś w procesie i to jest w porządku",
  "Twoja obecność ma znaczenie",
  "Możesz chronić swoją energię",
  "Nie musisz być wszystkim dla wszystkich",
  "Możesz wybierać siebie bez poczucia winy",
  "Twoje granice są wyrazem szacunku do samej siebie",
  "Jesteś wystarczająca nawet w trudniejsze dni",
  "Możesz ufać swojej wewnętrznej mądrości",
  "Każdy dzień daje Ci nową możliwość",
  "Zasługujesz na troskę — także własną",
  "Jesteś ważna",
];

const EMOJIS = ["💕", "💗", "😘", "💖", "🥰", "💞", "😽", "💓", "💝", "💋"];

function getRandomAffirmation() {
  const text = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
  const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  return `${text} ${emoji}`;
}

// Stable positions for decorative elements — hearts + stars, placed around edges
function useDecoPositions() {
  return useMemo(() => {
    const items = [
      // Top area
      { top: "5%",  left: "8%",  size: 48, drift: -15, rotate: 20,  type: "heart" },
      { top: "8%",  left: "78%", size: 34, drift: 12,  rotate: -15, type: "star" },
      { top: "15%", left: "55%", size: 28, drift: -8,  rotate: 25,  type: "star" },
      // Left side
      { top: "35%", left: "2%",  size: 52, drift: -20, rotate: -12, type: "heart" },
      { top: "55%", left: "5%",  size: 30, drift: 10,  rotate: 18,  type: "star" },
      // Right side
      { top: "40%", left: "85%", size: 44, drift: 18,  rotate: -22, type: "heart" },
      { top: "60%", left: "82%", size: 26, drift: -14, rotate: 15,  type: "star" },
      // Bottom area
      { top: "78%", left: "12%", size: 42, drift: -10, rotate: -18, type: "heart" },
      { top: "82%", left: "70%", size: 56, drift: 16,  rotate: 10,  type: "heart" },
      { top: "88%", left: "42%", size: 30, drift: -6,  rotate: -25, type: "star" },
    ];
    return items.map((item, i) => ({
      ...item,
      delay: (i * 0.35 + (i % 3) * 0.2).toFixed(2),
      dur: (4.5 + (i % 4) * 0.8).toFixed(1),
    }));
  }, []);
}

function CloudSvg() {
  return (
    <svg viewBox="0 0 240 160" width="220" height="144">
      <defs>
        <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5C4B8" />
          <stop offset="22%" stopColor="#F0A8C0" />
          <stop offset="48%" stopColor="#E893B2" />
          <stop offset="68%" stopColor="#D8A8D8" />
          <stop offset="100%" stopColor="#F2BFA0" />
        </linearGradient>
        <linearGradient id="cloudGradInner" x1="30%" y1="15%" x2="70%" y2="85%">
          <stop offset="0%" stopColor="rgba(255,230,240,0.25)" />
          <stop offset="50%" stopColor="rgba(255,220,235,0.12)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <radialGradient id="cloudGlow" cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor="rgba(252,194,215,0.35)" />
          <stop offset="60%" stopColor="rgba(253,208,177,0.15)" />
          <stop offset="100%" stopColor="rgba(253,208,177,0)" />
        </radialGradient>
        <filter id="cloudShadow" x="-30%" y="-25%" width="160%" height="165%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="10" />
          <feOffset dy="6" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.16" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Ambient glow layer */}
      <ellipse cx="120" cy="90" rx="100" ry="60" fill="url(#cloudGlow)">
        <animate attributeName="rx" dur="6s" repeatCount="indefinite" values="100;106;100" />
        <animate attributeName="ry" dur="6s" repeatCount="indefinite" values="60;64;60" />
        <animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="1;0.7;1" />
      </ellipse>
      {/* Main blob */}
      <path fill="url(#cloudGrad)" filter="url(#cloudShadow)">
        <animate
          attributeName="d"
          dur="12s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.45 0.05 0.55 0.95; 0.4 0 0.6 1; 0.45 0.05 0.55 0.95; 0.4 0 0.6 1; 0.45 0.05 0.55 0.95; 0.4 0 0.6 1"
          values="
            M60,128 Q8,122 12,86 Q6,52 40,42 Q32,12 72,8 Q108,2 128,28 Q148,4 176,16 Q210,30 206,66 Q224,72 216,98 Q208,128 170,132 Q130,138 100,134 Z;
            M54,132 Q2,126 8,82 Q0,44 36,36 Q26,8 68,4 Q102,-4 132,22 Q156,-2 182,12 Q218,24 214,62 Q230,68 222,96 Q212,130 174,136 Q128,142 96,138 Z;
            M66,126 Q14,118 18,84 Q10,56 46,46 Q42,18 78,12 Q112,6 126,32 Q142,8 170,20 Q204,34 200,68 Q218,76 212,100 Q204,126 166,130 Q134,136 104,132 Z;
            M52,134 Q4,128 10,88 Q2,48 38,38 Q28,6 66,2 Q106,-2 130,26 Q152,0 180,14 Q216,28 210,64 Q228,74 220,98 Q210,132 172,138 Q126,144 98,136 Z;
            M68,124 Q16,116 20,82 Q12,54 48,44 Q38,16 76,10 Q110,4 130,30 Q146,6 174,18 Q208,32 204,66 Q222,74 214,100 Q206,128 168,132 Q132,138 102,132 Z;
            M56,130 Q6,124 14,84 Q4,50 38,40 Q30,10 70,6 Q106,0 128,26 Q150,2 178,14 Q212,28 208,64 Q226,72 218,98 Q210,130 172,134 Q130,140 100,136 Z;
            M60,128 Q8,122 12,86 Q6,52 40,42 Q32,12 72,8 Q108,2 128,28 Q148,4 176,16 Q210,30 206,66 Q224,72 216,98 Q208,128 170,132 Q130,138 100,134 Z
          "
        />
      </path>
      {/* Inner highlight — adds depth */}
      <path fill="url(#cloudGradInner)">
        <animate
          attributeName="d"
          dur="12s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.45 0.05 0.55 0.95; 0.4 0 0.6 1; 0.45 0.05 0.55 0.95; 0.4 0 0.6 1; 0.45 0.05 0.55 0.95; 0.4 0 0.6 1"
          values="
            M80,110 Q38,104 42,78 Q40,56 62,50 Q58,30 84,26 Q108,22 118,40 Q132,24 152,32 Q178,40 176,62 Q188,66 184,82 Q180,106 154,110 Z;
            M76,114 Q32,108 38,76 Q34,50 58,44 Q52,24 80,20 Q106,16 120,36 Q136,20 158,28 Q182,36 180,60 Q192,64 188,82 Q182,110 156,114 Z;
            M84,108 Q42,100 46,76 Q42,58 64,52 Q62,34 88,28 Q112,24 120,42 Q130,26 150,34 Q174,44 172,64 Q186,68 182,84 Q176,108 152,110 Z;
            M74,116 Q34,110 40,78 Q36,52 60,44 Q54,22 82,18 Q108,14 122,38 Q138,22 160,30 Q184,38 182,62 Q194,66 190,84 Q184,112 158,116 Z;
            M86,106 Q44,98 48,74 Q44,56 66,50 Q60,32 86,26 Q112,22 122,40 Q134,24 154,32 Q176,42 174,64 Q188,68 184,84 Q178,108 154,110 Z;
            M78,112 Q36,106 42,76 Q36,52 60,46 Q56,26 84,22 Q110,18 120,38 Q134,22 156,30 Q180,38 178,62 Q192,66 186,82 Q180,110 156,114 Z;
            M80,110 Q38,104 42,78 Q40,56 62,50 Q58,30 84,26 Q108,22 118,40 Q132,24 152,32 Q178,40 176,62 Q188,66 184,82 Q180,106 154,110 Z
          "
        />
      </path>
    </svg>
  );
}

function HeartSvg({ size = 12, color = "#E63946" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function StarSvg({ size = 12, color = "#FFD700" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2l2.09 6.26L20.18 9l-5.09 3.74L16.18 19 12 15.77 7.82 19l1.09-6.26L3.82 9l6.09-.74z" />
    </svg>
  );
}

// Ambient sparkle positions around the cloud (idle state)
const AMBIENT_SPARKLES = [
  { top: "18%", left: "12%", delay: 0, dur: 4.2 },
  { top: "10%", left: "72%", delay: 1.8, dur: 3.6 },
  { top: "65%", left: "88%", delay: 3.1, dur: 4.8 },
  { top: "72%", left: "6%",  delay: 2.4, dur: 3.9 },
  { top: "30%", left: "90%", delay: 0.8, dur: 5.1 },
];

// Interaction particle config — released on tap
const TAP_PARTICLES = [
  { x: -35, y: -28, type: "heart", size: 14 },
  { x: 40,  y: -22, type: "star",  size: 12 },
  { x: -20, y: -40, type: "star",  size: 10 },
  { x: 30,  y: -38, type: "heart", size: 11 },
  { x: -45, y: -10, type: "star",  size: 9 },
  { x: 48,  y: -8,  type: "heart", size: 13 },
  { x: 0,   y: -48, type: "star",  size: 11 },
  { x: -30, y: 10,  type: "heart", size: 10 },
];

const OVERLAY_STYLES = `
  @keyframes affCloudFloat {
    0%   { transform: translateY(0) translateX(0) rotate(0deg) scale(1); }
    15%  { transform: translateY(-5px) translateX(2px) rotate(0.4deg) scale(1.008); }
    35%  { transform: translateY(-8px) translateX(-3px) rotate(-0.6deg) scale(1.015); }
    55%  { transform: translateY(-4px) translateX(4px) rotate(0.3deg) scale(1.005); }
    75%  { transform: translateY(-9px) translateX(-2px) rotate(-0.5deg) scale(1.012); }
    100% { transform: translateY(0) translateX(0) rotate(0deg) scale(1); }
  }
  @keyframes affCloudActivate {
    0%   { transform: scale(1); }
    20%  { transform: scale(0.92); }
    50%  { transform: scale(1.08); }
    75%  { transform: scale(1.03); }
    100% { transform: scale(1.02); }
  }
  @keyframes affDotPulse {
    0%, 80%, 100% { opacity: 0.25; transform: scale(0.8); }
    40% { opacity: 1; transform: scale(1); }
  }
  @keyframes affOverlayIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes affOverlayOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  @keyframes affCardIn {
    0% { opacity: 0; transform: scale(0.9) translateY(24px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes affCardOut {
    from { opacity: 1; transform: scale(1) translateY(0); }
    to { opacity: 0; transform: scale(0.95) translateY(12px); }
  }
  @keyframes affShimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes affFadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes affDecoFloat {
    0% { opacity: 0; transform: scale(0.4) translateY(20px) translateX(0) rotate(0deg); }
    15% { opacity: 0.7; transform: scale(0.85) translateY(6px) translateX(var(--drift)) rotate(calc(var(--rot) * 0.4)); }
    40% { opacity: 0.55; transform: scale(1) translateY(-12px) translateX(calc(var(--drift) * 0.6)) rotate(var(--rot)); }
    65% { opacity: 0.6; transform: scale(0.95) translateY(-22px) translateX(var(--drift)) rotate(calc(var(--rot) * 0.7)); }
    85% { opacity: 0.3; transform: scale(0.8) translateY(-32px) translateX(calc(var(--drift) * 0.4)) rotate(calc(var(--rot) * 1.1)); }
    100% { opacity: 0; transform: scale(0.5) translateY(-40px) translateX(0) rotate(var(--rot)); }
  }
  @keyframes affAmbientSparkle {
    0%, 100% { opacity: 0; transform: scale(0.5); }
    30% { opacity: 0.5; transform: scale(0.9); }
    50% { opacity: 0.7; transform: scale(1); }
    70% { opacity: 0.4; transform: scale(0.85); }
  }
  @keyframes affTapParticle {
    0% { opacity: 0; transform: translate(0, 0) scale(0.3) rotate(0deg); }
    20% { opacity: 0.9; transform: translate(calc(var(--px) * 0.4), calc(var(--py) * 0.4)) scale(1) rotate(calc(var(--pr) * 0.3)); }
    60% { opacity: 0.6; transform: translate(calc(var(--px) * 0.8), calc(var(--py) * 0.8)) scale(0.8) rotate(calc(var(--pr) * 0.7)); }
    100% { opacity: 0; transform: translate(var(--px), var(--py)) scale(0.3) rotate(var(--pr)); }
  }
  @keyframes affLabelFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-2px); }
  }
`;

const HEART_COLORS = ["#FF3B4D", "#E63946", "#FF4A5E"];
const STAR_COLORS = ["#FFD700", "#FFC857", "#FFDF6B"];

function AffirmationOverlay({ affirmation, closing, onClose }) {
  const decos = useDecoPositions();

  return createPortal(
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      zIndex={9999}
      display="flex"
      alignItems="center"
      justifyContent="center"
      style={{
        animation: closing
          ? "affOverlayOut 0.3s ease-in forwards"
          : "affOverlayIn 0.35s ease-out",
      }}
    >
      {/* Backdrop — warm tinted blur */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        onClick={onClose}
        style={{
          background: "rgba(253, 240, 235, 0.55)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      />

      {/* Decorative hearts & stars */}
      {decos.map((d, i) => (
        <Box
          key={i}
          position="absolute"
          top={d.top}
          left={d.left}
          pointerEvents="none"
          style={{
            "--drift": `${d.drift}px`,
            "--rot": `${d.rotate}deg`,
            animation: `affDecoFloat ${d.dur}s cubic-bezier(0.25, 0.1, 0.25, 1) ${d.delay}s infinite`,
            opacity: 0,
            willChange: "transform, opacity",
          }}
        >
          {d.type === "star" ? (
            <StarSvg size={d.size} color={STAR_COLORS[i % STAR_COLORS.length]} />
          ) : (
            <HeartSvg size={d.size} color={HEART_COLORS[i % HEART_COLORS.length]} />
          )}
        </Box>
      ))}

      {/* Card */}
      <Box
        position="relative"
        zIndex={1}
        borderRadius="32px"
        px={{ base: 7, md: 10 }}
        pt={{ base: 10, md: 12 }}
        pb={{ base: 8, md: 10 }}
        mx={5}
        maxW="360px"
        w="full"
        textAlign="center"
        style={{
          background: "linear-gradient(180deg, #FFFBF9 0%, #FFFFFF 100%)",
          boxShadow: "0 20px 60px rgba(231, 73, 128, 0.1), 0 4px 20px rgba(0,0,0,0.05)",
          animation: closing
            ? "affCardOut 0.3s ease-in forwards"
            : "affCardIn 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* Top shimmer accent */}
        <Box
          position="absolute"
          top="12px"
          left="50%"
          w="44px"
          h="3px"
          borderRadius="full"
          style={{
            transform: "translateX(-50%)",
            background: "linear-gradient(90deg, #FCC2D7, #FDD0B1, #FCC2D7)",
            backgroundSize: "200% auto",
            animation: "affShimmer 4s linear infinite",
          }}
        />

        {/* Decorative icon */}
        <Text
          fontSize="2xl"
          mb={4}
          lineHeight="1"
          style={{ animation: "affFadeUp 0.5s ease-out 0.12s both" }}
        >
          {"🌸"}
        </Text>

        {/* Affirmation text */}
        <Text
          fontSize={{ base: "md", md: "lg" }}
          fontWeight="600"
          color="textSecondary"
          lineHeight="1.75"
          fontFamily="'Nunito', sans-serif"
          mb={7}
          px={1}
          style={{ animation: "affFadeUp 0.5s ease-out 0.22s both" }}
        >
          {affirmation}
        </Text>

        {/* Close CTA */}
        <Box style={{ animation: "affFadeUp 0.5s ease-out 0.32s both" }}>
          <Flex
            as="button"
            align="center"
            justify="center"
            mx="auto"
            px={7}
            py={2.5}
            borderRadius="full"
            fontWeight="600"
            fontSize="sm"
            color="white"
            fontFamily="'Nunito', sans-serif"
            cursor="pointer"
            transition="all 0.2s"
            _hover={{ transform: "scale(1.04)", shadow: "0 6px 20px rgba(244,115,64,0.25)" }}
            _active={{ transform: "scale(0.97)" }}
            style={{
              background: "linear-gradient(135deg, #FAA2C1, #F9915E)",
            }}
            onClick={onClose}
          >
            {"Dziękuję ✨"}
          </Flex>
        </Box>
      </Box>
    </Box>,
    document.body,
  );
}

const AmbientSparkle = memo(function AmbientSparkle({ top, left, delay, dur }) {
  return (
    <Box
      position="absolute"
      top={top}
      left={left}
      w="4px"
      h="4px"
      borderRadius="full"
      pointerEvents="none"
      style={{
        background: "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(252,194,215,0.5) 60%, transparent 100%)",
        boxShadow: "0 0 6px rgba(252,194,215,0.4)",
        animation: `affAmbientSparkle ${dur}s ease-in-out ${delay}s infinite`,
        opacity: 0,
      }}
    />
  );
});

const TapParticles = memo(function TapParticles({ active }) {
  if (!active) return null;
  return (
    <>
      {TAP_PARTICLES.map((p, i) => {
        const rotation = (i % 2 === 0 ? 1 : -1) * (60 + i * 25);
        return (
          <Box
            key={i}
            position="absolute"
            top="50%"
            left="50%"
            pointerEvents="none"
            style={{
              "--px": `${p.x}px`,
              "--py": `${p.y}px`,
              "--pr": `${rotation}deg`,
              animation: `affTapParticle 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.04}s forwards`,
              opacity: 0,
            }}
          >
            {p.type === "heart" ? (
              <HeartSvg size={p.size} color={HEART_COLORS[i % HEART_COLORS.length]} />
            ) : (
              <StarSvg size={p.size} color={STAR_COLORS[i % STAR_COLORS.length]} />
            )}
          </Box>
        );
      })}
    </>
  );
});

export default function AffirmationCloud() {
  const [phase, setPhase] = useState("idle"); // idle | preparing | reveal
  const [affirmation, setAffirmation] = useState("");
  const [closing, setClosing] = useState(false);
  const [showTapParticles, setShowTapParticles] = useState(false);
  const grantReward = useRewards((s) => s.reward);
  const addBonusSparks = useRewards((s) => s.addBonusSparks);
  const trackProgress = useAchievements((s) => s.trackProgress);
  const trackChallenge = useChallenges((s) => s.trackAction);
  const rewardedRef = useRef(false);

  const handleClick = useCallback(() => {
    if (phase !== "idle") return;
    rewardedRef.current = false;
    setShowTapParticles(true);
    setPhase("preparing");
    // Clear particles after animation
    setTimeout(() => setShowTapParticles(false), 900);
  }, [phase]);

  useEffect(() => {
    if (phase !== "preparing") return;
    const t = setTimeout(() => {
      setAffirmation(getRandomAffirmation());
      setPhase("reveal");
    }, 900);
    return () => clearTimeout(t);
  }, [phase]);

  // Grant reward when affirmation is revealed
  useEffect(() => {
    if (phase === "reveal" && !rewardedRef.current) {
      rewardedRef.current = true;
      grantReward("affirmation");
      trackProgress("affirmations_read", 1, addBonusSparks);
      trackChallenge("affirmation", addBonusSparks);
      useCelebration.getState().celebrate("affirmation", { originY: 35, intensity: 0.7 });
    }
  }, [phase, grantReward, trackProgress, addBonusSparks, trackChallenge]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setPhase("idle");
      setClosing(false);
    }, 300);
  }, []);

  return (
    <>
      <style>{OVERLAY_STYLES}</style>

      {/* Cloud button */}
      <Box
        position="relative"
        cursor={phase === "idle" ? "pointer" : "default"}
        onClick={handleClick}
        style={{
          animation: phase === "idle"
            ? "affCloudFloat 6.5s ease-in-out infinite"
            : phase === "preparing"
              ? "affCloudActivate 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
              : "none",
        }}
        userSelect="none"
        transition="opacity 0.3s"
        _hover={phase === "idle" ? { opacity: 0.92 } : {}}
        _active={phase === "idle" ? { transform: "scale(0.96)" } : {}}
      >
        <CloudSvg />

        {/* Ambient sparkles — very subtle idle particles */}
        {phase === "idle" && AMBIENT_SPARKLES.map((s, i) => (
          <AmbientSparkle key={i} {...s} />
        ))}

        {/* Tap particles — hearts & stars burst */}
        <TapParticles active={showTapParticles} />

        {/* Idle label */}
        {phase === "idle" && (
          <Flex position="absolute" inset={0} align="center" justify="center" pb="6px">
            <Text
              fontSize="13px"
              fontWeight="800"
              color="#7A2E4A"
              textShadow="0 0 12px rgba(255,255,255,0.6), 0 0 24px rgba(255,230,240,0.4)"
              letterSpacing="0.04em"
              fontFamily="'Nunito', sans-serif"
              style={{ animation: "affLabelFloat 3s ease-in-out infinite" }}
            >
              {"Twoja afirmacja ✦"}
            </Text>
          </Flex>
        )}

        {/* Preparing — three dots */}
        {phase === "preparing" && (
          <Flex position="absolute" inset={0} align="center" justify="center" gap="6px" pb="6px">
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                w="7px"
                h="7px"
                borderRadius="full"
                bg="white"
                style={{
                  animation: `affDotPulse 1s ease-in-out ${i * 0.15}s infinite`,
                  boxShadow: "0 0 10px rgba(255,255,255,0.6), 0 0 20px rgba(252,194,215,0.3)",
                }}
              />
            ))}
          </Flex>
        )}

        {/* Reveal state — sparkle on cloud */}
        {phase === "reveal" && (
          <Flex position="absolute" inset={0} align="center" justify="center" pb="6px">
            <Text
              fontSize="md"
              style={{ animation: "affFadeUp 0.4s ease-out" }}
            >
              {"✨"}
            </Text>
          </Flex>
        )}
      </Box>

      {/* Overlay — rendered via portal at document.body */}
      {phase === "reveal" && (
        <AffirmationOverlay
          affirmation={affirmation}
          closing={closing}
          onClose={handleClose}
        />
      )}
    </>
  );
}
