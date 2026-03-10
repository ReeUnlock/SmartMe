import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  Input,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { setup, checkAuthStatus } from "../../api/auth";
import { useAuth } from "../../hooks/useAuth";
import SmartMeLogo from "../common/SmartMeLogo";

export default function SetupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
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
      const fromReset = sessionStorage.getItem("anelka_from_reset");
      if (fromReset) {
        sessionStorage.removeItem("anelka_from_reset");
        return;
      }

      checkAuthStatus()
        .then((data) => {
          if (data.setup_completed) {
            navigate("/login", { replace: true });
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
      const data = await setup({ username, email, password });
      setToken(data.access_token);
      await loadUser();
      navigate("/witaj", { replace: true });
    } catch (err) {
      setError(err.message);
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
              {"Stwórz swoje konto"}
            </Text>
          </VStack>

          <VStack gap="3" w="full">
            <Input
              placeholder="Nazwa użytkownika"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="off"
              borderRadius="xl"
              size="lg"
              borderColor="gray.200"
              _focus={{ borderColor: "rose.300", boxShadow: "0 0 0 1px var(--chakra-colors-rose-300)" }}
            />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="off"
              borderRadius="xl"
              size="lg"
              borderColor="gray.200"
              _focus={{ borderColor: "rose.300", boxShadow: "0 0 0 1px var(--chakra-colors-rose-300)" }}
            />
            <Input
              type="password"
              placeholder={"Hasło (min. 6 znaków)"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
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
            {"Rozpocznij"}
          </Button>
        </VStack>
      </Box>
    </Flex>
  );
}
