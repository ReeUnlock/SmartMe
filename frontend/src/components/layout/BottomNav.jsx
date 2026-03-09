import { Box, Flex, Icon, Text, VStack } from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LuLayoutGrid,
  LuCalendar,
  LuShoppingCart,
  LuWallet,
  LuTarget,
} from "react-icons/lu";

const navItems = [
  { path: "/", label: "Menu", icon: LuLayoutGrid, color: "rose.400", activeBg: "rose.50", exact: true },
  { path: "/kalendarz", label: "Kalendarz", icon: LuCalendar, color: "sky.500", activeBg: "sky.50" },
  { path: "/zakupy", label: "Zakupy", icon: LuShoppingCart, color: "sage.500", activeBg: "sage.50" },
  { path: "/wydatki", label: "Wydatki", icon: LuWallet, color: "peach.500", activeBg: "peach.50" },
  { path: "/plany", label: "Plany", icon: LuTarget, color: "rose.400", activeBg: "rose.50" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Box
      position="fixed"
      bottom="0"
      left="0"
      right="0"
      bg="white"
      borderTopWidth="1px"
      borderColor="rose.100"
      shadow="0 -2px 12px 0 rgba(231, 73, 128, 0.06)"
      zIndex="1000"
      display={{ base: "block", md: "none" }}
      pb="env(safe-area-inset-bottom)"
    >
      <Flex justify="space-around" py="1" px="1">
        {navItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);
          return (
            <VStack
              key={item.path}
              gap="0"
              cursor="pointer"
              onClick={() => navigate(item.path)}
              transition="all 0.2s"
              px="1.5"
              py="1"
              borderRadius="lg"
              bg={isActive ? item.activeBg : "transparent"}
              minW="0"
            >
              <Icon
                as={item.icon}
                boxSize="4.5"
                color={isActive ? item.color : "gray.400"}
                strokeWidth={isActive ? "2.5" : "2"}
              />
              <Text
                fontSize="2xs"
                fontWeight={isActive ? "700" : "500"}
                color={isActive ? item.color : "gray.400"}
                lineHeight="1.2"
              >
                {item.label}
              </Text>
            </VStack>
          );
        })}
      </Flex>
    </Box>
  );
}
