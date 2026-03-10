import { memo } from "react";
import { Box, Flex, Icon, Text } from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LuLayoutGrid,
  LuCalendar,
  LuShoppingCart,
  LuWallet,
  LuTarget,
} from "react-icons/lu";
const navItems = [
  { path: "/", label: "Menu", icon: LuLayoutGrid, color: "rose.400", muted: "rose.300", bg: "rose.50", exact: true },
  { path: "/kalendarz", label: "Kalendarz", icon: LuCalendar, color: "lavender.500", muted: "lavender.300", bg: "lavender.50" },
  { path: "/zakupy", label: "Zakupy", icon: LuShoppingCart, color: "sage.500", muted: "sage.300", bg: "sage.50" },
  { path: "/wydatki", label: "Wydatki", icon: LuWallet, color: "peach.500", muted: "peach.300", bg: "peach.50" },
  { path: "/plany", label: "Cele", icon: LuTarget, color: "sky.500", muted: "sky.300", bg: "sky.50" },
];

export default memo(function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <Box
      position="fixed"
      bottom="0"
      left="0"
      right="0"
      bg="rgba(255,255,255,0.97)"
      borderTopWidth="1px"
      borderColor="rose.100"
      shadow="0 -2px 16px 0 rgba(231, 73, 128, 0.05)"
      zIndex="1000"
      display={{ base: "block", md: "none" }}
      pb="env(safe-area-inset-bottom)"
    >
      <Flex justify="space-around" py="1.5" px="2">
        {navItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);
          return (
            <Flex
              key={item.path}
              direction="column"
              align="center"
              gap="1"
              cursor="pointer"
              onClick={() => navigate(item.path)}
              transition="all 0.2s"
              px="2"
              py="1"
              borderRadius="xl"
              minW="0"
              _active={{ transform: "scale(0.92)" }}
            >
              <Flex
                align="center"
                justify="center"
                w="44px"
                h="44px"
                borderRadius="xl"
                bg={isActive ? item.bg : "transparent"}
                transition="all 0.2s"
              >
                <Icon
                  as={item.icon}
                  boxSize="18px"
                  color={isActive ? item.color : item.muted}
                  strokeWidth={isActive ? "2.5" : "1.8"}
                  transition="all 0.2s"
                  opacity={isActive ? 1 : 0.7}
                />
              </Flex>
              <Text
                fontSize="2xs"
                fontWeight={isActive ? "700" : "600"}
                color={isActive ? item.color : item.muted}
                opacity={isActive ? 1 : 0.8}
                lineHeight="1"
                transition="all 0.2s"
              >
                {item.label}
              </Text>
            </Flex>
          );
        })}
      </Flex>
    </Box>
  );
});
