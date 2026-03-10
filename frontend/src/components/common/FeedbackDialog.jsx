import { useState } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { LuMessageCircle, LuX } from "react-icons/lu";
import { apiFetch } from "../../api/client";

const CATEGORIES = [
  { value: "bug", label: "Błąd" },
  { value: "idea", label: "Pomysł" },
  { value: "opinion", label: "Opinia" },
  { value: "broken", label: "Coś nie działa" },
];

export default function FeedbackDialog({ isOpen, onClose, onSuccess }) {
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("opinion");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setMessage("");
    setCategory("opinion");
    setEmail("");
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError("Wpisz wiadomość.");
      return;
    }
    setSending(true);
    setError("");
    try {
      await apiFetch("/feedback", {
        method: "POST",
        body: JSON.stringify({
          message: message.trim(),
          category,
          email: email.trim() || null,
          user_agent: navigator.userAgent,
        }),
      });
      reset();
      onClose();
      onSuccess?.();
    } catch (err) {
      setError(err.message || "Nie udało się wysłać opinii.");
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <Box
        position="fixed"
        inset="0"
        bg="blackAlpha.400"
        zIndex="1400"
        onClick={handleClose}
      />
      {/* Dialog */}
      <Flex
        position="fixed"
        inset="0"
        zIndex="1401"
        align="center"
        justify="center"
        px={4}
        onClick={handleClose}
      >
        <Box
          bg="white"
          borderRadius="2xl"
          shadow="xl"
          w="100%"
          maxW="440px"
          p={6}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <Flex justify="space-between" align="center" mb={4}>
            <HStack gap="2">
              <Flex
                align="center"
                justify="center"
                w="32px"
                h="32px"
                borderRadius="lg"
                bg="lavender.50"
              >
                <Icon as={LuMessageCircle} boxSize="16px" color="lavender.400" />
              </Flex>
              <Heading size="sm" fontWeight="700" color="gray.700">
                {"Wyślij opinię"}
              </Heading>
            </HStack>
            <Box
              as="button"
              onClick={handleClose}
              p={1}
              borderRadius="lg"
              _hover={{ bg: "gray.100" }}
              transition="background 0.15s"
            >
              <Icon as={LuX} boxSize="18px" color="gray.400" />
            </Box>
          </Flex>

          <VStack gap={4} align="stretch">
            {/* Category pills */}
            <Box>
              <Text fontSize="xs" fontWeight="600" color="gray.500" mb={2}>
                {"Kategoria"}
              </Text>
              <Flex gap={2} flexWrap="wrap">
                {CATEGORIES.map((cat) => (
                  <Button
                    key={cat.value}
                    size="xs"
                    borderRadius="full"
                    bg={category === cat.value ? "lavender.400" : "gray.100"}
                    color={category === cat.value ? "white" : "gray.600"}
                    _hover={{
                      bg: category === cat.value ? "lavender.500" : "gray.200",
                    }}
                    fontWeight="500"
                    onClick={() => setCategory(cat.value)}
                    px={3}
                  >
                    {cat.label}
                  </Button>
                ))}
              </Flex>
            </Box>

            {/* Message */}
            <Box>
              <Text fontSize="xs" fontWeight="600" color="gray.500" mb={2}>
                {"Wiadomość"}
              </Text>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Co możemy poprawić? Co Ci się podoba?"
                borderRadius="xl"
                borderColor="gray.200"
                _focus={{
                  borderColor: "lavender.300",
                  boxShadow: "0 0 0 1px var(--chakra-colors-lavender-300)",
                }}
                rows={4}
                resize="none"
                fontSize="sm"
                maxLength={2000}
              />
            </Box>

            {/* Email */}
            <Box>
              <Text fontSize="xs" fontWeight="600" color="gray.500" mb={2}>
                {"E-mail (opcjonalnie)"}
              </Text>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Jeśli chcesz otrzymać odpowiedź"
                borderRadius="xl"
                borderColor="gray.200"
                _focus={{
                  borderColor: "lavender.300",
                  boxShadow: "0 0 0 1px var(--chakra-colors-lavender-300)",
                }}
                size="sm"
                type="email"
              />
            </Box>

            {error && (
              <Text color="red.500" fontSize="xs">
                {error}
              </Text>
            )}

            {/* Buttons */}
            <HStack justify="flex-end" pt={1}>
              <Button
                size="sm"
                variant="ghost"
                borderRadius="xl"
                onClick={handleClose}
              >
                {"Anuluj"}
              </Button>
              <Button
                size="sm"
                bg="lavender.400"
                color="white"
                _hover={{ bg: "lavender.500" }}
                borderRadius="xl"
                onClick={handleSubmit}
                loading={sending}
                px={5}
              >
                {"Wyślij"}
              </Button>
            </HStack>
          </VStack>
        </Box>
      </Flex>
    </>
  );
}
