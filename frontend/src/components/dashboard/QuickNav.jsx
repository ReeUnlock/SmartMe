import { Flex, Text, Icon } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
  LuCalendar,
  LuShoppingCart,
  LuWallet,
  LuTarget,
} from "react-icons/lu";

const NAV_ITEMS = [
  { icon: LuCalendar, label: "Kalendarz", color: "sky.500", bg: "sky.50", path: "/kalendarz" },
  { icon: LuShoppingCart, label: "Zakupy", color: "sage.500", bg: "sage.50", path: "/zakupy" },
  { icon: LuWallet, label: "Wydatki", color: "peach.500", bg: "peach.50", path: "/wydatki" },
  { icon: LuTarget, label: "Cele", color: "rose.400", bg: "rose.50", path: "/plany" },
];

export default function QuickNav() {
  const navigate = useNavigate();

  return (
    <Flex justify="center" gap={2}>
      {NAV_ITEMS.map((item) => (
        <Flex
          key={item.path}
          direction="column"
          align="center"
          gap={1}
          px={3}
          py={2.5}
          borderRadius="xl"
          cursor="pointer"
          transition="all 0.15s"
          _hover={{ bg: item.bg, transform: "translateY(-1px)" }}
          _active={{ transform: "scale(0.95)" }}
          onClick={() => navigate(item.path)}
        >
          <Flex
            align="center"
            justify="center"
            w="36px"
            h="36px"
            borderRadius="xl"
            bg={item.bg}
          >
            <Icon as={item.icon} boxSize="16px" color={item.color} strokeWidth="2" />
          </Flex>
          <Text fontSize="2xs" fontWeight="600" color="gray.500">
            {item.label}
          </Text>
        </Flex>
      ))}
    </Flex>
  );
}
