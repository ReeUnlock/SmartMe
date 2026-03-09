import { useState } from "react";
import {
  Box, Flex, Text, Input, Heading,
} from "@chakra-ui/react";

export default function NewListDialog({ open, onClose, onSubmit, isLoading }) {
  const [name, setName] = useState("");

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
      setName("");
    }
  };

  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={2000}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Box
        position="absolute"
        inset={0}
        bg="blackAlpha.400"
        onClick={onClose}
      />
      <Box
        as="form"
        onSubmit={handleSubmit}
        bg="white"
        borderRadius="2xl"
        p={6}
        w="90%"
        maxW="380px"
        shadow="xl"
        position="relative"
        zIndex={1}
      >
        <Heading size="md" mb={4} color="sage.700" fontFamily="'Nunito', sans-serif">
          Nowa lista zakupów
        </Heading>
        <Input
          placeholder="Nazwa listy, np. Biedronka"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          mb={4}
          borderColor="sage.200"
          _focus={{ borderColor: "sage.400", boxShadow: "0 0 0 1px var(--chakra-colors-sage-400)" }}
        />
        <Flex gap={3} justify="flex-end">
          <Text
            as="button"
            type="button"
            onClick={onClose}
            color="gray.500"
            fontWeight="500"
            cursor="pointer"
            px={4}
            py={2}
            _hover={{ color: "gray.700" }}
          >
            Anuluj
          </Text>
          <Text
            as="button"
            type="submit"
            bg="sage.500"
            color="white"
            fontWeight="600"
            px={5}
            py={2}
            borderRadius="lg"
            cursor="pointer"
            opacity={!name.trim() || isLoading ? 0.5 : 1}
            _hover={{ bg: "sage.600" }}
          >
            {isLoading ? "Tworzę…" : "Utwórz"}
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}
