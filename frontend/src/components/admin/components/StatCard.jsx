import { Box, Flex, Text } from "@chakra-ui/react";

export default function StatCard({ label, value, icon, color = "blue.400", onClick }) {
  return (
    <Box
      bg="gray.800"
      borderRadius="xl"
      p={5}
      borderWidth="1px"
      borderColor="gray.700"
      {...(onClick && {
        onClick,
        cursor: "pointer",
        _hover: { borderColor: "gray.600", bg: "gray.750" },
        transition: "all 0.15s",
      })}
    >
      <Flex justify="space-between" align="flex-start">
        <Box>
          <Text fontSize="sm" color="gray.400" mb={1}>
            {label}
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color="gray.100">
            {value}
          </Text>
        </Box>
        {icon && (
          <Flex
            w="40px"
            h="40px"
            borderRadius="lg"
            bg={`${color}/10`}
            align="center"
            justify="center"
            color={color}
            fontSize="lg"
          >
            {icon}
          </Flex>
        )}
      </Flex>
    </Box>
  );
}
