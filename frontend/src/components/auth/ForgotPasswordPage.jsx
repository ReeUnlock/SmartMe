import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { forgotPassword } from "../../api/auth";
import SmartMeLogo from "../common/SmartMeLogo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Hasła nie są identyczne.");
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
                {"Hasło zostało zmienione"}
              </Text>
              <Text color="textSecondary" fontSize="sm" textAlign="center">
                {"Możesz teraz zalogować się nowym hasłem."}
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
              {"Odzyskaj dostęp do konta"}
            </Text>
          </VStack>

          <VStack gap="3" w="full">
            <Input
              type="email"
              placeholder="Adres email powiązany z kontem"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              borderRadius="xl"
              size="lg"
              borderColor="gray.200"
              _focus={{ borderColor: "rose.300", boxShadow: "0 0 0 1px var(--chakra-colors-rose-300)" }}
            />
            <Input
              type="password"
              placeholder={"Nowe hasło (min. 6 znaków)"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              borderRadius="xl"
              size="lg"
              borderColor="gray.200"
              _focus={{ borderColor: "rose.300", boxShadow: "0 0 0 1px var(--chakra-colors-rose-300)" }}
            />
            <Input
              type="password"
              placeholder={"Powtórz nowe hasło"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {"Zmień hasło"}
          </Button>

          <Text fontSize="sm" color="gray.400">
            <RouterLink to="/login">
              <Text as="span" color="rose.400" _hover={{ textDecoration: "underline" }}>
                {"Wróć do logowania"}
              </Text>
            </RouterLink>
          </Text>
        </VStack>
      </Box>
    </Flex>
  );
}
