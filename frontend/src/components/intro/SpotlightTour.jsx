import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Box, Flex, Text, Heading, Button, VStack } from "@chakra-ui/react";
import { Z } from "../../config/motionConfig";

const SWIPE_THRESHOLD = 50;
const PAD = 10;
const RADIUS = 16;
const CARD_MAX_W = 320;
const CARD_MARGIN = 16;

function getTargetRect(targetId) {
  const el = document.getElementById(targetId);
  if (!el) return null;
  return el.getBoundingClientRect();
}

export default function SpotlightTour({ steps, isOpen, onFinish }) {
  const [current, setCurrent] = useState(0);
  const [rect, setRect] = useState(null);
  const [cardH, setCardH] = useState(0);
  const touchStartRef = useRef(null);
  const cardRef = useRef(null);

  const step = steps[current];
  const isLast = current === steps.length - 1;

  const recalculate = useCallback(() => {
    if (!step) return;
    const id = typeof step.targetId === "string" ? step.targetId : step.targetId;
    setRect(getTargetRect(id));
  }, [step]);

  useEffect(() => {
    if (!isOpen) {
      setCurrent(0);
      return;
    }
    recalculate();
  }, [isOpen, current, recalculate]);

  // Measure card height after render
  useLayoutEffect(() => {
    if (isOpen && cardRef.current) {
      setCardH(cardRef.current.offsetHeight);
    }
  }, [isOpen, current]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = () => recalculate();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [isOpen, recalculate]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") onFinish();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onFinish]);

  const handleTouchStart = useCallback((e) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      if (!touchStartRef.current) return;
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      touchStartRef.current = null;
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;
      if (dx < 0 && current < steps.length - 1) {
        setCurrent((c) => c + 1);
      } else if (dx > 0 && current > 0) {
        setCurrent((c) => c - 1);
      }
    },
    [current, steps.length]
  );

  const handleNext = useCallback(() => {
    if (isLast) {
      onFinish();
    } else {
      setCurrent((c) => c + 1);
    }
  }, [isLast, onFinish]);

  if (!isOpen || !step) return null;

  const isWelcome = !!step.isWelcome;
  const hasTarget = !!rect;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Spotlight hole coords
  const hx = hasTarget ? rect.left - PAD : 0;
  const hy = hasTarget ? rect.top - PAD : 0;
  const hw = hasTarget ? rect.width + PAD * 2 : 0;
  const hh = hasTarget ? rect.height + PAD * 2 : 0;

  const effectiveCardH = cardH || 300;
  const BOTTOM_SAFE = 16;

  let cardTop;
  if (!hasTarget) {
    cardTop = Math.max(CARD_MARGIN, (vh - effectiveCardH) / 2);
  } else {
    const spaceBelow = vh - (hy + hh) - CARD_MARGIN - BOTTOM_SAFE;
    const spaceAbove = hy - CARD_MARGIN;

    if (spaceBelow >= effectiveCardH) {
      cardTop = hy + hh + CARD_MARGIN;
    } else if (spaceAbove >= effectiveCardH) {
      cardTop = hy - CARD_MARGIN - effectiveCardH;
    } else {
      cardTop = Math.max(CARD_MARGIN, (vh - effectiveCardH) / 2);
    }
  }

  cardTop = Math.min(cardTop, vh - effectiveCardH - BOTTOM_SAFE);
  cardTop = Math.max(CARD_MARGIN, cardTop);

  let cardLeft = hasTarget
    ? rect.left + rect.width / 2 - CARD_MAX_W / 2
    : (vw - CARD_MAX_W) / 2;
  cardLeft = Math.max(CARD_MARGIN, Math.min(cardLeft, vw - CARD_MAX_W - CARD_MARGIN));

  if (isWelcome) {
    return createPortal(
      <Box
        position="fixed"
        inset="0"
        zIndex={Z.tour}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Dark overlay — no cutout */}
        <Box
          position="fixed"
          inset="0"
          bg="rgba(0,0,0,0.6)"
          className="sm-fade-in"
        />

        {/* Click blocker */}
        <Box position="fixed" inset="0" />

        {/* Welcome card — centered */}
        <Flex
          position="fixed"
          inset="0"
          align="center"
          justify="center"
          pointerEvents="none"
        >
          <Box
            ref={cardRef}
            bg="white"
            borderRadius="2xl"
            shadow="0 4px 24px 0 rgba(0,0,0,0.12)"
            p={6}
            maxW="320px"
            w="calc(100vw - 32px)"
            pointerEvents="auto"
            className="sm-page-enter"
            key={current}
            textAlign="center"
          >
            <img
              src="/logo-smartme.png"
              alt="SmartMe"
              style={{ height: 48, display: "block", margin: "0 auto 16px" }}
            />
            <Heading
              size="md"
              fontFamily="'Nunito', sans-serif"
              fontWeight="800"
              color="textPrimary"
            >
              {step.title}
            </Heading>
            <Text
              fontSize="sm"
              color="textSecondary"
              textAlign="center"
              lineHeight="tall"
              whiteSpace="pre-line"
              mt={3}
            >
              {step.body}
            </Text>
            <Button
              w="100%"
              mt={5}
              color="white"
              borderRadius="xl"
              fontWeight="700"
              _hover={{ opacity: 0.9 }}
              style={{ background: step.gradient }}
              onClick={handleNext}
            >
              {step.cta}
            </Button>
          </Box>
        </Flex>
      </Box>,
      document.body
    );
  }

  return createPortal(
    <Box
      position="fixed"
      inset="0"
      zIndex={Z.tour}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* SVG overlay with cutout */}
      <svg
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
        className="sm-fade-in"
      >
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {hasTarget && (
              <rect
                x={hx}
                y={hy}
                width={hw}
                height={hh}
                rx={RADIUS}
                ry={RADIUS}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.6)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* White ring around spotlight */}
      {hasTarget && (
        <Box
          position="fixed"
          left={`${hx}px`}
          top={`${hy}px`}
          width={`${hw}px`}
          height={`${hh}px`}
          borderRadius="2xl"
          boxShadow="0 0 0 4px white"
          pointerEvents="none"
          className="sm-fade-in"
        />
      )}

      {/* Click blocker */}
      <Box position="fixed" inset="0" />

      {/* Step card */}
      <Box
        ref={cardRef}
        position="fixed"
        top={`${cardTop}px`}
        left={`${cardLeft}px`}
        width={`min(${CARD_MAX_W}px, calc(100vw - ${CARD_MARGIN * 2}px))`}
        bg="white"
        borderRadius="2xl"
        shadow="0 4px 24px 0 rgba(0,0,0,0.12)"
        p={5}
        className="sm-page-enter"
        key={current}
      >
        <Text fontSize="xs" color="textTertiary" mb={2}>
          {current} / {steps.length - 1}
        </Text>

        <Flex align="center" gap={2} mb={3}>
          <Text fontSize="xl" lineHeight="1">{step.icon}</Text>
          <Heading
            size="sm"
            fontFamily="'Nunito', sans-serif"
            fontWeight="700"
            color="textPrimary"
          >
            {step.title}
          </Heading>
        </Flex>

        <VStack align="stretch" gap={1.5} mb={4}>
          {step.hints.map((hint, i) => (
            <Flex key={i} align="flex-start" gap={2}>
              <Box
                w="5px"
                h="5px"
                borderRadius="full"
                bg={step.gradient || step.color}
                mt="7px"
                flexShrink={0}
                style={step.gradient ? { background: step.gradient } : undefined}
              />
              <Text fontSize="sm" color="textSecondary" lineHeight="tall">
                {hint}
              </Text>
            </Flex>
          ))}
        </VStack>

        <Flex justify="space-between" align="center">
          <Button
            variant="ghost"
            size="sm"
            color="textTertiary"
            fontWeight="500"
            borderRadius="xl"
            onClick={onFinish}
            _hover={{ bg: "gray.50" }}
          >
            {"Pomi\u0144"}
          </Button>
          <Button
            size="sm"
            color="white"
            borderRadius="xl"
            fontWeight="600"
            bg={step.gradient ? undefined : step.color}
            _hover={{ opacity: 0.9 }}
            style={step.gradient ? { background: step.gradient } : undefined}
            onClick={handleNext}
          >
            {isLast ? "Zacznijmy!" : "Dalej"}
          </Button>
        </Flex>
      </Box>
    </Box>,
    document.body
  );
}
