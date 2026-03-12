import { useEffect, useRef, useState, useCallback, Children, isValidElement } from "react";

/**
 * Shared bottom-sheet dialog wrapper.
 * Mobile: slides up from bottom (flat bottom corners).
 * Desktop: centered modal (all corners rounded).
 *
 * iOS keyboard handling:
 *   On iOS Safari, position:fixed uses the layout viewport which does NOT
 *   shrink when the virtual keyboard opens. We listen to visualViewport
 *   resize events and adjust the container height to match the actual
 *   visible area, keeping DialogActions visible above the keyboard.
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
  const [vvHeight, setVvHeight] = useState(null);

  // Lock scroll on the app's scroll container when open
  useEffect(() => {
    if (!open) return;
    const scrollRoot = document.querySelector("[data-scroll-root]");
    if (scrollRoot) scrollRoot.style.overflowY = "hidden";
    return () => {
      if (scrollRoot) scrollRoot.style.overflowY = "";
    };
  }, [open]);

  // Track visualViewport height for iOS keyboard handling
  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      // Only apply when viewport is noticeably smaller than window
      // (keyboard is open). Use offsetTop to position correctly.
      const windowH = window.innerHeight;
      const viewH = vv.height;
      if (windowH - viewH > 100) {
        setVvHeight(viewH + vv.offsetTop);
      } else {
        setVvHeight(null);
      }
    };

    vv.addEventListener("resize", handleResize);
    vv.addEventListener("scroll", handleResize);
    // Initial check in case keyboard is already open
    handleResize();
    return () => {
      vv.removeEventListener("resize", handleResize);
      vv.removeEventListener("scroll", handleResize);
      setVvHeight(null);
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

  // When iOS keyboard is open, constrain to visual viewport
  const kbdOpen = vvHeight != null;
  const containerStyle = kbdOpen
    ? { height: `${vvHeight}px`, top: 0, bottom: "auto" }
    : undefined;
  // Override CSS max-height (90dvh uses layout viewport, not visual)
  const contentStyle = kbdOpen
    ? { maxWidth: maxW, maxHeight: `${vvHeight}px` }
    : { maxWidth: maxW };

  // Split children: body content scrolls, DialogActions stays anchored
  const childArray = Children.toArray(children);
  const actionsIdx = childArray.findIndex(
    (child) => isValidElement(child) && child.type === DialogActions,
  );
  let bodyChildren, actionsChildren;
  if (actionsIdx >= 0) {
    bodyChildren = childArray.slice(0, actionsIdx);
    actionsChildren = childArray.slice(actionsIdx);
  } else {
    bodyChildren = childArray;
    actionsChildren = [];
  }

  return (
    <>
      <div className="sm-dialog-backdrop" onClick={onClose} />
      <div
        className="sm-dialog-container"
        onClick={handleBackdropClick}
        style={containerStyle}
        data-kbd-open={kbdOpen || undefined}
      >
        <ActualTag
          ref={contentRef}
          className={`sm-dialog-content ${className}`.trim()}
          style={contentStyle}
          onClick={(e) => e.stopPropagation()}
          {...tagProps}
        >
          <div className="sm-dialog-body">{bodyChildren}</div>
          {actionsChildren}
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
