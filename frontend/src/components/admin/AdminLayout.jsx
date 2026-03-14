import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Flex,
  Text,
  Button,
  VStack,
  HStack,
  Icon,
} from "@chakra-ui/react";
import {
  LuLayoutDashboard,
  LuUsers,
  LuMessageSquare,
  LuLogOut,
  LuRefreshCw,
  LuMenu,
  LuX,
  LuShieldCheck,
} from "react-icons/lu";

const NAV_ITEMS = [
  { path: "/admin", label: "Dashboard", icon: LuLayoutDashboard, exact: true },
  { path: "/admin/users", label: "Użytkownicy", icon: LuUsers },
  { path: "/admin/feedback", label: "Feedback", icon: LuMessageSquare },
];

function SidebarContent({ onClose }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem("admin_key");
    navigate("/admin");
  };

  return (
    <Flex direction="column" h="100%" py={4}>
      <Flex align="center" gap={2} px={5} mb={6}>
        <LuShieldCheck size={18} color="#60A5FA" />
        <Box>
          <Text fontSize="md" fontWeight="bold" color="gray.100">
            {"SmartMe"}
          </Text>
          <Text fontSize="xs" color="gray.500" mt={-1}>
            {"Admin Panel"}
          </Text>
        </Box>
      </Flex>

      <VStack gap={1} px={3} flex={1}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);
          return (
            <Box
              key={item.path}
              as={Link}
              to={item.path}
              onClick={onClose}
              w="100%"
              px={3}
              py={2.5}
              borderRadius="lg"
              bg={isActive ? "blue.500/15" : "transparent"}
              color={isActive ? "blue.400" : "gray.400"}
              _hover={{ bg: "gray.700/50", color: "gray.200" }}
              display="flex"
              alignItems="center"
              gap={3}
              fontSize="sm"
              fontWeight={isActive ? "600" : "400"}
              textDecoration="none"
            >
              <Icon fontSize="md">
                <item.icon />
              </Icon>
              {item.label}
            </Box>
          );
        })}
      </VStack>

      <Box px={3}>
        <Button
          variant="ghost"
          w="100%"
          color="gray.500"
          justifyContent="flex-start"
          gap={3}
          size="sm"
          _hover={{ color: "red.400", bg: "red.500/10" }}
          onClick={handleLogout}
        >
          <LuLogOut />
          {"Wyloguj"}
        </Button>
      </Box>
    </Flex>
  );
}

function Breadcrumb() {
  const location = useLocation();
  const parts = location.pathname.split("/").filter(Boolean);

  const labels = {
    admin: "Admin",
    users: "Użytkownicy",
    feedback: "Feedback",
  };

  return (
    <HStack gap={1} fontSize="sm" color="gray.500">
      {parts.map((part, i) => (
        <HStack key={i} gap={1}>
          {i > 0 && <Text>/</Text>}
          <Text color={i === parts.length - 1 ? "gray.200" : "gray.500"}>
            {labels[part] || part}
          </Text>
        </HStack>
      ))}
    </HStack>
  );
}

export default function AdminLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin"] });
    setLastRefresh(new Date());
  };

  const timeStr = lastRefresh.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Flex minH="100vh" bg="gray.900">
      {/* Desktop sidebar */}
      <Box
        display={{ base: "none", lg: "block" }}
        w="240px"
        bg="gray.900"
        borderRightWidth="1px"
        borderColor="gray.800"
        position="fixed"
        top={0}
        left={0}
        bottom={0}
        zIndex={20}
      >
        <SidebarContent onClose={() => {}} />
      </Box>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <Box
          position="fixed"
          inset={0}
          zIndex={30}
          onClick={() => setMobileMenuOpen(false)}
        >
          <Box position="absolute" inset={0} bg="blackAlpha.700" />
          <Box
            position="absolute"
            top={0}
            left={0}
            bottom={0}
            w="260px"
            bg="gray.900"
            borderRightWidth="1px"
            borderColor="gray.800"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent onClose={() => setMobileMenuOpen(false)} />
          </Box>
        </Box>
      )}

      {/* Main content */}
      <Box flex={1} ml={{ base: 0, lg: "240px" }}>
        {/* Topbar */}
        <Flex
          h="60px"
          px={{ base: 4, md: 6 }}
          align="center"
          justify="space-between"
          borderBottomWidth="1px"
          borderColor="gray.800"
          bg="gray.900"
          position="sticky"
          top={0}
          zIndex={10}
        >
          <HStack gap={3}>
            <Button
              display={{ base: "flex", lg: "none" }}
              variant="ghost"
              color="gray.400"
              size="sm"
              p={1}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <LuX /> : <LuMenu />}
            </Button>
            <Breadcrumb />
          </HStack>

          <HStack gap={3}>
            <Text fontSize="xs" color="gray.500" display={{ base: "none", sm: "block" }}>
              {"Aktualizacja: "}{timeStr}
            </Text>
            <Button
              variant="ghost"
              color="gray.400"
              size="sm"
              onClick={handleRefresh}
              _hover={{ color: "blue.400" }}
            >
              <LuRefreshCw size={16} />
            </Button>
          </HStack>
        </Flex>

        {/* Page content */}
        <Box p={{ base: 4, md: 6 }} minH="calc(100vh - 60px)" bg="gray.950">
          {children}
        </Box>
      </Box>
    </Flex>
  );
}
