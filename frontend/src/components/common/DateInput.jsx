import { useState, useRef, useEffect, useCallback, forwardRef } from "react";
import { createPortal } from "react-dom";
import { Box, Flex, Text } from "@chakra-ui/react";
import { LuCalendar, LuChevronLeft, LuChevronRight, LuX } from "react-icons/lu";

const MONTH_NAMES = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];
const DAY_LABELS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

function toDateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function formatDatePL(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Reusable date picker with Portal-based calendar popup.
 *
 * Props:
 *   value        – ISO date string "YYYY-MM-DD" or ""
 *   onChange      – receives ISO date string
 *   accentColor  – module color token prefix (e.g. "peach", "rose", "sky", "sage")
 *   placeholder  – placeholder text
 *   clearable    – show clear button when value is set
 *   required     – HTML required attribute
 *   label        – optional label text rendered above the input
 */
export default function DateInput({
  value,
  onChange,
  accentColor = "gray",
  placeholder = "Wybierz dat\u0119",
  clearable = false,
  required = false,
  label,
  ...rest
}) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const popupRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  // Calculate popup position relative to viewport
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popupH = 320;
    const popupW = 300;
    const pad = 8;

    let top = rect.bottom + 4;
    let left = rect.left;

    // If popup would go below viewport, show above
    if (top + popupH > window.innerHeight - pad) {
      top = rect.top - popupH - 4;
    }
    // If still out of bounds (very small screen), pin to top
    if (top < pad) top = pad;

    // Horizontal: keep within viewport
    if (left + popupW > window.innerWidth - pad) {
      left = window.innerWidth - popupW - pad;
    }
    if (left < pad) left = pad;

    setPos({ top, left });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [isOpen, updatePosition]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        popupRef.current && !popupRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === "Escape") setIsOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  const handleSelect = (dateStr) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setIsOpen(false);
  };

  const accent = (shade) => `${accentColor}.${shade}`;

  return (
    <>
      {label && (
        <Text fontSize="sm" fontWeight="500" color="gray.600" mb={1}>{label}</Text>
      )}
      {/* Hidden native input for form validation */}
      {required && (
        <input
          type="date"
          value={value || ""}
          required
          tabIndex={-1}
          style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0 }}
          onChange={() => {}}
        />
      )}
      <Flex
        ref={triggerRef}
        align="center"
        gap={2}
        px={3}
        py={2}
        borderRadius="xl"
        borderWidth="1px"
        borderColor={isOpen ? accent(400) : accent(200)}
        bg="white"
        cursor="pointer"
        transition="all 0.2s"
        _hover={{ borderColor: accent(300) }}
        onClick={() => setIsOpen(!isOpen)}
        {...rest}
      >
        <Box as={LuCalendar} boxSize={4} color={accent(400)} flexShrink={0} />
        <Text flex={1} fontSize="sm" color={value ? "textSecondary" : "gray.400"} userSelect="none">
          {value ? formatDatePL(value) : placeholder}
        </Text>
        {clearable && value && (
          <Box
            as="button" type="button" p={0.5} borderRadius="full"
            _hover={{ bg: accent(100) }} onClick={handleClear}
          >
            <Box as={LuX} boxSize={3.5} color="gray.400" />
          </Box>
        )}
      </Flex>

      {isOpen && createPortal(
        <CalendarPopup
          ref={popupRef}
          value={value}
          onSelect={handleSelect}
          pos={pos}
          accentColor={accentColor}
        />,
        document.body
      )}
    </>
  );
}

/* ─── Calendar popup ──────────────────────────────────────── */

const CalendarPopup = forwardRef(function CalendarPopup({ value, onSelect, pos, accentColor }, ref) {
  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const initial = value ? new Date(value) : today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const accent = (shade) => `${accentColor}.${shade}`;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const firstDay = new Date(viewYear, viewMonth, 1);
  const startDow = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <Box
      ref={ref}
      position="fixed"
      top={`${pos.top}px`}
      left={`${pos.left}px`}
      zIndex={450}
      w="300px"
      bg="white"
      borderRadius="2xl"
      shadow="0 8px 30px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)"
      p={4}
      userSelect="none"
    >
      {/* Header */}
      <Flex align="center" justify="space-between" mb={3}>
        <Box
          as="button" type="button" onClick={prevMonth}
          p={1.5} borderRadius="lg" cursor="pointer"
          _hover={{ bg: accent(50) }} transition="all 0.15s"
        >
          <Box as={LuChevronLeft} boxSize={4} color={accent(500)} />
        </Box>
        <Text fontSize="sm" fontWeight="700" color={accent(700)}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </Text>
        <Box
          as="button" type="button" onClick={nextMonth}
          p={1.5} borderRadius="lg" cursor="pointer"
          _hover={{ bg: accent(50) }} transition="all 0.15s"
        >
          <Box as={LuChevronRight} boxSize={4} color={accent(500)} />
        </Box>
      </Flex>

      {/* Day labels */}
      <Flex mb={1}>
        {DAY_LABELS.map((dl, i) => (
          <Text
            key={dl} flex={1} textAlign="center"
            fontSize="2xs" fontWeight="600"
            color={i >= 5 ? accent(400) : "gray.400"}
          >
            {dl}
          </Text>
        ))}
      </Flex>

      {/* Day grid */}
      <Flex flexWrap="wrap">
        {cells.map((day, i) => {
          if (day === null) return <Box key={`e${i}`} flex="0 0 14.2857%" h={9} />;
          const dateStr = toDateStr(viewYear, viewMonth, day);
          const isSelected = dateStr === value;
          const isToday = dateStr === todayStr;
          const dow = i % 7;
          const isWeekend = dow >= 5;
          return (
            <Flex key={day} flex="0 0 14.2857%" h={9} align="center" justify="center">
              <Flex
                as="button" type="button" align="center" justify="center"
                w={8} h={8} borderRadius="full" cursor="pointer" fontSize="sm"
                fontWeight={isSelected || isToday ? "700" : "500"}
                bg={isSelected ? accent(400) : "transparent"}
                color={isSelected ? "white" : isToday ? accent(500) : isWeekend ? accent(400) : "gray.600"}
                borderWidth={isToday && !isSelected ? "1.5px" : "0"}
                borderColor={accent(300)}
                _hover={{ bg: isSelected ? accent(500) : accent(50) }}
                transition="all 0.15s"
                onClick={() => onSelect(dateStr)}
              >
                {day}
              </Flex>
            </Flex>
          );
        })}
      </Flex>

      {/* Today shortcut */}
      <Flex justify="center" mt={2}>
        <Text
          as="button" type="button" fontSize="xs" fontWeight="600"
          color={accent(500)} cursor="pointer" px={3} py={1}
          borderRadius="full" _hover={{ bg: accent(50) }}
          transition="all 0.15s"
          onClick={() => {
            setViewYear(today.getFullYear());
            setViewMonth(today.getMonth());
            onSelect(todayStr);
          }}
        >
          {"Dzisiaj"}
        </Text>
      </Flex>
    </Box>
  );
});
