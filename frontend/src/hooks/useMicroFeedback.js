import { useCallback, useRef } from "react";

/**
 * Lightweight micro-interaction hook.
 *
 * Triggers CSS animation classes from motion.css on a target element,
 * then removes them after the animation completes. No state, no re-renders.
 *
 * Usage:
 *   const { ref, trigger } = useMicroFeedback();
 *   <Box ref={ref} onClick={() => trigger("sm-complete")} />
 *
 * Or with a callback ref:
 *   const { trigger } = useMicroFeedback();
 *   trigger("sm-pop", someElement);
 */
export default function useMicroFeedback() {
  const elRef = useRef(null);

  const trigger = useCallback((animClass, targetEl) => {
    const el = targetEl || elRef.current;
    if (!el) return;

    // Remove class first to allow re-triggering
    el.classList.remove(animClass);

    // Force reflow to reset the animation
    // eslint-disable-next-line no-unused-expressions
    el.offsetWidth;

    el.classList.add(animClass);

    const onEnd = () => {
      el.classList.remove(animClass);
      el.removeEventListener("animationend", onEnd);
    };
    el.addEventListener("animationend", onEnd, { once: true });

    // Safety fallback — remove class after max animation time
    setTimeout(() => {
      el.classList.remove(animClass);
    }, 1000);
  }, []);

  return { ref: elRef, trigger };
}
