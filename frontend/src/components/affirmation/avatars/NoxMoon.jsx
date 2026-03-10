import { Box, Flex, Text } from "@chakra-ui/react";
import { AmbientSparkle, TapParticles } from "../shared";
import { AVATAR_LABEL_THEMES } from "../../../utils/reactionConfig";

const AMBIENT_SPARKLES = [
  { top: "8%",  left: "35%", delay: 0, dur: 4.8 },
  { top: "15%", left: "75%", delay: 1.6, dur: 4.2 },
  { top: "35%", left: "90%", delay: 2.8, dur: 5.4 },
  { top: "65%", left: "85%", delay: 0.4, dur: 3.8 },
  { top: "75%", left: "20%", delay: 3.4, dur: 4.6 },
  { top: "45%", left: "8%",  delay: 1.0, dur: 5.0 },
  { top: "20%", left: "15%", delay: 2.2, dur: 3.6 },
];

const TAP_PARTICLES = [
  { x: -28, y: -38, type: "star", size: 11 },
  { x: 32,  y: -32, type: "star", size: 13 },
  { x: -38, y: -12, type: "star", size: 9 },
  { x: 40,  y: -6,  type: "star", size: 12 },
  { x: -12, y: -48, type: "star", size: 10 },
  { x: 18,  y: -44, type: "star", size: 11 },
  { x: 0,   y: -50, type: "star", size: 13 },
  { x: -34, y: 8,   type: "star", size: 8 },
];

const NOX_STYLES = `
  @keyframes noxFloat {
    0%   { transform: translateY(0) translateX(0) rotate(0deg) scale(1); }
    20%  { transform: translateY(-5px) translateX(2px) rotate(0.6deg) scale(1.03); }
    40%  { transform: translateY(-9px) translateX(-1px) rotate(-0.4deg) scale(1.05); }
    60%  { transform: translateY(-4px) translateX(3px) rotate(0.3deg) scale(1.02); }
    80%  { transform: translateY(-7px) translateX(-2px) rotate(-0.5deg) scale(1.04); }
    100% { transform: translateY(0) translateX(0) rotate(0deg) scale(1); }
  }
  @keyframes noxActivate {
    0%   { transform: scale(1); }
    20%  { transform: scale(0.9); }
    50%  { transform: scale(1.1); }
    75%  { transform: scale(1.04); }
    100% { transform: scale(1.02); }
  }
  @keyframes noxStarTwinkle {
    0%, 100% { opacity: 0.25; transform: scale(0.6); }
    50% { opacity: 0.9; transform: scale(1.15); }
  }
`;

function MoonSvg() {
  // Tiny stars scattered around the moon
  const stars = [
    { cx: 150, cy: 40, r: 1.8, dur: 3.5, delay: 0 },
    { cx: 160, cy: 65, r: 1.4, dur: 4.2, delay: 0.8 },
    { cx: 48,  cy: 45, r: 1.6, dur: 3.8, delay: 1.5 },
    { cx: 55,  cy: 145, r: 1.3, dur: 4.6, delay: 2.2 },
    { cx: 155, cy: 130, r: 1.5, dur: 3.2, delay: 0.5 },
    { cx: 38,  cy: 90, r: 1.2, dur: 5.0, delay: 1.8 },
    { cx: 165, cy: 95, r: 1.7, dur: 4.0, delay: 2.8 },
    { cx: 130, cy: 35, r: 1.1, dur: 3.6, delay: 1.2 },
  ];

  return (
    <svg viewBox="0 0 200 200" width="220" height="220">
      <defs>
        <radialGradient id="noxCore" cx="42%" cy="42%" r="52%">
          <stop offset="0%" stopColor="#F0ECF8" />
          <stop offset="25%" stopColor="#E0D8EE" />
          <stop offset="55%" stopColor="#D0C4E4" />
          <stop offset="100%" stopColor="#C0B0D8" />
        </radialGradient>
        <radialGradient id="noxInner" cx="38%" cy="36%" r="45%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
          <stop offset="50%" stopColor="rgba(240,236,248,0.18)" />
          <stop offset="100%" stopColor="rgba(224,216,238,0)" />
        </radialGradient>
        <radialGradient id="noxOuter" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(210,200,240,0.15)" />
          <stop offset="60%" stopColor="rgba(190,180,220,0.06)" />
          <stop offset="100%" stopColor="rgba(190,180,220,0)" />
        </radialGradient>
        <radialGradient id="noxCrater" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(180,170,210,0.12)" />
          <stop offset="100%" stopColor="rgba(180,170,210,0)" />
        </radialGradient>
        <filter id="noxSoft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
          <feOffset dy="4" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.1" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="noxBlur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" />
        </filter>
      </defs>

      {/* Outer atmospheric glow */}
      <circle cx="100" cy="100" r="90" fill="url(#noxOuter)">
        <animate attributeName="r" dur="9s" repeatCount="indefinite" values="90;97;90" />
        <animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="1;0.5;1" />
      </circle>

      {/* Gentle halo ring */}
      <circle cx="100" cy="100" r="66" fill="none" stroke="rgba(210,200,240,0.12)" strokeWidth="1.5">
        <animate attributeName="r" dur="9s" repeatCount="indefinite" values="66;72;66" />
        <animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0.12;0.25;0.12" />
      </circle>

      {/* Tiny twinkling stars */}
      {stars.map((s, i) => (
        <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="rgba(230,225,250,0.7)"
          style={{ animation: `noxStarTwinkle ${s.dur}s ease-in-out ${s.delay}s infinite` }}>
        </circle>
      ))}

      {/* Main moon body — crescent effect via overlapping circles */}
      <g filter="url(#noxSoft)">
        {/* Full circle base */}
        <circle cx="100" cy="100" r="48" fill="url(#noxCore)">
          <animate attributeName="r" dur="9s" repeatCount="indefinite" values="48;52;48"
            calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
        </circle>
      </g>

      {/* Inner highlight for depth */}
      <circle cx="100" cy="100" r="48" fill="url(#noxInner)">
        <animate attributeName="r" dur="9s" repeatCount="indefinite" values="48;52;48" />
      </circle>

      {/* Subtle craters / surface texture */}
      <circle cx="86" cy="92" r="9" fill="url(#noxCrater)" opacity="0.6" />
      <circle cx="112" cy="110" r="7" fill="url(#noxCrater)" opacity="0.5" />
      <circle cx="96" cy="120" r="6" fill="url(#noxCrater)" opacity="0.4" />

      {/* Crescent shadow — creates the moon shape illusion */}
      <circle cx="120" cy="94" r="40" fill="rgba(192,176,216,0.15)">
        <animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0.15;0.24;0.15" />
      </circle>

      {/* Top specular highlight */}
      <ellipse cx="88" cy="82" rx="18" ry="12" fill="rgba(255,255,255,0.3)" filter="url(#noxBlur)">
        <animate attributeName="ry" dur="9s" repeatCount="indefinite" values="12;15;12" />
        <animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0.3;0.48;0.3" />
      </ellipse>

      {/* Tiny moon glow accent */}
      <ellipse cx="78" cy="108" rx="5" ry="4" fill="rgba(230,225,250,0.22)" filter="url(#noxBlur)">
        <animate attributeName="opacity" dur="7s" repeatCount="indefinite" values="0.22;0.38;0.22" />
      </ellipse>
    </svg>
  );
}

export default function NoxMoon({ phase, showTapParticles, onTap, mode }) {
  if (mode === "thumbnail") {
    return <MoonSvg />;
  }

  return (
    <>
      <style>{NOX_STYLES}</style>
      <Box
        position="relative"
        cursor={phase === "idle" ? "pointer" : "default"}
        onClick={onTap}
        style={{
          filter: "drop-shadow(0 8px 22px rgba(190,180,220,0.25))",
          animation: phase === "idle"
            ? "noxFloat 10s ease-in-out infinite"
            : phase === "preparing"
              ? "noxActivate 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
              : "none",
        }}
        userSelect="none"
        transition="opacity 0.3s"
        _hover={phase === "idle" ? { opacity: 0.92 } : {}}
        _active={phase === "idle" ? { transform: "scale(0.96)" } : {}}
      >
        <MoonSvg />

        {phase === "idle" && AMBIENT_SPARKLES.map((s, i) => (
          <AmbientSparkle key={i} {...s} />
        ))}

        <TapParticles active={showTapParticles} particles={TAP_PARTICLES} />

        {phase === "idle" && (
          <Flex position="absolute" inset={0} align="center" justify="center">
            <Text
              fontSize="13px"
              fontWeight="800"
              color={AVATAR_LABEL_THEMES.nox.color}
              textShadow={AVATAR_LABEL_THEMES.nox.textShadow}
              letterSpacing="0.04em"
              fontFamily="'Nunito', sans-serif"
              style={{ animation: "avatarLabelFloat 3s ease-in-out infinite" }}
            >
              {"Twoja afirmacja \u2726"}
            </Text>
          </Flex>
        )}

        {phase === "preparing" && (
          <Flex position="absolute" inset={0} align="center" justify="center" gap="6px">
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                w="7px"
                h="7px"
                borderRadius="full"
                bg="white"
                style={{
                  animation: `avatarDotPulse 1s ease-in-out ${i * 0.15}s infinite`,
                  boxShadow: "0 0 10px rgba(255,255,255,0.6), 0 0 20px rgba(210,200,240,0.3)",
                }}
              />
            ))}
          </Flex>
        )}

        {phase === "reveal" && (
          <Flex position="absolute" inset={0} align="center" justify="center">
            <Text
              fontSize="md"
              style={{ animation: "avatarFadeUp 0.4s ease-out" }}
            >
              {"\u2728"}
            </Text>
          </Flex>
        )}
      </Box>
    </>
  );
}
