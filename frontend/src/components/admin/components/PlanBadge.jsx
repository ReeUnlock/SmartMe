import { Badge } from "@chakra-ui/react";

export default function PlanBadge({ plan }) {
  const isPro = plan === "pro";
  return (
    <Badge
      bg={isPro ? "blue.500/15" : "gray.600/30"}
      color={isPro ? "blue.300" : "gray.400"}
      fontSize="xs"
      px={2}
      py={0.5}
      borderRadius="md"
      fontWeight="600"
      textTransform="uppercase"
      letterSpacing="wide"
    >
      {isPro ? "Pro" : "Free"}
    </Badge>
  );
}
