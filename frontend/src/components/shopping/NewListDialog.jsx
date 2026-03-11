import { useState } from "react";
import {
  Box, Flex, Text, Input, Heading, VStack,
} from "@chakra-ui/react";
import { useShoppingTemplates } from "../../hooks/useShoppingTemplates";
import BottomSheetDialog, { DialogActions } from "../common/BottomSheetDialog";

export default function NewListDialog({ open, onClose, onSubmit, isLoading }) {
  const [name, setName] = useState("");
  const [storeName, setStoreName] = useState("");
  const templates = useShoppingTemplates((s) => s.templates);
  const removeTemplate = useShoppingTemplates((s) => s.removeTemplate);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), storeName.trim() || null);
      setName("");
      setStoreName("");
    }
  };

  const handleUseTemplate = (tpl) => {
    onSubmit(tpl.name, tpl.store_name, tpl.items);
    setName("");
    setStoreName("");
  };

  return (
    <BottomSheetDialog open={open} onClose={onClose} maxW="380px" onSubmit={handleSubmit}>
      <Box p={6} pb={0}>
        <Heading size="md" mb={4} color="sage.700" fontFamily="'Nunito', sans-serif">
          Nowa lista zakupów
        </Heading>
        <VStack gap={3} align="stretch" mb={4}>
          <Input
            placeholder={"np. Tygodniowe zakupy"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            borderColor="sage.200"
            _focus={{ borderColor: "sage.400", boxShadow: "0 0 0 1px var(--chakra-colors-sage-400)" }}
          />
          <Input
            placeholder={"np. Biedronka"}
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            borderColor="sage.200"
            _focus={{ borderColor: "sage.400", boxShadow: "0 0 0 1px var(--chakra-colors-sage-400)" }}
            size="sm"
          />
        </VStack>

        {/* Templates section */}
        {templates.length > 0 && (
          <Box mb={4}>
            <Text fontSize="2xs" fontWeight="700" color="sage.500" textTransform="uppercase" mb={2} letterSpacing="0.04em">
              {"Z szablonu"}
            </Text>
            <Flex gap={1.5} flexWrap="wrap">
              {templates.map((tpl) => (
                <Box key={tpl.id} position="relative">
                  <Text
                    as="button"
                    type="button"
                    fontSize="xs"
                    fontWeight="600"
                    color="sage.600"
                    bg="sage.50"
                    px={3}
                    py={1.5}
                    borderRadius="full"
                    borderWidth="1px"
                    borderColor="sage.200"
                    cursor="pointer"
                    _hover={{ bg: "sage.100", borderColor: "sage.300" }}
                    _active={{ transform: "scale(0.96)" }}
                    transition="all 0.15s"
                    onClick={() => handleUseTemplate(tpl)}
                  >
                    {tpl.name}
                    {tpl.store_name && (
                      <Text as="span" color="sage.400" ml={1} fontSize="2xs">
                        ({tpl.store_name})
                      </Text>
                    )}
                    <Text as="span" color="sage.400" ml={1} fontSize="2xs">
                      {tpl.items.length}
                    </Text>
                  </Text>
                  {/* Remove template */}
                  <Box
                    as="button"
                    type="button"
                    position="absolute"
                    top="-5px"
                    right="-5px"
                    w="16px"
                    h="16px"
                    borderRadius="full"
                    bg="gray.200"
                    color="gray.500"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    _hover={{ bg: "red.100", color: "red.500" }}
                    transition="all 0.15s"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTemplate(tpl.id);
                    }}
                  >
                    <svg width="8" height="8" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Box>
                </Box>
              ))}
            </Flex>
          </Box>
        )}
      </Box>

      {/* Sticky actions */}
      <DialogActions>
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
            _hover={{ color: "textSecondary" }}
          >
            Anuluj
          </Text>
          <Text
            as="button"
            type="submit"
            bg="sage.400"
            color="white"
            fontWeight="600"
            px={5}
            py={2}
            borderRadius="xl"
            cursor="pointer"
            opacity={!name.trim() || isLoading ? 0.5 : 1}
            _hover={{ bg: "sage.500" }}
          >
            {isLoading ? "Tworzę…" : "Utwórz"}
          </Text>
        </Flex>
      </DialogActions>
    </BottomSheetDialog>
  );
}
