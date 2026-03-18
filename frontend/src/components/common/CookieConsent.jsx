import { useState, useEffect } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { initPostHog } from "../../utils/posthog";
import { isIOS } from "../../utils/platform";

const CONSENT_KEY = "smartme_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isIOS()) return;
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    } else if (consent === "all") {
      initPostHog();
    }
  }, []);

  if (!visible) return null;

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "all");
    initPostHog();
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem(CONSENT_KEY, "essential");
    setVisible(false);
  };

  return (
    <Box
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      zIndex={610}
      pb={{ base: "calc(64px + env(safe-area-inset-bottom, 0px))", md: 0 }}
      bg="white"
      borderTop="1px solid"
      borderColor="gray.200"
      shadow="0 -2px 12px rgba(0,0,0,0.08)"
      px={4}
      py={4}
    >
      <Box maxW="430px" mx="auto">
        <Text fontSize="sm" color="gray.600" mb={3}>
          {"Używamy plików cookies do analityki. Możesz zaakceptować lub odrzucić."}
        </Text>
        <Flex gap={3} justify="flex-end">
          <Text
            as="button"
            fontSize="sm"
            color="gray.500"
            cursor="pointer"
            px={3}
            py={1.5}
            borderRadius="xl"
            borderWidth="1px"
            borderColor="gray.200"
            _hover={{ bg: "gray.50" }}
            onClick={reject}
          >
            {"Tylko niezbędne"}
          </Text>
          <Text
            as="button"
            fontSize="sm"
            fontWeight="600"
            bg="peach.400"
            color="white"
            cursor="pointer"
            px={4}
            py={1.5}
            borderRadius="xl"
            _hover={{ bg: "peach.500" }}
            onClick={accept}
          >
            {"Akceptuję"}
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}
