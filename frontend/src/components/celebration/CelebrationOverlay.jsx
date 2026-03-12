import { useEffect, useRef, useCallback } from "react";
import useCelebration from "../../hooks/useCelebration";
import {
  CELEBRATION_TYPES,
  CELEBRATION_PALETTES,
  Z,
  EASING,
  PARTICLE_SAFETY_TIMEOUT,
} from "../../config/motionConfig";

// ─── Intensity hierarchy (tuned for emotional weight) ────────────
//
//   progress    → barely-there acknowledgment (3 tiny sparkles, no glow)
//   affirmation → gentle warmth (6 sparkles, soft rose glow)
//   reward      → satisfying burst (10 sparkles, peach glow)
//   achievement → ceremonial reveal (14 sparkles, rose halo, longer)
//   levelup     → peak moment (20 sparkles, warm halo, biggest glow)

// Track all active particle elements for safety cleanup
const activeElements = new Set();

function safeRemove(el) {
  activeElements.delete(el);
  if (el.parentNode) el.remove();
}

function createParticle(config, type, index, total, originX, originY, intensity) {
  const palette = CELEBRATION_PALETTES[type] || CELEBRATION_PALETTES.reward;
  const angle = (Math.PI * 2 * index) / total + (Math.random() - 0.5) * 0.7;
  const spread = config.particleSpread * intensity;
  const dist = spread * (0.35 + Math.random() * 0.65);
  const tx = Math.cos(angle) * dist;
  const ty = Math.sin(angle) * dist - (spread * 0.15);
  const size = config.particleSizeMin + Math.random() * (config.particleSizeMax - config.particleSizeMin);
  const color = palette[index % palette.length];
  const delay = index * (120 / total) + Math.random() * 30;
  const dur = config.duration * (0.55 + Math.random() * 0.45);
  const maxOpacity = config.particleOpacity * intensity;

  const el = document.createElement("div");
  el.style.cssText = `
    position: fixed;
    left: ${originX}%;
    top: ${originY}%;
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    pointer-events: none;
    z-index: ${Z.celebrationParticle};
    opacity: 0;
    background: ${color};
    will-change: transform, opacity;
  `;

  let start = null;
  let safetyTimer = null;

  const animate = (ts) => {
    if (!start) start = ts;
    const elapsed = ts - start - delay;
    if (elapsed < 0) {
      requestAnimationFrame(animate);
      return;
    }
    const progress = Math.min(elapsed / dur, 1);
    // Ease out quartic for smoother deceleration
    const ease = 1 - Math.pow(1 - progress, 4);
    const fadeIn = Math.min(progress * 6, 1);
    const fadeOut = progress > 0.55 ? 1 - (progress - 0.55) / 0.45 : 1;
    const opacity = fadeIn * fadeOut * maxOpacity;
    const scale = 0.2 + ease * 0.8;
    const x = tx * ease;
    const y = ty * ease;

    el.style.opacity = opacity.toFixed(3);
    el.style.transform = `translate(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px)) scale(${scale.toFixed(3)})`;

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      clearTimeout(safetyTimer);
      safeRemove(el);
    }
  };

  // Safety timeout: force-remove particle if RAF loop fails
  safetyTimer = setTimeout(() => safeRemove(el), PARTICLE_SAFETY_TIMEOUT);

  return { el, animate };
}

function createGlow(config, originX, originY, intensity) {
  const { glowColor, glowSize, duration, glowOpacity } = config;
  const size = glowSize * intensity;
  const el = document.createElement("div");
  el.style.cssText = `
    position: fixed;
    left: ${originX}%;
    top: ${originY}%;
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    pointer-events: none;
    z-index: ${Z.celebrationGlow};
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.2);
    background: radial-gradient(circle, rgba(${glowColor},${(glowOpacity * 0.5).toFixed(2)}) 0%, rgba(${glowColor},${(glowOpacity * 0.15).toFixed(2)}) 40%, transparent 70%);
    will-change: transform, opacity;
  `;

  let start = null;
  let safetyTimer = null;

  const animate = (ts) => {
    if (!start) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    // Ease out cubic
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const fadeOut = progress > 0.4 ? 1 - (progress - 0.4) / 0.6 : 1;
    const scale = 0.2 + easeOut * 1.3;

    el.style.opacity = (fadeOut * glowOpacity * intensity).toFixed(3);
    el.style.transform = `translate(-50%, -50%) scale(${scale.toFixed(3)})`;

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      clearTimeout(safetyTimer);
      safeRemove(el);
    }
  };

  // Safety timeout
  safetyTimer = setTimeout(() => safeRemove(el), PARTICLE_SAFETY_TIMEOUT);

  return { el, animate };
}

// Reduce particle count on mobile for smoother animations
const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

function runCelebration(type, options = {}) {
  const config = CELEBRATION_TYPES[type] || CELEBRATION_TYPES.reward;
  const originX = options.originX ?? 50;
  const originY = options.originY ?? 50;
  const intensity = Math.max(0.3, Math.min(2, options.intensity ?? 1));

  // Glow (skipped for progress — too subtle to need it; skip on mobile for perf)
  if (config.glow && !isMobile) {
    const glow = createGlow(config, originX, originY, intensity);
    document.body.appendChild(glow.el);
    activeElements.add(glow.el);
    requestAnimationFrame(glow.animate);
  }

  // Particles — halved on mobile
  const baseCount = Math.round(config.count * intensity);
  const count = isMobile ? Math.max(2, Math.round(baseCount * 0.5)) : baseCount;
  const particles = [];
  for (let i = 0; i < count; i++) {
    const p = createParticle(config, type, i, count, originX, originY, intensity);
    document.body.appendChild(p.el);
    activeElements.add(p.el);
    particles.push(p);
  }
  requestAnimationFrame((ts) => {
    for (const p of particles) p.animate(ts);
  });

  return config.duration + 50;
}

/**
 * Force-clean all active celebration particles from the DOM.
 * Called as a safety measure on unmount or navigation.
 */
export function cleanupAllParticles() {
  for (const el of activeElements) {
    if (el.parentNode) el.remove();
  }
  activeElements.clear();
}

export default function CelebrationOverlay() {
  const active = useCelebration((s) => s.active);
  const dismiss = useCelebration((s) => s.dismiss);
  const lastIdRef = useRef(null);

  const stableDismiss = useCallback(dismiss, [dismiss]);

  useEffect(() => {
    if (!active || active.id === lastIdRef.current) return;
    lastIdRef.current = active.id;

    const totalDuration = runCelebration(active.type, active.options);
    const timer = setTimeout(stableDismiss, totalDuration);
    return () => clearTimeout(timer);
  }, [active, stableDismiss]);

  // Cleanup all particles on unmount (route change safety net)
  useEffect(() => {
    return () => cleanupAllParticles();
  }, []);

  return null;
}
