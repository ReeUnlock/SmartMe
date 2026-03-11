import { lazy, Suspense } from "react";
import { Box, Flex } from "@chakra-ui/react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import BottomNav from "./BottomNav";
import PageTransition from "../common/PageTransition";

const VoiceFab = lazy(() => import("../voice/VoiceFab"));

export default function AppShell() {
  const location = useLocation();

  return (
    <Flex
      h="100dvh"
      maxH="100dvh"
      position="relative"
      style={{
        background:
          "linear-gradient(180deg, #FFF4F8 0%, #FFF7F3 45%, #FFF1EA 100%)",
      }}
    >
      {/* Soft pastel background blobs — radial gradient instead of filter: blur(120px) for GPU perf */}
      <Box
        position="fixed"
        top="-10%"
        left="-10%"
        w="50vw"
        h="50vh"
        borderRadius="full"
        pointerEvents="none"
        zIndex={0}
        style={{
          background: "radial-gradient(circle, rgba(249,168,212,0.12) 0%, transparent 70%)",
        }}
      />
      <Box
        position="fixed"
        bottom="-10%"
        right="-10%"
        w="50vw"
        h="50vh"
        borderRadius="full"
        pointerEvents="none"
        zIndex={0}
        style={{
          background: "radial-gradient(circle, rgba(253,186,116,0.12) 0%, transparent 70%)",
        }}
      />

      <Sidebar />
      <Box
        flex="1"
        display="flex"
        flexDirection="column"
        minW="0"
        overflow="hidden"
        position="relative"
        zIndex={1}
      >
        <Header />
        <Box
          data-scroll-root=""
          flex="1"
          minH="0"
          p={{ base: "2", md: "4" }}
          pb={{ base: "calc(140px + env(safe-area-inset-bottom, 0px))", md: "4" }}
          overflowY="auto"
          overflowX="hidden"
          css={{ WebkitOverflowScrolling: "touch", overscrollBehaviorY: "contain" }}
        >
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </Box>
      </Box>
      <BottomNav />
      <Suspense fallback={null}><VoiceFab /></Suspense>
    </Flex>
  );
}
