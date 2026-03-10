import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
} from "@chakra-ui/react";
import { completeOnboarding } from "../../api/auth";
import { useAuth } from "../../hooks/useAuth";
import SmartMeLogo from "../common/SmartMeLogo";
import AVATAR_CONFIG, {
  saveSelectedAvatar,
  getSelectedAvatar,
} from "../affirmation/avatarConfig";

const UNLOCKED_AVATARS = AVATAR_CONFIG.filter((a) => a.requiredLevel <= 1);

function WelcomeStep({ username, onNext }) {
  return (
    <VStack gap="6" textAlign="center">
      <SmartMeLogo height="48px" />
      <VStack gap="2">
        <Heading
          size="lg"
          fontFamily="'Nunito', sans-serif"
          fontWeight="800"
          color="gray.700"
        >
          {`Cześć, ${username}!`}
        </Heading>
        <Text color="gray.400" fontSize="md" maxW="280px" lineHeight="tall">
          {"Cieszę się, że tu jesteś. SmartMe pomoże Ci zaplanować dzień, ogarnąć zakupy i celebrować małe sukcesy."}
        </Text>
      </VStack>
      <Button
        size="lg"
        borderRadius="xl"
        bg="rose.400"
        color="white"
        _hover={{ bg: "rose.500" }}
        shadow="0 2px 12px 0 rgba(231, 73, 128, 0.25)"
        onClick={onNext}
        w="full"
        maxW="280px"
      >
        {"Zaczynamy!"}
      </Button>
    </VStack>
  );
}

function AvatarStep({ onNext }) {
  const [selected, setSelected] = useState(getSelectedAvatar(1));

  const handleContinue = () => {
    saveSelectedAvatar(selected);
    onNext();
  };

  return (
    <VStack gap="6" textAlign="center">
      <VStack gap="2">
        <Heading
          size="md"
          fontFamily="'Nunito', sans-serif"
          fontWeight="700"
          color="gray.700"
        >
          {"Wybierz swoją towarzyszkę"}
        </Heading>
        <Text color="gray.400" fontSize="sm" maxW="280px">
          {"Będzie Ci towarzyszyć i dodawać otuchy. Możesz ją zmienić później."}
        </Text>
      </VStack>

      <HStack gap="4" justify="center" flexWrap="wrap">
        {UNLOCKED_AVATARS.map((avatar) => {
          const isSelected = selected === avatar.key;
          const AvatarComponent = avatar.component;
          return (
            <Box
              key={avatar.key}
              onClick={() => setSelected(avatar.key)}
              cursor="pointer"
              borderRadius="2xl"
              borderWidth="2px"
              borderColor={isSelected ? "rose.300" : "gray.100"}
              bg={isSelected ? "rose.50" : "white"}
              p="4"
              transition="all 0.2s"
              shadow={isSelected ? "0 2px 12px 0 rgba(231, 73, 128, 0.15)" : "0 1px 4px 0 rgba(0,0,0,0.04)"}
              _hover={{ borderColor: "rose.200", shadow: "0 2px 8px 0 rgba(231, 73, 128, 0.1)" }}
              textAlign="center"
              minW="120px"
            >
              <Box mx="auto" w="64px" h="64px" mb="2">
                <AvatarComponent phase="idle" />
              </Box>
              <Text fontSize="sm" fontWeight="600" color="gray.700">
                {avatar.name}
              </Text>
              <Text fontSize="xs" color="gray.400">
                {avatar.icon}
              </Text>
            </Box>
          );
        })}
      </HStack>

      <Button
        size="lg"
        borderRadius="xl"
        bg="rose.400"
        color="white"
        _hover={{ bg: "rose.500" }}
        shadow="0 2px 12px 0 rgba(231, 73, 128, 0.25)"
        onClick={handleContinue}
        w="full"
        maxW="280px"
      >
        {"Dalej"}
      </Button>
    </VStack>
  );
}

function ReadyStep({ onFinish, loading, error }) {
  return (
    <VStack gap="6" textAlign="center">
      <Text fontSize="4xl">{"🌸"}</Text>
      <VStack gap="2">
        <Heading
          size="md"
          fontFamily="'Nunito', sans-serif"
          fontWeight="700"
          color="gray.700"
        >
          {"Wszystko gotowe!"}
        </Heading>
        <Text color="gray.400" fontSize="sm" maxW="280px">
          {"Twoje miejsce jest przygotowane. Odkrywaj, planuj i celebruj każdy dzień."}
        </Text>
        {error && (
          <Text color="red.400" fontSize="xs" fontWeight="600">{error}</Text>
        )}
      </VStack>
      <Button
        size="lg"
        borderRadius="xl"
        bg="rose.400"
        color="white"
        _hover={{ bg: "rose.500" }}
        shadow="0 2px 12px 0 rgba(231, 73, 128, 0.25)"
        onClick={onFinish}
        loading={loading}
        w="full"
        maxW="280px"
      >
        {"Wchodzę!"}
      </Button>
    </VStack>
  );
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const handleFinish = async () => {
    setFinishing(true);
    setError("");
    try {
      const updatedUser = await completeOnboarding();
      setUser(updatedUser);
      navigate("/", { replace: true });
    } catch {
      setError("Coś poszło nie tak. Spróbuj ponownie.");
      setFinishing(false);
    }
  };

  const steps = [
    <WelcomeStep
      key="welcome"
      username={user?.username || ""}
      onNext={() => setStep(1)}
    />,
    <AvatarStep key="avatar" onNext={() => setStep(2)} />,
    <ReadyStep key="ready" onFinish={handleFinish} loading={finishing} error={error} />,
  ];

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
        maxW="420px"
        borderWidth="1px"
        borderColor="rose.100"
      >
        <HStack justify="center" mb="6" gap="2">
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              w="8px"
              h="8px"
              borderRadius="full"
              bg={i <= step ? "rose.400" : "gray.200"}
              transition="background 0.3s"
            />
          ))}
        </HStack>

        {steps[step]}
      </Box>
    </Flex>
  );
}
