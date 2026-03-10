import { Box, Flex, Text } from "@chakra-ui/react";
import { AmbientSparkle, TapParticles } from "../shared";
import { AVATAR_LABEL_THEMES } from "../../../utils/reactionConfig";

const AMBIENT_SPARKLES = [
  { top: "5%",  left: "50%", delay: 0, dur: 4.0 },
  { top: "20%", left: "10%", delay: 1.4, dur: 3.8 },
  { top: "20%", left: "90%", delay: 2.6, dur: 4.4 },
  { top: "80%", left: "15%", delay: 3.2, dur: 5.0 },
  { top: "80%", left: "85%", delay: 0.8, dur: 3.6 },
  { top: "50%", left: "95%", delay: 1.8, dur: 4.2 },
];

const TAP_PARTICLES = [
  { x: -30, y: -35, type: "star", size: 13 },
  { x: 35,  y: -30, type: "star", size: 12 },
  { x: -42, y: -8,  type: "star", size: 10 },
  { x: 40,  y: -12, type: "star", size: 14 },
  { x: -18, y: -46, type: "star", size: 11 },
  { x: 22,  y: -44, type: "star", size: 10 },
  { x: 0,   y: -50, type: "star", size: 12 },
  { x: -36, y: 10,  type: "star", size: 9 },
];

const SOL_STYLES = `
  @keyframes solFloat {
    0%   { transform: translateY(0) rotate(0deg) scale(1); }
    20%  { transform: translateY(-5px) rotate(0.5deg) scale(1.035); }
    40%  { transform: translateY(-8px) rotate(-0.4deg) scale(1.05); }
    60%  { transform: translateY(-4px) rotate(0.3deg) scale(1.025); }
    80%  { transform: translateY(-7px) rotate(-0.3deg) scale(1.04); }
    100% { transform: translateY(0) rotate(0deg) scale(1); }
  }
  @keyframes solActivate {
    0%   { transform: scale(1) rotate(0deg); }
    20%  { transform: scale(0.9) rotate(-2deg); }
    50%  { transform: scale(1.1) rotate(1deg); }
    75%  { transform: scale(1.04) rotate(-0.5deg); }
    100% { transform: scale(1.02) rotate(0deg); }
  }
  @keyframes solRayPulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 0.8; }
  }
`;

function SunSvg() {
  return (
    <svg viewBox="0 0 200 200" width="220" height="220">
      <defs>
        <radialGradient id="solCore" cx="48%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#FFF5E8" />
          <stop offset="25%" stopColor="#FDDCB5" />
          <stop offset="55%" stopColor="#F8C4A0" />
          <stop offset="100%" stopColor="#F0A888" />
        </radialGradient>
        <radialGradient id="solInner" cx="42%" cy="38%" r="45%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
          <stop offset="50%" stopColor="rgba(255,245,232,0.2)" />
          <stop offset="100%" stopColor="rgba(253,220,181,0)" />
        </radialGradient>
        <radialGradient id="solOuter" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(253,200,150,0.18)" />
          <stop offset="60%" stopColor="rgba(250,180,120,0.06)" />
          <stop offset="100%" stopColor="rgba(250,180,120,0)" />
        </radialGradient>
        <filter id="solSoft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
          <feOffset dy="3" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.1" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="solBlur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" />
        </filter>
      </defs>

      {/* Outer glow */}
      <circle cx="100" cy="100" r="92" fill="url(#solOuter)">
        <animate attributeName="r" dur="9s" repeatCount="indefinite" values="92;99;92" />
        <animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="1;0.55;1" />
      </circle>

      {/* Soft rays */}
      <g filter="url(#solSoft)" style={{ animation: "solRayPulse 8s ease-in-out infinite" }}>
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const innerR = 52;
          const outerR = 78 + (i % 3) * 5;
          const x1 = 100 + Math.cos(rad) * innerR;
          const y1 = 100 + Math.sin(rad) * innerR;
          const x2 = 100 + Math.cos(rad) * outerR;
          const y2 = 100 + Math.sin(rad) * outerR;
          const perpX = Math.cos(rad + Math.PI / 2) * 6;
          const perpY = Math.sin(rad + Math.PI / 2) * 6;
          return (
            <path
              key={i}
              d={`M${x1 + perpX},${y1 + perpY} L${x2},${y2} L${x1 - perpX},${y1 - perpY} Z`}
              fill={i % 2 === 0 ? "rgba(253,210,170,0.45)" : "rgba(248,195,155,0.35)"}
              opacity="0.6"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                dur="40s"
                repeatCount="indefinite"
                values={`0 100 100; ${i % 2 === 0 ? 360 : -360} 100 100`}
              />
            </path>
          );
        })}
      </g>

      {/* Secondary soft rays — offset for fullness */}
      <g filter="url(#solSoft)" style={{ animation: "solRayPulse 10s ease-in-out 2s infinite" }}>
        {[15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const innerR = 50;
          const outerR = 68 + (i % 2) * 5;
          const x1 = 100 + Math.cos(rad) * innerR;
          const y1 = 100 + Math.sin(rad) * innerR;
          const x2 = 100 + Math.cos(rad) * outerR;
          const y2 = 100 + Math.sin(rad) * outerR;
          const perpX = Math.cos(rad + Math.PI / 2) * 4;
          const perpY = Math.sin(rad + Math.PI / 2) * 4;
          return (
            <path
              key={i}
              d={`M${x1 + perpX},${y1 + perpY} L${x2},${y2} L${x1 - perpX},${y1 - perpY} Z`}
              fill="rgba(255,220,190,0.3)"
              opacity="0.4"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                dur="50s"
                repeatCount="indefinite"
                values={`0 100 100; ${i % 2 === 0 ? -360 : 360} 100 100`}
              />
            </path>
          );
        })}
      </g>

      {/* Main sun body */}
      <circle cx="100" cy="100" r="46" fill="url(#solCore)" filter="url(#solSoft)">
        <animate attributeName="r" dur="9s" repeatCount="indefinite" values="46;50;46"
          calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
      </circle>

      {/* Inner highlight */}
      <circle cx="100" cy="100" r="46" fill="url(#solInner)">
        <animate attributeName="r" dur="9s" repeatCount="indefinite" values="46;50;46" />
      </circle>

      {/* Specular highlight */}
      <ellipse cx="92" cy="84" rx="18" ry="12" fill="rgba(255,255,255,0.35)" filter="url(#solBlur)">
        <animate attributeName="ry" dur="9s" repeatCount="indefinite" values="12;15;12" />
        <animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0.35;0.5;0.35" />
      </ellipse>
    </svg>
  );
}

export default function SolSun({ phase, showTapParticles, onTap, mode }) {
  if (mode === "thumbnail") {
    return <SunSvg />;
  }

  return (
    <>
      <style>{SOL_STYLES}</style>
      <Box
        position="relative"
        cursor={phase === "idle" ? "pointer" : "default"}
        onClick={onTap}
        style={{
          filter: "drop-shadow(0 8px 22px rgba(253,200,150,0.25))",
          animation: phase === "idle"
            ? "solFloat 8s ease-in-out infinite"
            : phase === "preparing"
              ? "solActivate 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
              : "none",
        }}
        userSelect="none"
        transition="opacity 0.3s"
        _hover={phase === "idle" ? { opacity: 0.92 } : {}}
        _active={phase === "idle" ? { transform: "scale(0.96)" } : {}}
      >
        <SunSvg />

        {phase === "idle" && AMBIENT_SPARKLES.map((s, i) => (
          <AmbientSparkle key={i} {...s} />
        ))}

        <TapParticles active={showTapParticles} particles={TAP_PARTICLES} />

        {phase === "idle" && (
          <Flex position="absolute" inset={0} align="center" justify="center">
            <Text
              fontSize="13px"
              fontWeight="800"
              color={AVATAR_LABEL_THEMES.sol.color}
              textShadow={AVATAR_LABEL_THEMES.sol.textShadow}
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
                  boxShadow: "0 0 10px rgba(255,255,255,0.6), 0 0 20px rgba(253,200,150,0.3)",
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
