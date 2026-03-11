import { useState, useEffect } from "react";

/**
 * Detects whether the iOS virtual keyboard is open.
 * Uses the VisualViewport API — when the keyboard opens,
 * visualViewport.height shrinks significantly below window.innerHeight.
 */
export function useKeyboardOpen() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const threshold = 100; // keyboard is at least ~100px

    const check = () => {
      const diff = window.innerHeight - vv.height;
      setIsOpen(diff > threshold);
    };

    vv.addEventListener("resize", check);
    vv.addEventListener("scroll", check);
    return () => {
      vv.removeEventListener("resize", check);
      vv.removeEventListener("scroll", check);
    };
  }, []);

  return isOpen;
}
