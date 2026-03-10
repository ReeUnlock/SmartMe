import { useState } from "react";
import { Flex, Heading, Icon, Box } from "@chakra-ui/react";
import { LuSettings } from "react-icons/lu";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);

  return (
    <Flex
      display={{ base: "flex", md: "none" }}
      align="center"
      justify="space-between"
      px="5"
      py="3"
      bg="white"
      borderBottomWidth="1px"
      borderColor="rose.100"
      shadow="0 1px 12px 0 rgba(231, 73, 128, 0.05)"
    >
      <Box
        cursor="pointer"
        onClick={() => navigate("/")}
        _active={{ transform: "scale(0.96)" }}
        transition="transform 0.15s"
      >
        {!logoError && (
          <img
            src="/logo-smartme.png"
            alt="SmartMe"
            style={{
              height: "56px",
              objectFit: "contain",
              display: logoLoaded ? "block" : "none",
            }}
            onLoad={() => setLogoLoaded(true)}
            onError={() => setLogoError(true)}
          />
        )}
        {(!logoLoaded || logoError) && (
          <Heading
            size="md"
            fontFamily="'Nunito', sans-serif"
            fontWeight="800"
            bgGradient="to-r"
            gradientFrom="rose.400"
            gradientTo="lavender.400"
            bgClip="text"
            letterSpacing="-0.02em"
          >
            SmartMe
          </Heading>
        )}
      </Box>
      <Flex
        align="center"
        justify="center"
        w="44px"
        h="44px"
        borderRadius="xl"
        cursor="pointer"
        transition="all 0.2s"
        bg="rose.50"
        _hover={{ bg: "rose.100" }}
        _active={{ transform: "scale(0.93)" }}
        onClick={() => navigate("/ustawienia")}
      >
        <Icon
          as={LuSettings}
          boxSize="18px"
          color="rose.400"
          transition="color 0.2s"
        />
      </Flex>
    </Flex>
  );
}
