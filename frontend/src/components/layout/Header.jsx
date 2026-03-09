import { Flex, Heading, Icon } from "@chakra-ui/react";
import { LuSettings } from "react-icons/lu";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  return (
    <Flex
      display={{ base: "flex", md: "none" }}
      align="center"
      justify="space-between"
      px="4"
      py="2.5"
      bg="white"
      borderBottomWidth="1px"
      borderColor="rose.100"
      shadow="0 1px 8px 0 rgba(231, 73, 128, 0.06)"
    >
      <Heading
        size="md"
        fontFamily="'Nunito', sans-serif"
        fontWeight="800"
        bgGradient="to-r"
        gradientFrom="rose.400"
        gradientTo="lavender.400"
        bgClip="text"
        letterSpacing="-0.02em"
        cursor="pointer"
        onClick={() => navigate("/")}
      >
        Anelka
      </Heading>
      <Icon
        as={LuSettings}
        boxSize="5"
        color="gray.400"
        cursor="pointer"
        onClick={() => navigate("/ustawienia")}
        _hover={{ color: "rose.400" }}
        transition="color 0.2s"
      />
    </Flex>
  );
}
