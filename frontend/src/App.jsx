import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChakraProvider } from "@chakra-ui/react";

import { system } from "./theme";
import { useAuth } from "./hooks/useAuth";
import AppShell from "./components/layout/AppShell";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import SetupPage from "./components/auth/SetupPage";
import LoginPage from "./components/auth/LoginPage";
import CalendarPage from "./components/calendar/CalendarPage";
import ShoppingPage from "./components/shopping/ShoppingPage";
import ExpensesPage from "./components/expenses/ExpensesPage";
import PlansPage from "./components/plans/PlansPage";
import SettingsPage from "./components/common/SettingsPage";
import DashboardPage from "./components/common/DashboardPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function AppRoutes() {
  const loadUser = useAuth((s) => s.loadUser);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <Routes>
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="/kalendarz" element={<CalendarPage />} />
        <Route path="/zakupy" element={<ShoppingPage />} />
        <Route path="/wydatki" element={<ExpensesPage />} />
        <Route path="/plany" element={<PlansPage />} />
        <Route path="/ustawienia" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ChakraProvider value={system}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </QueryClientProvider>
    </ChakraProvider>
  );
}
