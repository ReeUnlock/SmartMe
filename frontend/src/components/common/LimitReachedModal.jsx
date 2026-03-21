import { useNavigate } from "react-router-dom";
import {
  Box,
  Text,
  Button,
  VStack,
  Icon,
} from "@chakra-ui/react";
import { LuLock } from "react-icons/lu";
import { create } from "zustand";
import { isIOS } from "../../utils/platform";
import BottomSheetDialog from "./BottomSheetDialog";

export const useLimitModal = create((set) => ({
  isOpen: false,
  message: "",
  open: (message) => set({ isOpen: true, message }),
  close: () => set({ isOpen: false, message: "" }),
}));

export default function LimitReachedModal() {
  const { isOpen, message, close } = useLimitModal();
  const navigate = useNavigate();
  const ios = isIOS();

  return (
    <BottomSheetDialog open={isOpen} onClose={close}>
      <VStack gap="4" py={2} align="center">
        <Box
          w="56px"
          h="56px"
          borderRadius="full"
          bg="rose.50"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon as={LuLock} boxSize="24px" color="rose.400" />
        </Box>

        <Text
          fontWeight="700"
          fontSize="lg"
          color="gray.700"
          fontFamily="'Nunito', sans-serif"
          textAlign="center"
        >
          {"Limit planu Free"}
        </Text>

        <Text fontSize="sm" color="gray.500" textAlign="center" lineHeight="tall">
          {message}
        </Text>

        {ios ? (
          <Box w="100%" bg="rose.50" borderRadius="xl" p={3} textAlign="center">
            <Text fontSize="sm" color="rose.700" fontWeight="600">
              {"Odblokuj SmartMe Pro"}
            </Text>
            <Text fontSize="xs" color="rose.600" mt={1}>
              {"Odwiedź smartme.life w przeglądarce, aby aktywować plan Pro."}
            </Text>
          </Box>
        ) : (
          <Button
            w="100%"
            size="md"
            bgGradient="to-r"
            gradientFrom="rose.400"
            gradientTo="peach.400"
            color="white"
            _hover={{ opacity: 0.9 }}
            borderRadius="xl"
            onClick={() => {
              close();
              navigate("/ustawienia");
            }}
          >
            {"Przejdź na Pro"}
          </Button>
        )}

        <Button
          w="100%"
          size="sm"
          variant="ghost"
          color="gray.400"
          borderRadius="xl"
          onClick={close}
        >
          {"Zamknij"}
        </Button>
      </VStack>
    </BottomSheetDialog>
  );
}
