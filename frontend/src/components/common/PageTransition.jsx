import { Box } from "@chakra-ui/react";

/**
 * Lightweight page transition wrapper.
 * Applies a soft blur-fade + tiny float on mount via CSS animation.
 * Key this component by route path to re-trigger on navigation.
 */
export default function PageTransition({ children }) {
  return (
    <Box className="sm-page-enter">
      {children}
    </Box>
  );
}
