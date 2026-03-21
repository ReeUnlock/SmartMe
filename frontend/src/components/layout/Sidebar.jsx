import { useState } from "react";
import { Box, Flex, Icon, Text, VStack, Heading, Badge } from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  LuCalendar,
  LuShoppingCart,
  LuWallet,
  LuTarget,
  LuSettings,
  LuLogOut,
  LuSparkles,
} from "react-icons/lu";
import { useAuth } from "../../hooks/useAuth";
import useIntroTour from "../../hooks/useIntroTour";
import { getSubscription } from "../../api/billing";

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
  const openTour = useIntroTour((s) => s.openTour);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { data: sub } = useQuery({
    queryKey: ["billing", "subscription"],
    queryFn: getSubscription,
    staleTime: 60_000,
  });
  const isPro = sub?.plan === "pro";

  return (
    <Box
      id="sidebar-nav"
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
        {sub && (
          <Badge
            mt="2"
            alignSelf="flex-start"
            borderRadius="full"
            px={2}
            py={0.5}
            fontSize="2xs"
            fontWeight="bold"
            bg={isPro ? "peach.50" : "gray.100"}
            color={isPro ? "peach.500" : "gray.500"}
          >
            {isPro ? "Pro" : "Free"}
          </Badge>
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
                color={item.color}
                opacity={isActive ? 1 : 0.7}
                strokeWidth={isActive ? "2.5" : "1.8"}
              />
              <Text
                fontSize="sm"
                fontWeight={isActive ? "600" : "500"}
                color={isActive ? item.textColor : item.color}
                opacity={isActive ? 1 : 0.75}
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
          _hover={{ bg: "rose.50" }}
          onClick={openTour}
        >
          <Icon as={LuSparkles} boxSize="5" color="rose.300" />
          <Text fontSize="sm" color="rose.400" fontWeight="500">Przewodnik</Text>
        </Flex>
        <Flex
          align="center"
          gap="3"
          px="3"
          py="2.5"
          borderRadius="xl"
          cursor="pointer"
          _hover={{ bg: "lavender.50" }}
          onClick={() => navigate("/ustawienia")}
        >
          <Icon as={LuSettings} boxSize="5" color="lavender.400" />
          <Text fontSize="sm" color="lavender.500" fontWeight="500">Ustawienia</Text>
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
          <Icon as={LuLogOut} boxSize="5" color="peach.400" />
          <Text fontSize="sm" color="peach.500" fontWeight="500">Wyloguj</Text>
        </Flex>
      </VStack>
    </Box>
  );
}
