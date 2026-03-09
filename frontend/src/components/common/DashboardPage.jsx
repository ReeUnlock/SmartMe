import { Box, Flex, Icon, Text, SimpleGrid } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
  LuCalendar,
  LuShoppingCart,
  LuWallet,
  LuTarget,
} from "react-icons/lu";
import AffirmationCloud from "./AffirmationCloud";

const modules = [
  {
    path: "/kalendarz",
    label: "Kalendarz",
    icon: LuCalendar,
    color: "#339AF0",
    bg: "#E7F5FF",
    borderColor: "#A5D8FF",
  },
  {
    path: "/zakupy",
    label: "Zakupy",
    icon: LuShoppingCart,
    color: "#20C997",
    bg: "#E6FCF5",
    borderColor: "#96F2D7",
  },
  {
    path: "/wydatki",
    label: "Wydatki",
    icon: LuWallet,
    color: "#F47340",
    bg: "#FFF4ED",
    borderColor: "#FDD0B1",
  },
  {
    path: "/plany",
    label: "Plany",
    icon: LuTarget,
    color: "#E64980",
    bg: "#FFF0F7",
    borderColor: "#FCC2D7",
  },
];

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      minH={{ base: "calc(100vh - 140px)", md: "calc(100vh - 80px)" }}
      px={{ base: "3", md: "4" }}
      py={{ base: "2", md: "4" }}
    >
      <AffirmationCloud />

      <SimpleGrid
        columns={2}
        gap={{ base: "3", md: "4" }}
        w="full"
        maxW="400px"
      >
        {modules.map((mod) => (
          <Flex
            key={mod.path}
            direction="column"
            align="center"
            justify="center"
            gap={{ base: "2", md: "3" }}
            bg={mod.bg}
            borderWidth="2px"
            borderColor={mod.borderColor}
            borderRadius="2xl"
            cursor="pointer"
            py={{ base: "5", md: "8" }}
            px={{ base: "3", md: "4" }}
            shadow="0 2px 8px 0 rgba(0,0,0,0.04)"
            _hover={{
              transform: "scale(1.03)",
              shadow: `0 4px 20px 0 ${mod.color}22`,
              borderColor: mod.color,
            }}
            _active={{ transform: "scale(0.97)" }}
            transition="all 0.2s"
            onClick={() => navigate(mod.path)}
          >
            <Icon
              as={mod.icon}
              boxSize={{ base: "9", md: "12" }}
              color={mod.color}
              strokeWidth="1.5"
            />
            <Text
              fontSize={{ base: "sm", md: "md" }}
              fontWeight="700"
              color={mod.color}
              letterSpacing="-0.01em"
            >
              {mod.label}
            </Text>
          </Flex>
        ))}
      </SimpleGrid>
    </Flex>
  );
}
