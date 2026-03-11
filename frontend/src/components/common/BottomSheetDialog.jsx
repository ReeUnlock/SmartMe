import { useEffect, useRef, useCallback } from "react";

/**
 * Shared bottom-sheet dialog wrapper.
 * Mobile: slides up from bottom (flat bottom corners).
 * Desktop: centered modal (all corners rounded).
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - maxW: string (default "420px")
 *  - children: content (use <form> inside if needed)
 *  - as: element type for content wrapper (default "div")
 *  - onSubmit: form submit handler (sets as="form")
 *  - className: extra class on content
 */
export default function BottomSheetDialog({
  open,
  onClose,
  maxW = "420px",
  children,
  as: Tag = "div",
  onSubmit,
  className = "",
}) {
  const contentRef = useRef(null);

  // Lock scroll on the app's scroll container when open
  useEffect(() => {
    if (!open) return;
    const scrollRoot = document.querySelector("[data-scroll-root]");
    if (scrollRoot) scrollRoot.style.overflowY = "hidden";
    return () => {
      if (scrollRoot) scrollRoot.style.overflowY = "";
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  if (!open) return null;

  const tagProps = Tag === "form" || onSubmit ? { onSubmit } : {};
  const ActualTag = onSubmit ? "form" : Tag;

  return (
    <>
      <div className="sm-dialog-backdrop" onClick={onClose} />
      <div className="sm-dialog-container" onClick={handleBackdropClick}>
        <ActualTag
          ref={contentRef}
          className={`sm-dialog-content ${className}`.trim()}
          style={{ maxWidth: maxW }}
          onClick={(e) => e.stopPropagation()}
          {...tagProps}
        >
          {children}
        </ActualTag>
      </div>
    </>
  );
}

/**
 * Sticky action footer for dialogs.
 * Usage: <DialogActions>...buttons...</DialogActions>
 */
export function DialogActions({ children, style, ...rest }) {
  return (
    <div className="sm-dialog-actions" style={style} {...rest}>
      {children}
    </div>
  );
}
