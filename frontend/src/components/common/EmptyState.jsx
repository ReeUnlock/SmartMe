import { Flex, Icon, Text } from "@chakra-ui/react";

/**
 * Reusable empty state with entrance animation.
 *
 * Provides consistent look & feel across all modules.
 * Uses sm-empty-enter class from motion.css for a soft float-up entrance.
 *
 * @param {Object} props
 * @param {React.ElementType} props.icon — lucide-react icon component
 * @param {string} props.title — heading text
 * @param {string} [props.description] — helper text
 * @param {string} [props.color="rose"] — module accent color (rose, sage, peach, sky, lavender)
 * @param {React.ReactNode} [props.children] — optional CTA button below description
 */
export default function EmptyState({ icon, title, description, color = "rose", children }) {
  return (
    <Flex
      className="sm-empty-enter"
      direction="column"
      align="center"
      justify="center"
      py={16}
      px={6}
      gap={3}
    >
      {icon && (
        <Flex
          align="center"
          justify="center"
          w="64px"
          h="64px"
          borderRadius="full"
          bg={`${color}.50`}
          mb={1}
        >
          <Icon
            as={icon}
            boxSize="28px"
            color={`${color}.300`}
            strokeWidth="1.5"
          />
        </Flex>
      )}
      <Text
        fontSize="md"
        fontWeight="700"
        color="textSecondary"
        textAlign="center"
      >
        {title}
      </Text>
      {description && (
        <Text
          fontSize="sm"
          color="textTertiary"
          textAlign="center"
          maxW="260px"
          lineHeight="1.5"
        >
          {description}
        </Text>
      )}
      {children}
    </Flex>
  );
}
