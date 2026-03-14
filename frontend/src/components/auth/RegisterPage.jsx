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
import { register } from "../../api/auth";
import { useAuth } from "../../hooks/useAuth";
import SmartMeLogo from "../common/SmartMeLogo";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { token, user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (token && user) {
      navigate(user.onboarding_completed ? "/" : "/witaj", { replace: true });
    }
  }, [navigate, token, user, isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Hasła nie są identyczne.");
      return;
    }

    setLoading(true);
    try {
      await register({ username, email, password });
      setSuccess(true);
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

  if (success) {
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
          <VStack gap="5" align="center">
            <SmartMeLogo height="56px" />
            <VStack gap="2">
              <Text fontWeight="600" color="textPrimary" fontSize="lg">
                {"Sprawdź swoją skrzynkę email"}
              </Text>
              <Text color="textSecondary" fontSize="sm" textAlign="center">
                {"Wysłaliśmy link weryfikacyjny na adres "}
                <Text as="span" fontWeight="600">{email}</Text>
                {". Kliknij w link aby aktywować konto."}
              </Text>
            </VStack>
            <Button
              w="full"
              size="lg"
              borderRadius="xl"
              bg="rose.400"
              color="white"
              _hover={{ bg: "rose.500" }}
              shadow="0 2px 12px 0 rgba(231, 73, 128, 0.25)"
              onClick={() => navigate("/login", { replace: true })}
            >
              {"Przejdź do logowania"}
            </Button>
          </VStack>
        </Box>
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
              placeholder={"Hasło (min. 8 znaków)"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              borderRadius="xl"
              size="lg"
              borderColor="gray.200"
              _focus={{ borderColor: "rose.300", boxShadow: "0 0 0 1px var(--chakra-colors-rose-300)" }}
            />
            <Input
              type="password"
              placeholder={"Powtórz hasło"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
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
            {"Zarejestruj się"}
          </Button>

          <Text fontSize="sm" color="gray.400">
            {"Masz już konto? "}
            <RouterLink to="/login">
              <Text as="span" color="rose.400" fontWeight="600" _hover={{ textDecoration: "underline" }}>
                {"Zaloguj się"}
              </Text>
            </RouterLink>
          </Text>
        </VStack>
      </Box>
    </Flex>
  );
}
