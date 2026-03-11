import { Box, Flex, Text } from "@chakra-ui/react";
import { AmbientSparkle, TapParticles } from "../shared";


const AMBIENT_SPARKLES = [
  { top: "5%",  left: "50%", delay: 0, dur: 3.8 },
  { top: "30%", left: "8%",  delay: 1.5, dur: 4.4 },
  { top: "30%", left: "92%", delay: 2.8, dur: 3.6 },
  { top: "75%", left: "15%", delay: 0.9, dur: 5.2 },
  { top: "75%", left: "85%", delay: 3.5, dur: 4.0 },
  { top: "50%", left: "5%",  delay: 2.1, dur: 4.6 },
  { top: "50%", left: "95%", delay: 0.3, dur: 3.4 },
];

const TAP_PARTICLES = [
  { x: -25, y: -40, type: "star", size: 12 },
  { x: 30,  y: -35, type: "star", size: 14 },
  { x: -40, y: -15, type: "star", size: 10 },
  { x: 42,  y: -10, type: "star", size: 11 },
  { x: -15, y: -48, type: "star", size: 13 },
  { x: 20,  y: -45, type: "star", size: 10 },
  { x: 0,   y: -52, type: "star", size: 12 },
  { x: -38, y: 8,   type: "star", size: 9 },
];

const AURA_STYLES = `
  @keyframes auraFloat {
    0%   { transform: translateY(0) scale(1); }
    20%  { transform: translateY(-6px) scale(1.015); }
    40%  { transform: translateY(-3px) scale(1.005); }
    60%  { transform: translateY(-8px) scale(1.02); }
    80%  { transform: translateY(-4px) scale(1.01); }
    100% { transform: translateY(0) scale(1); }
  }
  @keyframes auraActivate {
    0%   { transform: scale(1); }
    20%  { transform: scale(0.88); }
    50%  { transform: scale(1.12); }
    75%  { transform: scale(1.04); }
    100% { transform: scale(1.02); }
  }
  @keyframes auraRingPulse {
    0%, 100% { opacity: 0.12; transform: scale(1); }
    50% { opacity: 0.25; transform: scale(1.06); }
  }
`;

function OrbSvg() {
  return (
    <svg viewBox="0 0 200 200" width="180" height="180">
      <defs>
        <radialGradient id="auraCore" cx="45%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#F0E6FF" />
          <stop offset="30%" stopColor="#D8C4F0" />
          <stop offset="60%" stopColor="#C4A8E8" />
          <stop offset="100%" stopColor="#B090D8" />
        </radialGradient>
        <radialGradient id="auraInner" cx="40%" cy="35%" r="45%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
          <stop offset="50%" stopColor="rgba(240,230,255,0.2)" />
          <stop offset="100%" stopColor="rgba(220,200,245,0)" />
        </radialGradient>
        <radialGradient id="auraOuter" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(200,170,240,0.2)" />
          <stop offset="60%" stopColor="rgba(180,150,220,0.08)" />
          <stop offset="100%" stopColor="rgba(180,150,220,0)" />
        </radialGradient>
        <radialGradient id="auraRing" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor="rgba(200,170,240,0)" />
          <stop offset="85%" stopColor="rgba(200,170,240,0.15)" />
          <stop offset="95%" stopColor="rgba(220,190,255,0.08)" />
          <stop offset="100%" stopColor="rgba(200,170,240,0)" />
        </radialGradient>
        <filter id="auraBlur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>
      </defs>

      {/* Outer aura rings */}
      <circle cx="100" cy="100" r="90" fill="url(#auraOuter)">
        <animate attributeName="r" dur="9s" repeatCount="indefinite" values="90;96;90" />
        <animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="1;0.6;1" />
      </circle>

      {/* Pulsing ring 1 */}
      <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(200,170,240,0.15)" strokeWidth="1.5"
        style={{ animation: "auraRingPulse 6s ease-in-out infinite" }}>
        <animate attributeName="r" dur="8s" repeatCount="indefinite" values="70;74;70" />
      </circle>

      {/* Pulsing ring 2 */}
      <circle cx="100" cy="100" r="58" fill="none" stroke="rgba(216,196,240,0.12)" strokeWidth="1"
        style={{ animation: "auraRingPulse 7s ease-in-out 1.5s infinite" }}>
        <animate attributeName="r" dur="9s" repeatCount="indefinite" values="58;62;58" />
      </circle>

      {/* Main orb — soft sphere */}
      <circle cx="100" cy="100" r="44" fill="url(#auraCore)">
        <animate attributeName="r" dur="8s" repeatCount="indefinite" values="44;47;44"
          calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
      </circle>

      {/* Inner highlight */}
      <circle cx="100" cy="100" r="44" fill="url(#auraInner)">
        <animate attributeName="r" dur="8s" repeatCount="indefinite" values="44;47;44" />
      </circle>

      {/* Top specular highlight */}
      <ellipse cx="90" cy="82" rx="18" ry="12" fill="rgba(255,255,255,0.3)" filter="url(#auraBlur)">
        <animate attributeName="ry" dur="8s" repeatCount="indefinite" values="12;14;12" />
        <animate attributeName="opacity" dur="8s" repeatCount="indefinite" values="0.3;0.45;0.3" />
      </ellipse>

      {/* Subtle energy motes around orb */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const cx = 100 + Math.cos(rad) * 54;
        const cy = 100 + Math.sin(rad) * 54;
        return (
          <circle key={i} cx={cx} cy={cy} r="2" fill="rgba(220,200,255,0.5)">
            <animate attributeName="r" dur={`${4 + i * 0.5}s`} repeatCount="indefinite"
              values="2;3.5;2" begin={`${i * 0.6}s`} />
            <animate attributeName="opacity" dur={`${4 + i * 0.5}s`} repeatCount="indefinite"
              values="0.5;0.8;0.5" begin={`${i * 0.6}s`} />
          </circle>
        );
      })}
    </svg>
  );
}

export default function AuraOrb({ phase, showTapParticles, onTap, mode }) {
  if (mode === "thumbnail") {
    return <OrbSvg />;
  }

  return (
    <>
      <style>{AURA_STYLES}</style>
      <Box
        position="relative"
        cursor={phase === "idle" ? "pointer" : "default"}
        onClick={onTap}
        style={{
          filter: "drop-shadow(0 0 20px rgba(200,170,240,0.25))",
          animation: phase === "idle"
            ? "auraFloat 9s ease-in-out infinite"
            : phase === "preparing"
              ? "auraActivate 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
              : "none",
        }}
        userSelect="none"
        transition="opacity 0.3s"
        _hover={phase === "idle" ? { opacity: 0.92 } : {}}
        _active={phase === "idle" ? { transform: "scale(0.96)" } : {}}
      >
        <OrbSvg />

        {phase === "idle" && AMBIENT_SPARKLES.map((s, i) => (
          <AmbientSparkle key={i} {...s} />
        ))}

        <TapParticles active={showTapParticles} particles={TAP_PARTICLES} />

        {/* Idle — no label, avatar-only */}

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
                  boxShadow: "0 0 10px rgba(255,255,255,0.6), 0 0 20px rgba(200,170,240,0.3)",
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
