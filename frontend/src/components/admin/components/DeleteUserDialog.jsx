import { useState } from "react";
import {
  Box,
  Flex,
  Text,
  Heading,
  Input,
  Button,
  VStack,
  List,
} from "@chakra-ui/react";
import { LuTriangleAlert } from "react-icons/lu";

export default function DeleteUserDialog({ email, loading, onConfirm, onCancel }) {
  const [confirmEmail, setConfirmEmail] = useState("");

  const emailMatches =
    confirmEmail.trim().toLowerCase() === email.toLowerCase();

  return (
    <Box>
      <Flex align="center" gap={2} mb={4}>
        <LuTriangleAlert size={20} color="#F87171" />
        <Heading size="md" color="gray.100">
          {"Usuń konto użytkownika"}
        </Heading>
      </Flex>

      <VStack gap={4} align="stretch">
        <Text color="gray.300" fontSize="sm">
          {"Tej operacji nie można cofnąć. Zostaną usunięte:"}
        </Text>

        <List.Root gap={1} ps={4}>
          <List.Item color="gray.400" fontSize="sm">
            {"Wszystkie wydarzenia, wydatki, listy zakupów"}
          </List.Item>
          <List.Item color="gray.400" fontSize="sm">
            {"Cele, nagrody, historia"}
          </List.Item>
          <List.Item color="gray.400" fontSize="sm">
            {"Dane subskrypcji"}
          </List.Item>
        </List.Root>

        <Box>
          <Text color="gray.400" fontSize="sm" mb={2}>
            {"Wpisz adres email użytkownika aby potwierdzić:"}
          </Text>
          <Text color="gray.300" fontSize="sm" fontWeight="600" mb={2}>
            {email}
          </Text>
          <Input
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            placeholder="email@example.com"
            bg="gray.900"
            borderColor="gray.600"
            color="gray.100"
            _placeholder={{ color: "gray.500" }}
            size="sm"
            autoFocus
          />
        </Box>

        <Flex gap={3} justify="flex-end" pt={2}>
          <Button
            variant="ghost"
            color="gray.400"
            size="sm"
            onClick={onCancel}
            disabled={loading}
            _hover={{ color: "gray.200" }}
          >
            {"Anuluj"}
          </Button>
          <Button
            bg="red.500"
            color="white"
            size="sm"
            disabled={!emailMatches || loading}
            loading={loading}
            onClick={onConfirm}
            _hover={{ bg: "red.600" }}
          >
            {"Usuń permanentnie"}
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
}
