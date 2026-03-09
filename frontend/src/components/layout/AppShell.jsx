import { Box, Flex } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import BottomNav from "./BottomNav";
import VoiceFab from "../voice/VoiceFab";

export default function AppShell() {
  return (
    <Flex minH="100vh" bg="#FBF8F9">
      <Sidebar />
      <Box flex="1" display="flex" flexDirection="column" minW="0" overflow="hidden">
        <Header />
        <Box flex="1" p={{ base: "2", md: "4" }} pb={{ base: "68px", md: "4" }} overflowY="auto" overflowX="hidden">
          <Outlet />
        </Box>
      </Box>
      <BottomNav />
      <VoiceFab />
    </Flex>
  );
}
