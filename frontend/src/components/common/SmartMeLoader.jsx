import { Flex, Text } from "@chakra-ui/react";

/**
 * SmartMe branded loader — three breathing dots in module accent color.
 *
 * Replaces generic Chakra Spinner with a softer, on-brand loading indicator.
 * Uses CSS animation classes from motion.css (sm-loader-dot).
 *
 * @param {Object} props
 * @param {"rose"|"sage"|"peach"|"sky"|"lavender"} [props.color="rose"] — module accent
 * @param {"sm"|"md"|"lg"} [props.size="md"] — dot size variant
 * @param {string} [props.label] — optional loading message below dots
 * @param {number} [props.py=12] — vertical padding
 */

const DOT_SIZES = {
  sm: { dot: "5px", gap: 6 },
  md: { dot: "6px", gap: 7 },
  lg: { dot: "8px", gap: 8 },
};

const COLOR_MAP = {
  rose: "#FAA2C1",
  sage: "#63E6BE",
  peach: "#FCAF8A",
  sky: "#74C0FC",
  lavender: "#B197FC",
};

export default function SmartMeLoader({ color = "rose", size = "md", label, py = 12 }) {
  const { dot, gap } = DOT_SIZES[size] || DOT_SIZES.md;
  const bg = COLOR_MAP[color] || COLOR_MAP.rose;

  return (
    <Flex direction="column" align="center" justify="center" py={py} gap={3}>
      <Flex gap={`${gap}px`} align="center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="sm-loader-dot"
            style={{
              width: dot,
              height: dot,
              backgroundColor: bg,
            }}
          />
        ))}
      </Flex>
      {label && (
        <Text fontSize="xs" fontWeight="500" color="textTertiary">
          {label}
        </Text>
      )}
    </Flex>
  );
}
