import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { login, checkAuthStatus, resetAccount } from "../../api/auth";
import { useAuth } from "../../hooks/useAuth";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setToken, loadUser, token } = useAuth();

  useEffect(() => {
    if (token) {
      navigate("/", { replace: true });
      return;
    }
    checkAuthStatus().then((data) => {
      if (!data.setup_completed) {
        navigate("/setup", { replace: true });
      }
    });
  }, [navigate, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login({ username, password });
      setToken(data.access_token);
      await loadUser();
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      p="4"
      bgGradient="to-br"
      gradientFrom="rose.50"
      gradientVia="white"
      gradientTo="lavender.50"
    >
      <Box
        bg="white"
        p="8"
        borderRadius="2xl"
        shadow="0 4px 24px 0 rgba(231, 73, 128, 0.1)"
        w="full"
        maxW="400px"
        borderWidth="1px"
        borderColor="rose.100"
      >
        <VStack gap="6" as="form" onSubmit={handleSubmit}>
          <VStack gap="1">
            <Heading
              size="xl"
              fontFamily="'Nunito', sans-serif"
              fontWeight="800"
              bgGradient="to-r"
              gradientFrom="rose.400"
              gradientTo="lavender.400"
              bgClip="text"
              letterSpacing="-0.02em"
            >
              Anelka
            </Heading>
            <Text color="gray.500" fontSize="sm">
              Zaloguj się
            </Text>
          </VStack>

          <VStack gap="3" w="full">
            <Input
              placeholder="Nazwa użytkownika"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              borderRadius="xl"
              size="lg"
              borderColor="gray.200"
              _focus={{ borderColor: "rose.300", boxShadow: "0 0 0 1px var(--chakra-colors-rose-300)" }}
            />
            <Input
              type="password"
              placeholder="Hasło"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              borderRadius="xl"
              size="lg"
              borderColor="gray.200"
              _focus={{ borderColor: "rose.300", boxShadow: "0 0 0 1px var(--chakra-colors-rose-300)" }}
            />
          </VStack>

          {error && (
            <Text color="red.500" fontSize="sm">
              {error}
            </Text>
          )}

          <Button
            type="submit"
            w="full"
            size="lg"
            borderRadius="xl"
            bg="rose.400"
            color="white"
            _hover={{ bg: "rose.500" }}
            shadow="0 2px 12px 0 rgba(231, 73, 128, 0.25)"
            loading={loading}
          >
            Zaloguj
          </Button>

          <Button
            variant="ghost"
            size="sm"
            color="gray.400"
            _hover={{ color: "rose.400" }}
            onClick={async () => {
              if (window.confirm("Na pewno chcesz usunąć konto i utworzyć nowe?")) {
                await resetAccount();
                localStorage.removeItem("token");
                navigate("/setup", { replace: true });
              }
            }}
          >
            Resetuj konto
          </Button>
        </VStack>
      </Box>
    </Flex>
  );
}
