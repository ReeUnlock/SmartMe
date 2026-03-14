import { Text } from "@chakra-ui/react";

export default function CostBadge({ cost }) {
  let color = "green.400";
  if (cost > 0.1) color = "orange.400";
  else if (cost > 0.01) color = "yellow.400";

  return (
    <Text fontSize="sm" fontWeight="600" color={color} fontFamily="mono">
      {"$"}{cost.toFixed(4)}
    </Text>
  );
}
