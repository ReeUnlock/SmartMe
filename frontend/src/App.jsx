import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChakraProvider } from "@chakra-ui/react";

import { system } from "./theme";
import "./styles/motion.css";
import { preloadSounds } from "./utils/soundManager";
import { useAuth } from "./hooks/useAuth";
import AppShell from "./components/layout/AppShell";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ErrorBoundary from "./components/common/ErrorBoundary";
import ErrorToast from "./components/common/ErrorToast";
import { useErrorToast } from "./components/common/ErrorToast";

// Route-based lazy loading
const SetupPage = lazy(() => import("./components/auth/SetupPage"));
const LoginPage = lazy(() => import("./components/auth/LoginPage"));
const RegisterPage = lazy(() => import("./components/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./components/auth/ForgotPasswordPage"));
const EmailVerificationPage = lazy(() => import("./components/auth/EmailVerificationPage"));
const NewPasswordPage = lazy(() => import("./components/auth/NewPasswordPage"));
const OnboardingPage = lazy(() => import("./components/auth/OnboardingPage"));
const DashboardPage = lazy(() => import("./components/common/DashboardPage"));
const CalendarPage = lazy(() => import("./components/calendar/CalendarPage"));
const ShoppingPage = lazy(() => import("./components/shopping/ShoppingPage"));
const ExpensesPage = lazy(() => import("./components/expenses/ExpensesPage"));
const PlansPage = lazy(() => import("./components/plans/PlansPage"));
const SettingsPage = lazy(() => import("./components/common/SettingsPage"));
const AchievementsPageWrapper = lazy(() => import("./components/dashboard/AchievementsPageWrapper"));
const ChallengesPageWrapper = lazy(() => import("./components/dashboard/ChallengesPageWrapper"));
const AvatarSelectionPageWrapper = lazy(() => import("./components/affirmation/AvatarSelectionPageWrapper"));
const LandingPage = lazy(() => import("./components/landing/LandingPage"));

// Lazy load heavy global overlays (not needed on initial render)
const SparkToast = lazy(() => import("./components/common/SparkToast"));
const AchievementToast = lazy(() => import("./components/common/AchievementToast"));
const CelebrationOverlay = lazy(() => import("./components/celebration/CelebrationOverlay"));
const AvatarReaction = lazy(() => import("./components/affirmation/AvatarReaction"));
const SuccessToast = lazy(() => import("./components/common/SuccessToast"));
const CookieConsent = lazy(() => import("./components/common/CookieConsent"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
    mutations: {
      onError: (error) => {
        const msg = error?.message || "";
        if (msg === "Nieautoryzowany") return;
        useErrorToast.getState().show(
          "Nie udało się wykonać tej operacji. Spróbuj ponownie."
        );
      },
    },
  },
});

function AppRoutes() {
  const loadUser = useAuth((s) => s.loadUser);

  useEffect(() => {
    loadUser();
    preloadSounds();
  }, [loadUser]);

  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/start" element={<LandingPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/rejestracja" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/odzyskaj-haslo" element={<ForgotPasswordPage />} />
        <Route path="/weryfikacja-email" element={<EmailVerificationPage />} />
        <Route path="/nowe-haslo" element={<NewPasswordPage />} />
        <Route path="/witaj" element={<OnboardingPage />} />
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
          <Route path="/odznaki" element={<AchievementsPageWrapper />} />
          <Route path="/wyzwania" element={<ChallengesPageWrapper />} />
          <Route path="/postacie" element={<AvatarSelectionPageWrapper />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ChakraProvider value={system}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AppRoutes />
            <Suspense fallback={null}>
              <SparkToast />
              <AchievementToast />
              <CelebrationOverlay />
              <AvatarReaction />
              <SuccessToast />
            </Suspense>
            <ErrorToast />
            <Suspense fallback={null}>
              <CookieConsent />
            </Suspense>
          </BrowserRouter>
        </QueryClientProvider>
      </ErrorBoundary>
    </ChakraProvider>
  );
}
