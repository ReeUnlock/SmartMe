import { Box, Flex, Text, Badge, Button, VStack } from "@chakra-ui/react";

export default function PricingCard({ plan, tier, isCurrent, onUpgrade, isLoading }) {
  const isPro = plan.plan === "pro";

  // Pricing: Free = "Za darmo", Pro uses tier (99 zł na 3 miesiące, 299 zł na rok)
  const pricePln = tier ? tier.price_pln : 0;
  const periodLabel = tier ? tier.label : null;

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      shadow="0 1px 8px 0 rgba(0,0,0,0.04)"
      borderWidth="2px"
      borderColor={isPro ? "rose.300" : "gray.100"}
      p={6}
      display="flex"
      flexDirection="column"
      gap={4}
      position="relative"
      overflow="hidden"
    >
      {isPro && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          h="3px"
          bgGradient="to-r"
          gradientFrom="rose.300"
          gradientTo="peach.400"
        />
      )}

      <Flex align="center" justify="space-between">
        <Text fontSize="xl" fontWeight="bold" color="textPrimary">
          {isPro ? "Pro" : "Free"}
        </Text>
        {isCurrent && (
          <Badge
            bg="rose.50"
            color="rose.500"
            borderRadius="full"
            px={3}
            py={1}
            fontSize="xs"
            fontWeight="bold"
          >
            {"Aktualny plan"}
          </Badge>
        )}
      </Flex>

      <Box>
        <Flex align="baseline" gap={1}>
          <Text fontSize="3xl" fontWeight="extrabold" color="textPrimary">
            {pricePln === 0 ? "Za darmo" : `${pricePln} zł`}
          </Text>
        </Flex>
        {periodLabel && (
          <Text fontSize="sm" color="textTertiary" mt={0.5}>
            {periodLabel}
          </Text>
        )}
      </Box>

      <VStack gap={2} align="stretch" flex={1}>
        {plan.features.map((f) => (
          <Flex key={f.key} justify="space-between" fontSize="sm">
            <Text color="textSecondary">{f.name_pl}</Text>
            <Text fontWeight="semibold" color={isPro ? "rose.500" : "textPrimary"}>
              {isPro ? f.pro_value : f.free_value}
            </Text>
          </Flex>
        ))}
      </VStack>

      {isPro && !isCurrent && onUpgrade && (
        <Button
          onClick={onUpgrade}
          loading={isLoading}
          bgGradient="to-r"
          gradientFrom="rose.400"
          gradientTo="peach.400"
          color="white"
          borderRadius="full"
          size="lg"
          fontWeight="bold"
          _hover={{ opacity: 0.9 }}
        >
          {"Ulepsz do Pro"}
        </Button>
      )}

      {!isPro && (
        <Button
          variant="outline"
          borderColor="gray.200"
          color="textSecondary"
          borderRadius="full"
          size="lg"
          fontWeight="bold"
          disabled
        >
          {"Twój obecny plan"}
        </Button>
      )}
    </Box>
  );
}
