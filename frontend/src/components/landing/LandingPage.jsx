import { Box, Container, Flex, Text, Button, SimpleGrid, VStack, HStack, Image } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import PricingSection from "../billing/PricingSection";
import { isIOS } from "../../utils/platform";

const FEATURES = [
  {
    icon: "📅",
    title: "Kalendarz",
    description: "Planuj dni, powtarzające się wydarzenia i szybkie szablony.",
  },
  {
    icon: "🛒",
    title: "Zakupy",
    description: "Listy zakupów z kategoriami, szablonami i historią produktów.",
  },
  {
    icon: "💰",
    title: "Wydatki",
    description: "Śledzenie budżetu, cykliczne wydatki i skanowanie paragonów.",
  },
  {
    icon: "🎯",
    title: "Cele i plany",
    description: "Cele oszczędnościowe, kamienie milowe i bucket lista marzeń.",
  },
  {
    icon: "🎤",
    title: "Asystent głosowy",
    description: "Dodawaj wydarzenia i wydatki głosem — AI rozumie kontekst.",
  },
  {
    icon: "✨",
    title: "Gamifikacja",
    description: "Iskry, poziomy, odznaki i wyzwania motywujące do działania.",
  },
];

function HeroSection() {
  const navigate = useNavigate();

  return (
    <Box
      position="relative"
      overflow="hidden"
      py={{ base: 16, md: 24 }}
      textAlign="center"
    >
      {/* Ambient blobs */}
      <Box
        position="absolute"
        top="-100px"
        right="-80px"
        w="300px"
        h="300px"
        borderRadius="full"
        bg="rose.100"
        opacity={0.4}
        filter="blur(60px)"
        className="sm-blob-drift-1"
      />
      <Box
        position="absolute"
        bottom="-60px"
        left="-60px"
        w="250px"
        h="250px"
        borderRadius="full"
        bg="peach.100"
        opacity={0.4}
        filter="blur(60px)"
        className="sm-blob-drift-2"
      />

      <Container maxW="3xl" position="relative">
        <VStack gap={6}>
          <Image
            src="/icons/icon-192.png"
            alt="SmartMe"
            w={16}
            h={16}
            borderRadius="2xl"
          />
          <Text
            fontSize={{ base: "3xl", md: "5xl" }}
            fontWeight="extrabold"
            fontFamily="heading"
            color="textPrimary"
            lineHeight="1.1"
          >
            {"Twój personalny hub"}
            <br />
            <Text
              as="span"
              bgGradient="to-r"
              gradientFrom="rose.400"
              gradientTo="peach.400"
              bgClip="text"
            >
              {"zarządzania życiem"}
            </Text>
          </Text>

          <Text
            fontSize={{ base: "md", md: "lg" }}
            color="textSecondary"
            maxW="xl"
          >
            {"Kalendarz, zakupy, wydatki, cele — wszystko w jednej ciepłej apce. Mobile-first, prywatna, z gamifikacją."}
          </Text>

          <HStack gap={4} flexWrap="wrap" justify="center">
            <Button
              onClick={() => navigate("/setup")}
              bgGradient="to-r"
              gradientFrom="rose.400"
              gradientTo="peach.400"
              color="white"
              borderRadius="full"
              size="lg"
              px={8}
              fontWeight="bold"
              _hover={{ opacity: 0.9 }}
            >
              {"Zacznij za darmo"}
            </Button>
            <Button
              onClick={() => navigate("/login")}
              variant="outline"
              borderColor="rose.200"
              color="rose.500"
              borderRadius="full"
              size="lg"
              px={8}
              fontWeight="bold"
              _hover={{ bg: "rose.50" }}
            >
              {"Zaloguj się"}
            </Button>
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <Box
      bg="white"
      borderRadius="2xl"
      shadow="0 1px 8px 0 rgba(0,0,0,0.04)"
      borderWidth="1px"
      borderColor="gray.100"
      p={5}
      textAlign="center"
      _hover={{
        shadow: "0 2px 12px 0 rgba(247,131,172,0.12)",
        borderColor: "rose.200",
      }}
      transition="all 0.2s"
    >
      <Text fontSize="3xl" mb={2}>{icon}</Text>
      <Text fontWeight="bold" color="textPrimary" mb={1}>{title}</Text>
      <Text fontSize="sm" color="textSecondary">{description}</Text>
    </Box>
  );
}

function FeaturesSection() {
  return (
    <Box py={{ base: 12, md: 16 }}>
      <Container maxW="4xl">
        <Text
          fontSize={{ base: "2xl", md: "3xl" }}
          fontWeight="extrabold"
          fontFamily="heading"
          textAlign="center"
          color="textPrimary"
          mb={8}
        >
          {"Wszystko, czego potrzebujesz"}
        </Text>
        <SimpleGrid columns={{ base: 2, md: 3 }} gap={4}>
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}

function PricingPageSection() {
  return (
    <Box py={{ base: 12, md: 16 }} bg="white">
      <Container maxW="3xl">
        <Text
          fontSize={{ base: "2xl", md: "3xl" }}
          fontWeight="extrabold"
          fontFamily="heading"
          textAlign="center"
          color="textPrimary"
          mb={2}
        >
          {"Prosty cennik"}
        </Text>
        <Text
          fontSize="md"
          color="textSecondary"
          textAlign="center"
          mb={8}
        >
          {"Zacznij za darmo. Ulepsz, gdy będziesz gotowa."}
        </Text>
        <PricingSection />
      </Container>
    </Box>
  );
}

function LandingFooter() {
  return (
    <Box py={6} textAlign="center" borderTopWidth="1px" borderColor="gray.100">
      <Container maxW="4xl">
        <HStack justify="center" gap={6} fontSize="xs" color="textTertiary" flexWrap="wrap">
          <Text
            as="a"
            href="/privacy-policy.html"
            _hover={{ color: "textSecondary" }}
          >
            {"Polityka prywatności"}
          </Text>
          <Text color="gray.300">{"·"}</Text>
          <Text>{"© 2026 SmartMe"}</Text>
        </HStack>
      </Container>
    </Box>
  );
}

export default function LandingPage() {
  return (
    <Box bg="bg" minH="100dvh">
      <HeroSection />
      <FeaturesSection />
      {!isIOS() && <PricingPageSection />}
      <LandingFooter />
    </Box>
  );
}
