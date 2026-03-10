import { Box } from "@chakra-ui/react";

export const HEART_COLORS = ["#FF3B4D", "#E63946", "#FF4A5E"];
export const STAR_COLORS = ["#FFD700", "#FFC857", "#FFDF6B"];

export function HeartSvg({ size = 12, color = "#E63946" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

export function StarSvg({ size = 12, color = "#FFD700" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2l2.09 6.26L20.18 9l-5.09 3.74L16.18 19 12 15.77 7.82 19l1.09-6.26L3.82 9l6.09-.74z" />
    </svg>
  );
}

export function AmbientSparkle({ top, left, delay, dur }) {
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
        animation: `avatarAmbientSparkle ${dur}s ease-in-out ${delay}s infinite`,
        opacity: 0,
      }}
    />
  );
}

export function TapParticles({ active, particles }) {
  if (!active) return null;
  return (
    <>
      {particles.map((p, i) => {
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
              animation: `avatarTapParticle 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.04}s forwards`,
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
}
