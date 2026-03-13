import { useState, useEffect } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  Input,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { login, checkAuthStatus } from "../../api/auth";
import { useAuth } from "../../hooks/useAuth";
import SmartMeLogo from "../common/SmartMeLogo";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setToken, loadUser, token, user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (token && user) {
      navigate(user.onboarding_completed ? "/" : "/witaj", { replace: true });
      return;
    }

    if (!token) {
      checkAuthStatus()
        .then((data) => {
          if (!data.setup_completed) {
            navigate("/setup", { replace: true });
          }
        })
        .catch(() => {});
    }
  }, [navigate, token, user, isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login({ username, password });
      setToken(data.access_token);
      await loadUser();
      const u = useAuth.getState().user;
      navigate(u?.onboarding_completed ? "/" : "/witaj", { replace: true });
    } catch (err) {
      setError(
        err.message === "Nieautoryzowany"
          ? "Nieprawidłowa nazwa użytkownika lub hasło"
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Flex minH="100dvh" align="center" justify="center">
        <Spinner size="lg" color="rose.400" />
      </Flex>
    );
  }

  return (
    <Flex
      minH="100dvh"
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
          <VStack gap="2" align="center">
            <SmartMeLogo height="56px" />
            <Text color="gray.400" fontSize="sm">
              {"Zaloguj się"}
            </Text>
          </VStack>

          <VStack gap="3" w="full">
            <Input
              placeholder="Nazwa użytkownika lub email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
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
              autoComplete="current-password"
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

          <VStack gap="1" w="full">
            <Text fontSize="sm" color="gray.400">
              <RouterLink to="/odzyskaj-haslo">
                <Text as="span" color="rose.400" _hover={{ textDecoration: "underline" }}>
                  {"Nie pamiętam hasła"}
                </Text>
              </RouterLink>
            </Text>
            <Text fontSize="sm" color="gray.400">
              {"Nie masz konta? "}
              <RouterLink to="/setup">
                <Text as="span" color="rose.400" fontWeight="600" _hover={{ textDecoration: "underline" }}>
                  {"Zarejestruj się"}
                </Text>
              </RouterLink>
            </Text>
          </VStack>
        </VStack>
      </Box>
    </Flex>
  );
}
