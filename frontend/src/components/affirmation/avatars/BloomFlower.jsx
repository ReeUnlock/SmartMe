import { Box, Flex, Text } from "@chakra-ui/react";
import { AmbientSparkle, TapParticles } from "../shared";
import { AVATAR_LABEL_THEMES } from "../../../utils/reactionConfig";

const AMBIENT_SPARKLES = [
  { top: "8%",  left: "50%", delay: 0, dur: 4.5 },
  { top: "25%", left: "15%", delay: 1.2, dur: 3.8 },
  { top: "25%", left: "85%", delay: 2.5, dur: 4.2 },
  { top: "70%", left: "20%", delay: 3.0, dur: 5.0 },
  { top: "70%", left: "80%", delay: 0.6, dur: 3.6 },
];

const TAP_PARTICLES = [
  { x: -30, y: -35, type: "heart", size: 12 },
  { x: 35,  y: -30, type: "heart", size: 14 },
  { x: -40, y: -5,  type: "heart", size: 10 },
  { x: 42,  y: -8,  type: "heart", size: 11 },
  { x: -15, y: -45, type: "heart", size: 13 },
  { x: 18,  y: -42, type: "heart", size: 10 },
  { x: 0,   y: -50, type: "heart", size: 12 },
  { x: -35, y: 12,  type: "heart", size: 9 },
];

const BLOOM_STYLES = `
  @keyframes bloomFloat {
    0%   { transform: translateY(0) rotate(0deg) scale(1); }
    25%  { transform: translateY(-6px) rotate(1.5deg) scale(1.02); }
    50%  { transform: translateY(-3px) rotate(-1deg) scale(1.01); }
    75%  { transform: translateY(-7px) rotate(0.8deg) scale(1.015); }
    100% { transform: translateY(0) rotate(0deg) scale(1); }
  }
  @keyframes bloomActivate {
    0%   { transform: scale(1) rotate(0deg); }
    20%  { transform: scale(0.9) rotate(-3deg); }
    50%  { transform: scale(1.1) rotate(2deg); }
    75%  { transform: scale(1.04) rotate(-1deg); }
    100% { transform: scale(1.02) rotate(0deg); }
  }
  @keyframes bloomPetalPulse {
    0%, 100% { opacity: 0.15; }
    50% { opacity: 0.3; }
  }
`;

function FlowerSvg() {
  return (
    <svg viewBox="0 0 200 200" width="180" height="180">
      <defs>
        <radialGradient id="bloomCenter" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFE0EC" />
          <stop offset="50%" stopColor="#F8A4C8" />
          <stop offset="100%" stopColor="#E88AAE" />
        </radialGradient>
        <radialGradient id="bloomPetal" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FDDDE6" />
          <stop offset="40%" stopColor="#F4A5C4" />
          <stop offset="100%" stopColor="#E48AAF" />
        </radialGradient>
        <radialGradient id="bloomPetal2" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FDE8EF" />
          <stop offset="40%" stopColor="#F7B8D2" />
          <stop offset="100%" stopColor="#ECA0BF" />
        </radialGradient>
        <radialGradient id="bloomGlowBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(248,164,200,0.25)" />
          <stop offset="70%" stopColor="rgba(244,143,177,0.1)" />
          <stop offset="100%" stopColor="rgba(244,143,177,0)" />
        </radialGradient>
        <filter id="bloomSoft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
          <feOffset dy="4" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.12" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background glow */}
      <ellipse cx="100" cy="100" rx="80" ry="80" fill="url(#bloomGlowBg)">
        <animate attributeName="rx" dur="8s" repeatCount="indefinite" values="80;86;80" />
        <animate attributeName="ry" dur="8s" repeatCount="indefinite" values="80;86;80" />
        <animate attributeName="opacity" dur="8s" repeatCount="indefinite" values="1;0.6;1" />
      </ellipse>

      {/* Outer petals — layer 1 */}
      <g filter="url(#bloomSoft)">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <ellipse
            key={`outer-${i}`}
            cx="100"
            cy="52"
            rx="24"
            ry="38"
            fill={i % 2 === 0 ? "url(#bloomPetal)" : "url(#bloomPetal2)"}
            opacity="0.85"
            transform={`rotate(${angle} 100 100)`}
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              dur="10s"
              repeatCount="indefinite"
              values={`${angle} 100 100; ${angle + 2} 100 100; ${angle} 100 100`}
              calcMode="spline"
              keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
            />
          </ellipse>
        ))}
      </g>

      {/* Inner petals — layer 2 */}
      <g filter="url(#bloomSoft)">
        {[22, 67, 112, 157, 202, 247, 292, 337].map((angle, i) => (
          <ellipse
            key={`inner-${i}`}
            cx="100"
            cy="62"
            rx="18"
            ry="28"
            fill="url(#bloomPetal2)"
            opacity="0.7"
            transform={`rotate(${angle} 100 100)`}
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              dur="10s"
              repeatCount="indefinite"
              values={`${angle} 100 100; ${angle - 1.5} 100 100; ${angle} 100 100`}
              calcMode="spline"
              keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
            />
          </ellipse>
        ))}
      </g>

      {/* Center */}
      <circle cx="100" cy="100" r="26" fill="url(#bloomCenter)">
        <animate attributeName="r" dur="8s" repeatCount="indefinite" values="26;28;26" />
      </circle>

      {/* Center highlight */}
      <circle cx="94" cy="94" r="10" fill="rgba(255,240,245,0.35)">
        <animate attributeName="r" dur="8s" repeatCount="indefinite" values="10;12;10" />
        <animate attributeName="opacity" dur="8s" repeatCount="indefinite" values="0.35;0.5;0.35" />
      </circle>
    </svg>
  );
}

export default function BloomFlower({ phase, showTapParticles, onTap, mode }) {
  if (mode === "thumbnail") {
    return <FlowerSvg />;
  }

  return (
    <>
      <style>{BLOOM_STYLES}</style>
      <Box
        position="relative"
        cursor={phase === "idle" ? "pointer" : "default"}
        onClick={onTap}
        style={{
          filter: "drop-shadow(0 6px 18px rgba(244,143,177,0.2))",
          animation: phase === "idle"
            ? "bloomFloat 8s ease-in-out infinite"
            : phase === "preparing"
              ? "bloomActivate 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
              : "none",
        }}
        userSelect="none"
        transition="opacity 0.3s"
        _hover={phase === "idle" ? { opacity: 0.92 } : {}}
        _active={phase === "idle" ? { transform: "scale(0.96)" } : {}}
      >
        <FlowerSvg />

        {phase === "idle" && AMBIENT_SPARKLES.map((s, i) => (
          <AmbientSparkle key={i} {...s} />
        ))}

        <TapParticles active={showTapParticles} particles={TAP_PARTICLES} />

        {phase === "idle" && (
          <Flex position="absolute" inset={0} align="center" justify="center">
            <Text
              fontSize="13px"
              fontWeight="800"
              color={AVATAR_LABEL_THEMES.bloom.color}
              textShadow={AVATAR_LABEL_THEMES.bloom.textShadow}
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
                  boxShadow: "0 0 10px rgba(255,255,255,0.6), 0 0 20px rgba(244,143,177,0.3)",
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
