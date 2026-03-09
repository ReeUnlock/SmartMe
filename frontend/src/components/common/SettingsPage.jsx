import { Box, Heading, Text, Button, VStack } from "@chakra-ui/react";
import { useAuth } from "../../hooks/useAuth";

export default function SettingsPage() {
  const { user, logout } = useAuth();

  return (
    <Box>
      <Heading size="lg" mb="4">
        Ustawienia
      </Heading>
      <VStack align="start" gap="4">
        {user && (
          <Box>
            <Text fontWeight="semibold">{user.username}</Text>
            <Text color="gray.500" fontSize="sm">{user.email}</Text>
          </Box>
        )}
        <Button
          variant="outline"
          colorScheme="red"
          onClick={logout}
          borderRadius="xl"
        >
          Wyloguj się
        </Button>
      </VStack>
    </Box>
  );
}
