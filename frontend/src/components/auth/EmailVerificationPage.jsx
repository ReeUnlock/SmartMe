import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  Input,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { verifyEmail, resendVerification } from "../../api/auth";
import SmartMeLogo from "../common/SmartMeLogo";

export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendSent, setResendSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("Brak tokenu weryfikacyjnego w linku.");
      return;
    }

    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setErrorMsg(err.message || "Link wygasł lub jest nieprawidłowy");
      });
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    setResendLoading(true);
    try {
      await resendVerification(resendEmail);
      setResendSent(true);
    } catch {
      // Always show success to not reveal email existence
      setResendSent(true);
    } finally {
      setResendLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <Flex minH="100dvh" align="center" justify="center">
        <VStack gap="4">
          <Spinner size="lg" color="rose.400" />
          <Text color="textSecondary" fontSize="sm">
            {"Weryfikujemy Twój email..."}
          </Text>
        </VStack>
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
        {status === "success" ? (
          <VStack gap="5" align="center">
            <SmartMeLogo height="56px" />
            <VStack gap="2">
              <Text fontWeight="600" color="textPrimary" fontSize="lg">
                {"Email zweryfikowany!"}
              </Text>
              <Text color="textSecondary" fontSize="sm" textAlign="center">
                {"Twoje konto jest aktywne. Możesz się teraz zalogować."}
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
              {"Zaloguj się"}
            </Button>
          </VStack>
        ) : (
          <VStack gap="5" align="center">
            <SmartMeLogo height="56px" />
            <VStack gap="2">
              <Text fontWeight="600" color="textPrimary" fontSize="lg">
                {"Link wygasł lub jest nieprawidłowy"}
              </Text>
              <Text color="textSecondary" fontSize="sm" textAlign="center">
                {errorMsg}
              </Text>
            </VStack>

            {!resendSent ? (
              <VStack gap="3" w="full" as="form" onSubmit={handleResend}>
                <Text color="textSecondary" fontSize="sm" textAlign="center">
                  {"Podaj email, aby wysłać nowy link weryfikacyjny:"}
                </Text>
                <Input
                  type="email"
                  placeholder="Twój adres email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  required
                  autoComplete="email"
                  borderRadius="xl"
                  size="lg"
                  borderColor="gray.200"
                  _focus={{ borderColor: "rose.300", boxShadow: "0 0 0 1px var(--chakra-colors-rose-300)" }}
                />
                <Button
                  type="submit"
                  w="full"
                  size="lg"
                  borderRadius="xl"
                  bg="rose.400"
                  color="white"
                  _hover={{ bg: "rose.500" }}
                  shadow="0 2px 12px 0 rgba(231, 73, 128, 0.25)"
                  loading={resendLoading}
                >
                  {"Wyślij ponownie"}
                </Button>
              </VStack>
            ) : (
              <Text color="green.500" fontSize="sm" textAlign="center">
                {"Jeśli email istnieje w systemie, wysłaliśmy nowy link weryfikacyjny."}
              </Text>
            )}

            <Text fontSize="sm" color="gray.400">
              <RouterLink to="/login">
                <Text as="span" color="rose.400" _hover={{ textDecoration: "underline" }}>
                  {"Wróć do logowania"}
                </Text>
              </RouterLink>
            </Text>
          </VStack>
        )}
      </Box>
    </Flex>
  );
}
