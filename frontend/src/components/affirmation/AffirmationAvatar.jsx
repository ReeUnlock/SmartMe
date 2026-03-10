import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Box, Flex, Text } from "@chakra-ui/react";
import useRewards from "../../hooks/useRewards";
import useAchievements from "../../hooks/useAchievements";
import useChallenges from "../../hooks/useChallenges";
import { HeartSvg, StarSvg, HEART_COLORS, STAR_COLORS } from "./shared";
import AVATAR_CONFIG, { getSelectedAvatar, getAvatarComponents } from "./avatarConfig";
import useCelebration from "../../hooks/useCelebration";
import useAvatarReaction from "../../hooks/useAvatarReaction";

const avatarComponents = getAvatarComponents();

// ─── Affirmations ──────────────────────────────────────────────
const AFFIRMATIONS = [
  "Zas\u0142ugujesz na wszystko, co pi\u0119kne",
  "Jeste\u015b silniejsza, ni\u017c my\u015blisz",
  "Ka\u017cdy dzie\u0144 to nowy pocz\u0105tek",
  "Twoja energia przyci\u0105ga cudowne rzeczy",
  "Jeste\u015b dok\u0142adnie tam, gdzie powinny\u015b by\u0107",
  "Wierz\u0119 w Ciebie \u2014 Ty te\u017c w siebie uwierz",
  "Ma\u0142e kroki prowadz\u0105 do wielkich zmian",
  "Twoje marzenia s\u0105 wa\u017cne i realne",
  "Pozw\u00f3l sobie na odpoczynek \u2014 zas\u0142ugujesz na niego",
  "Jeste\u015b wystarczaj\u0105ca, dok\u0142adnie taka jaka jeste\u015b",
  "Odwaga nie oznacza braku strachu \u2014 oznacza dzia\u0142anie mimo niego",
  "Twoja historia jest pi\u0119kna i wci\u0105\u017c si\u0119 pisze",
  "Dzisiaj jest dobry dzie\u0144 na dobry dzie\u0144",
  "Masz w sobie \u015bwiat\u0142o, kt\u00f3re o\u015bwietla innych",
  "Ka\u017cde wyzwanie czyni Ci\u0119 m\u0105drzejsz\u0105",
  "Zas\u0142ugujesz na mi\u0142o\u015b\u0107, kt\u00f3r\u0105 dajesz innym",
  "Twoje uczucia s\u0105 wa\u017cne i zas\u0142uguj\u0105 na uwag\u0119",
  "Nie musisz by\u0107 idealna, \u017ceby by\u0107 wspania\u0142\u0105",
  "Jutro b\u0119dzie lepsze, bo Ty w nim b\u0119dziesz",
  "Jeste\u015b autork\u0105 swojego \u017cycia \u2014 pisz pi\u0119kn\u0105 histori\u0119",
  "Twoja delikatno\u015b\u0107 to si\u0142a, nie s\u0142abo\u015b\u0107",
  "Pozw\u00f3l sobie marzy\u0107 bez ogranicze\u0144",
  "Jeste\u015b wa\u017cna dla ludzi wok\u00f3\u0142 siebie",
  "Ka\u017cdy oddech to szansa na nowy start",
  "Twoja intuicja Ci\u0119 nie zawodzi \u2014 ufaj jej",
  "Robisz post\u0119py, nawet je\u015bli ich nie widzisz",
  "Zas\u0142ugujesz na przestrze\u0144, kt\u00f3r\u0105 zajmujesz",
  "Twoja wra\u017cliwo\u015b\u0107 to dar, nie obci\u0105\u017cenie",
  "Cierpliwo\u015b\u0107 wobec siebie to forma mi\u0142o\u015bci",
  "Jeste\u015b inspiracj\u0105 dla kogo\u015b, kto Ci\u0119 obserwuje",
  "Nie por\u00f3wnuj swojego rozdzia\u0142u 1 z czyim\u015b rozdzia\u0142em 20",
  "Twoje granice s\u0105 zdrowe i potrzebne",
  "Ka\u017cdy zach\u00f3d s\u0142o\u0144ca oznacza, \u017ce przetrwa\u0142a\u015b kolejny dzie\u0144",
  "Masz prawo do rado\u015bci bez poczucia winy",
  "Twoje cia\u0142o jest Twoim domem \u2014 b\u0105d\u017a dla niego dobra",
  "Jeste\u015b jedyna w swoim rodzaju i to jest Twoja supermoc",
  "Wdzi\u0119czno\u015b\u0107 zmienia perspektyw\u0119 \u2014 i zmienia \u017cycie",
  "Nie musisz mie\u0107 wszystkiego pouk\u0142adanego, \u017ceby i\u015b\u0107 dalej",
  "Tw\u00f3j u\u015bmiech potrafi rozja\u015bni\u0107 czyj\u015b dzie\u0144",
  "Zas\u0142ugujesz na chwil\u0119 spokoju \u2014 we\u017a j\u0105 teraz",
  "Jeste\u015b odwa\u017cniejsza, ni\u017c Ci si\u0119 wydaje",
  "Twoje \u201enie\u201d jest tak samo wa\u017cne jak Twoje \u201etak\u201d",
  "Ka\u017cdy b\u0142\u0105d to lekcja, nie pora\u017cka",
  "Masz prawo zmienia\u0107 zdanie i zmienia\u0107 kierunek",
  "Twoja obecno\u015b\u0107 czyni \u015bwiat lepszym miejscem",
  "Nie musisz si\u0119 spieszy\u0107 \u2014 Twoje tempo jest w\u0142a\u015bciwe",
  "Jeste\u015b otoczona mo\u017cliwo\u015bciami \u2014 otw\u00f3rz oczy",
  "Zas\u0142ugujesz na relacje, kt\u00f3re Ci\u0119 buduj\u0105",
  "Twoja si\u0142a ro\u015bnie z ka\u017cdym dniem",
  "Pami\u0119taj \u2014 po ka\u017cdej burzy wychodzi s\u0142o\u0144ce",
  "Jeste\u015b wystarczaj\u0105ca taka, jaka jeste\u015b dzi\u015b",
  "Twoja warto\u015b\u0107 nie zale\u017cy od opinii innych",
  "Masz prawo stawia\u0107 granice",
  "Twoje potrzeby s\u0105 wa\u017cne",
  "Mo\u017cesz zmienia\u0107 zdanie i nadal by\u0107 sob\u0105",
  "Twoje tempo jest w\u0142a\u015bciwe",
  "Mo\u017cesz ufa\u0107 sobie coraz bardziej",
  "Masz w sobie wi\u0119cej si\u0142y, ni\u017c czasem widzisz",
  "Nie musisz by\u0107 idealna, \u017ceby by\u0107 warto\u015bciow\u0105",
  "Zas\u0142ugujesz na szacunek i spok\u00f3j",
  "Mo\u017cesz dba\u0107 o siebie bez poczucia winy",
  "Twoje emocje maj\u0105 znaczenie",
  "Masz prawo odpoczywa\u0107",
  "Mo\u017cesz m\u00f3wi\u0107 \u201enie\u201d bez t\u0142umaczenia si\u0119",
  "Twoja wra\u017cliwo\u015b\u0107 jest cz\u0119\u015bci\u0105 Twojej si\u0142y",
  "Mo\u017cesz dawa\u0107 sobie czas na rozw\u00f3j",
  "Nie musisz nikomu udowadnia\u0107 swojej warto\u015bci",
  "Mo\u017cesz zaczyna\u0107 od nowa tyle razy, ile potrzebujesz",
  "Twoja intuicja jest wa\u017cnym g\u0142osem",
  "Mo\u017cesz wybiera\u0107 to, co jest dla Ciebie dobre",
  "Twoja przesz\u0142o\u015b\u0107 nie musi decydowa\u0107 o Twojej przysz\u0142o\u015bci",
  "Mo\u017cesz traktowa\u0107 siebie z wi\u0119ksz\u0105 \u017cyczliwo\u015bci\u0105",
  "Twoje granice chroni\u0105 Tw\u00f3j spok\u00f3j",
  "Mo\u017cesz by\u0107 jednocze\u015bnie silna i wra\u017cliwa",
  "Zas\u0142ugujesz na relacje oparte na szacunku",
  "Jeste\u015b wa\u017cn\u0105 osob\u0105 w swoim w\u0142asnym \u017cyciu",
  "Masz wp\u0142yw na kierunek, w kt\u00f3rym idziesz",
  "Twoje cia\u0142o zas\u0142uguje na trosk\u0119",
  "Jeste\u015b kim\u015b wi\u0119cej ni\u017c Twoje b\u0142\u0119dy",
  "Mo\u017cesz ufa\u0107 swoim decyzjom",
  "Masz prawo i\u015b\u0107 w\u0142asn\u0105 drog\u0105",
  "Twoja warto\u015b\u0107 nie zale\u017cy od tego, ile robisz",
  "Mo\u017cesz odnajdywa\u0107 spok\u00f3j nawet w trudnych chwilach",
  "Mo\u017cesz dawa\u0107 sobie przestrze\u0144 na zmian\u0119",
  "Jeste\u015b wystarczaj\u0105co dobra ju\u017c teraz",
  "Twoje \u017cycie nie musi wygl\u0105da\u0107 jak \u017cycie innych",
  "Zas\u0142ugujesz na spok\u00f3j w g\u0142owie",
  "Twoje uczucia s\u0105 wa\u017cnym sygna\u0142em",
  "Mo\u017cesz by\u0107 dumna z ma\u0142ych krok\u00f3w",
  "Jeste\u015b w procesie i to jest w porz\u0105dku",
  "Twoja obecno\u015b\u0107 ma znaczenie",
  "Mo\u017cesz chroni\u0107 swoj\u0105 energi\u0119",
  "Nie musisz by\u0107 wszystkim dla wszystkich",
  "Mo\u017cesz wybiera\u0107 siebie bez poczucia winy",
  "Twoje granice s\u0105 wyrazem szacunku do samej siebie",
  "Jeste\u015b wystarczaj\u0105ca nawet w trudniejsze dni",
  "Mo\u017cesz ufa\u0107 swojej wewn\u0119trznej m\u0105dro\u015bci",
  "Ka\u017cdy dzie\u0144 daje Ci now\u0105 mo\u017cliwo\u015b\u0107",
  "Zas\u0142ugujesz na trosk\u0119 \u2014 tak\u017ce w\u0142asn\u0105",
  "Jeste\u015b wa\u017cna",
];

const EMOJIS = ["\u{1f495}", "\u{1f497}", "\u{1f618}", "\u{1f496}", "\u{1f970}", "\u{1f49e}", "\u{1f63d}", "\u{1f493}", "\u{1f49d}", "\u{1f48b}"];

function getRandomAffirmation() {
  const text = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
  const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  return `${text} ${emoji}`;
}

// ─── Shared keyframes (used by all avatars) ────────────────────
const SHARED_STYLES = `
  @keyframes avatarDotPulse {
    0%, 80%, 100% { opacity: 0.25; transform: scale(0.8); }
    40% { opacity: 1; transform: scale(1); }
  }
  @keyframes avatarFadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes avatarLabelFloat {
    0%, 100% { transform: translateY(0) scale(1); opacity: 1; }
    50% { transform: translateY(-2px) scale(1.025); opacity: 0.88; }
  }
  @keyframes avatarAmbientSparkle {
    0%, 100% { opacity: 0; transform: scale(0.5); }
    30% { opacity: 0.5; transform: scale(0.9); }
    50% { opacity: 0.7; transform: scale(1); }
    70% { opacity: 0.4; transform: scale(0.85); }
  }
  @keyframes avatarTapParticle {
    0% { opacity: 0; transform: translate(0, 0) scale(0.3) rotate(0deg); }
    20% { opacity: 0.9; transform: translate(calc(var(--px) * 0.4), calc(var(--py) * 0.4)) scale(1) rotate(calc(var(--pr) * 0.3)); }
    60% { opacity: 0.6; transform: translate(calc(var(--px) * 0.8), calc(var(--py) * 0.8)) scale(0.8) rotate(calc(var(--pr) * 0.7)); }
    100% { opacity: 0; transform: translate(var(--px), var(--py)) scale(0.3) rotate(var(--pr)); }
  }
`;

// ─── Overlay keyframes ─────────────────────────────────────────
const OVERLAY_STYLES = `
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
  @keyframes affDecoFloat {
    0% { opacity: 0; transform: scale(0.4) translateY(20px) translateX(0) rotate(0deg); }
    15% { opacity: 0.7; transform: scale(0.85) translateY(6px) translateX(var(--drift)) rotate(calc(var(--rot) * 0.4)); }
    40% { opacity: 0.55; transform: scale(1) translateY(-12px) translateX(calc(var(--drift) * 0.6)) rotate(var(--rot)); }
    65% { opacity: 0.6; transform: scale(0.95) translateY(-22px) translateX(var(--drift)) rotate(calc(var(--rot) * 0.7)); }
    85% { opacity: 0.3; transform: scale(0.8) translateY(-32px) translateX(calc(var(--drift) * 0.4)) rotate(calc(var(--rot) * 1.1)); }
    100% { opacity: 0; transform: scale(0.5) translateY(-40px) translateX(0) rotate(var(--rot)); }
  }
`;

// ─── Overlay decorative positions ──────────────────────────────
function useDecoPositions() {
  return useMemo(() => {
    const items = [
      { top: "5%",  left: "8%",  size: 48, drift: -15, rotate: 20,  type: "heart" },
      { top: "8%",  left: "78%", size: 34, drift: 12,  rotate: -15, type: "star" },
      { top: "15%", left: "55%", size: 28, drift: -8,  rotate: 25,  type: "star" },
      { top: "35%", left: "2%",  size: 52, drift: -20, rotate: -12, type: "heart" },
      { top: "55%", left: "5%",  size: 30, drift: 10,  rotate: 18,  type: "star" },
      { top: "40%", left: "85%", size: 44, drift: 18,  rotate: -22, type: "heart" },
      { top: "60%", left: "82%", size: 26, drift: -14, rotate: 15,  type: "star" },
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

        <Text
          fontSize="2xl"
          mb={4}
          lineHeight="1"
          style={{ animation: "avatarFadeUp 0.5s ease-out 0.12s both" }}
        >
          {"\u{1f338}"}
        </Text>

        <Text
          fontSize={{ base: "md", md: "lg" }}
          fontWeight="600"
          color="textSecondary"
          lineHeight="1.75"
          fontFamily="'Nunito', sans-serif"
          mb={7}
          px={1}
          style={{ animation: "avatarFadeUp 0.5s ease-out 0.22s both" }}
        >
          {affirmation}
        </Text>

        <Box style={{ animation: "avatarFadeUp 0.5s ease-out 0.32s both" }}>
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
            {"Dzi\u0119kuj\u0119 \u2728"}
          </Flex>
        </Box>
      </Box>
    </Box>,
    document.body,
  );
}

// ─── Main component ────────────────────────────────────────────
export default function AffirmationAvatar() {
  const [phase, setPhase] = useState("idle");
  const [affirmation, setAffirmation] = useState("");
  const [closing, setClosing] = useState(false);
  const [showTapParticles, setShowTapParticles] = useState(false);
  const level = useRewards((s) => s.level);
  const grantReward = useRewards((s) => s.reward);
  const addBonusSparks = useRewards((s) => s.addBonusSparks);
  const trackProgress = useAchievements((s) => s.trackProgress);
  const trackChallenge = useChallenges((s) => s.trackAction);
  const rewardedRef = useRef(false);

  // Re-resolve avatar on every render so selection page changes are reflected
  const avatarKey = getSelectedAvatar(level);
  const AvatarComponent = avatarComponents[avatarKey] || AVATAR_CONFIG[0].component;

  const handleClick = useCallback(() => {
    if (phase !== "idle") return;
    rewardedRef.current = false;
    setShowTapParticles(true);
    setPhase("preparing");
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

  useEffect(() => {
    if (phase === "reveal" && !rewardedRef.current) {
      rewardedRef.current = true;
      grantReward("affirmation");
      trackProgress("affirmations_read", 1, addBonusSparks);
      trackChallenge("affirmation", addBonusSparks);
      useCelebration.getState().celebrate("affirmation", { originY: 35, intensity: 0.7 });
      useAvatarReaction.getState().react("affirmation_reveal");
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
      <style>{SHARED_STYLES}</style>
      <style>{OVERLAY_STYLES}</style>

      <AvatarComponent
        phase={phase}
        showTapParticles={showTapParticles}
        onTap={handleClick}
      />

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
