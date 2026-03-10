import { useState } from "react";
import { Box, Flex, Icon, Text, VStack, Heading } from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LuCalendar,
  LuShoppingCart,
  LuWallet,
  LuTarget,
  LuSettings,
  LuLogOut,
} from "react-icons/lu";
import { useAuth } from "../../hooks/useAuth";

const navItems = [
  { path: "/kalendarz", label: "Kalendarz", icon: LuCalendar, color: "sky.500", activeBg: "sky.50", textColor: "sky.700" },
  { path: "/zakupy", label: "Zakupy", icon: LuShoppingCart, color: "sage.500", activeBg: "sage.50", textColor: "sage.800" },
  { path: "/wydatki", label: "Wydatki", icon: LuWallet, color: "peach.500", activeBg: "peach.50", textColor: "peach.700" },
  { path: "/plany", label: "Cele", icon: LuTarget, color: "rose.400", activeBg: "rose.50", textColor: "rose.700" },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuth((s) => s.logout);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);

  return (
    <Box
      display={{ base: "none", md: "flex" }}
      flexDirection="column"
      w="230px"
      minH="100dvh"
      bg="white"
      borderRightWidth="1px"
      borderColor="rose.100"
      shadow="2px 0 12px 0 rgba(231, 73, 128, 0.04)"
      py="6"
      px="4"
    >
      <Box
        mb="8"
        px="2"
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
              height: "64px",
              objectFit: "contain",
              display: logoLoaded ? "block" : "none",
            }}
            onLoad={() => setLogoLoaded(true)}
            onError={() => setLogoError(true)}
          />
        )}
        {(!logoLoaded || logoError) && (
          <Heading
            size="lg"
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

      <VStack gap="1" flex="1" align="stretch">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Flex
              key={item.path}
              align="center"
              gap="3"
              px="3"
              py="2.5"
              borderRadius="xl"
              cursor="pointer"
              bg={isActive ? item.activeBg : "transparent"}
              _hover={{ bg: isActive ? item.activeBg : "gray.50" }}
              onClick={() => navigate(item.path)}
              transition="all 0.2s"
            >
              <Icon
                as={item.icon}
                boxSize="5"
                color={isActive ? item.color : "gray.400"}
              />
              <Text
                fontSize="sm"
                fontWeight={isActive ? "600" : "normal"}
                color={isActive ? item.textColor : "gray.500"}
              >
                {item.label}
              </Text>
            </Flex>
          );
        })}
      </VStack>

      <VStack gap="1" align="stretch" mt="4">
        <Flex
          align="center"
          gap="3"
          px="3"
          py="2.5"
          borderRadius="xl"
          cursor="pointer"
          _hover={{ bg: "gray.50" }}
          onClick={() => navigate("/ustawienia")}
        >
          <Icon as={LuSettings} boxSize="5" color="gray.400" />
          <Text fontSize="sm" color="gray.500">Ustawienia</Text>
        </Flex>
        <Flex
          align="center"
          gap="3"
          px="3"
          py="2.5"
          borderRadius="xl"
          cursor="pointer"
          _hover={{ bg: "rose.50" }}
          onClick={logout}
        >
          <Icon as={LuLogOut} boxSize="5" color="gray.400" />
          <Text fontSize="sm" color="gray.500">Wyloguj</Text>
        </Flex>
      </VStack>
    </Box>
  );
}
