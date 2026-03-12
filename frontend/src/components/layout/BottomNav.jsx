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
import { useKeyboardOpen } from "../../hooks/useKeyboardOpen";
import { EASING, DURATION_CSS, Z } from "../../config/motionConfig";

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
  const kbdOpen = useKeyboardOpen();
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
      zIndex={Z.bottomNav}
      display={{ base: "block", md: "none" }}
      pb="env(safe-area-inset-bottom)"
      className="sm-kbd-hide"
      data-kbd-open={kbdOpen ? "true" : undefined}
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
              px="2"
              py="1"
              borderRadius="xl"
              minW="0"
              style={{
                transition: `all ${DURATION_CSS.fast} ${EASING.out}`,
              }}
              _active={{ transform: "scale(0.92)" }}
            >
              <Flex
                align="center"
                justify="center"
                w="44px"
                h="44px"
                borderRadius="xl"
                bg={isActive ? item.bg : "transparent"}
                style={{
                  transition: `all ${DURATION_CSS.toast} ${EASING.out}`,
                  transform: isActive ? "translateY(-2px)" : "translateY(0)",
                }}
              >
                <Icon
                  as={item.icon}
                  boxSize="18px"
                  color={isActive ? item.color : item.muted}
                  strokeWidth={isActive ? "2.5" : "1.8"}
                  opacity={isActive ? 1 : 0.55}
                  style={{
                    transition: `all ${DURATION_CSS.toast} ${EASING.out}`,
                    transform: isActive ? "scale(1.08)" : "scale(1)",
                  }}
                />
              </Flex>
              <Text
                fontSize="2xs"
                fontWeight={isActive ? "700" : "600"}
                color={isActive ? item.color : item.muted}
                opacity={isActive ? 1 : 0.65}
                lineHeight="1"
                style={{
                  transition: `all ${DURATION_CSS.toast} ${EASING.out}`,
                }}
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
