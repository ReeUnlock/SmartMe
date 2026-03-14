import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Flex, Heading, Text, Input, Button, VStack } from "@chakra-ui/react";
import { LuShieldCheck, LuArrowLeft } from "react-icons/lu";
import { adminApi } from "../../api/admin";

export default function AdminLoginPage() {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!key.trim()) return;
    setError("");
    setLoading(true);

    // Temporarily store key to test it
    sessionStorage.setItem("admin_key", key.trim());
    try {
      await adminApi.health();
      // Key is valid — reload to enter admin
      window.location.href = "/admin";
    } catch {
      sessionStorage.removeItem("admin_key");
      setError("Nieprawidłowy klucz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex
      minH="100vh"
      bg="gray.900"
      align="center"
      justify="center"
      px={4}
    >
      <Box
        as="form"
        onSubmit={handleSubmit}
        bg="gray.800"
        borderRadius="xl"
        p={8}
        w="100%"
        maxW="400px"
        borderWidth="1px"
        borderColor="gray.700"
      >
        <VStack gap={5}>
          <Flex align="center" gap={2} color="gray.400">
            <LuShieldCheck size={20} />
            <Text fontSize="sm" fontWeight="600" letterSpacing="wider" textTransform="uppercase">
              {"SmartMe Admin"}
            </Text>
          </Flex>

          <Heading size="lg" color="gray.100" textAlign="center">
            {"Panel administracyjny"}
          </Heading>

          <Box w="100%">
            <Input
              type="password"
              placeholder="Klucz administratora"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              bg="gray.900"
              borderColor="gray.600"
              color="gray.100"
              _placeholder={{ color: "gray.500" }}
              size="lg"
            />
          </Box>

          {error && (
            <Text color="red.400" fontSize="sm">
              {error}
            </Text>
          )}

          <Button
            type="submit"
            w="100%"
            bg="blue.500"
            color="white"
            size="lg"
            loading={loading}
            _hover={{ bg: "blue.600" }}
          >
            {"Zaloguj się"}
          </Button>

          <Button
            variant="ghost"
            color="gray.500"
            size="sm"
            onClick={() => navigate("/")}
            _hover={{ color: "gray.300" }}
          >
            <LuArrowLeft />
            {"Wróć do aplikacji"}
          </Button>
        </VStack>
      </Box>
    </Flex>
  );
}
