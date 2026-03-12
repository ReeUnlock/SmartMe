import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Heading,
  Text,
  Button,
  Input,
  VStack,
  HStack,
  Flex,
  Icon,
} from "@chakra-ui/react";
import {
  LuUser,
  LuLogOut,
  LuSparkles,
  LuChevronRight,
  LuTriangleAlert,
  LuMessageCircle,
  LuVolume2,
  LuShieldCheck,
} from "react-icons/lu";
import { useAuth } from "../../hooks/useAuth";
import { changePassword, resetAccount } from "../../api/auth";
import useRewards from "../../hooks/useRewards";
import useSoundSettings from "../../hooks/useSoundSettings";
import { playSound } from "../../utils/soundManager";
import { getSelectedAvatar, getAvatarConfig } from "../affirmation/avatarConfig";
import AvatarThumbnail from "../affirmation/AvatarThumbnail";
import FeedbackDialog from "./FeedbackDialog";

/* ── Shared card wrapper ─────────────────────────── */

function SettingsCard({ children, ...props }) {
  return (
    <Box
      bg="white"
      borderRadius="2xl"
      shadow="0 1px 8px 0 rgba(0,0,0,0.04)"
      borderWidth="1px"
      borderColor="gray.100"
      px={5}
      py={5}
      {...props}
    >
      {children}
    </Box>
  );
}

function SectionTitle({ icon, color = "rose.400", children }) {
  return (
    <HStack gap="2" mb="3">
      <Flex
        align="center"
        justify="center"
        w="28px"
        h="28px"
        borderRadius="lg"
        bg={`${color.split(".")[0]}.50`}
      >
        <Icon as={icon} boxSize="14px" color={color} />
      </Flex>
      <Text fontSize="sm" fontWeight="600" color="gray.600" letterSpacing="0.01em">
        {children}
      </Text>
    </HStack>
  );
}

/* ── Password change ─────────────────────────────── */

function PasswordChangeSection() {
  const [showForm, setShowForm] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (newPw.length < 6) {
      setError("Nowe hasło musi mieć co najmniej 6 znaków.");
      return;
    }
    if (newPw !== confirmPw) {
      setError("Hasła nie są takie same.");
      return;
    }
    setLoading(true);
    try {
      await changePassword(currentPw, newPw);
      setSuccess(true);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setTimeout(() => {
        setShowForm(false);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setShowForm(false);
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    setError("");
    setSuccess(false);
  };

  if (!showForm) {
    return (
      <HStack
        justify="space-between"
        cursor="pointer"
        onClick={() => setShowForm(true)}
        _hover={{ bg: "gray.50" }}
        borderRadius="xl"
        mx={-2}
        px={2}
        py="1.5"
        transition="background 0.15s"
      >
        <Text fontSize="sm" color="gray.600">{"Zmień hasło"}</Text>
        <Icon as={LuChevronRight} boxSize="14px" color="gray.400" />
      </HStack>
    );
  }

  return (
    <VStack align="stretch" gap="3" className="sm-expand-in">
      <Input
        type="password"
        placeholder="Obecne hasło"
        value={currentPw}
        onChange={(e) => setCurrentPw(e.target.value)}
        borderRadius="xl"
        size="sm"
        borderColor="gray.200"
        _focus={{ borderColor: "rose.300", boxShadow: "0 0 0 1px var(--chakra-colors-rose-300)" }}
        autoComplete="current-password"
      />
      <Input
        type="password"
        placeholder="Nowe hasło (min. 6 znaków)"
        value={newPw}
        onChange={(e) => setNewPw(e.target.value)}
        borderRadius="xl"
        size="sm"
        borderColor="gray.200"
        _focus={{ borderColor: "rose.300", boxShadow: "0 0 0 1px var(--chakra-colors-rose-300)" }}
        autoComplete="new-password"
      />
      <Input
        type="password"
        placeholder="Powtórz nowe hasło"
        value={confirmPw}
        onChange={(e) => setConfirmPw(e.target.value)}
        borderRadius="xl"
        size="sm"
        borderColor="gray.200"
        _focus={{ borderColor: "rose.300", boxShadow: "0 0 0 1px var(--chakra-colors-rose-300)" }}
        autoComplete="new-password"
      />
      {error && <Text color="red.500" fontSize="xs">{error}</Text>}
      {success && (
        <Text color="green.500" fontSize="xs">{"Hasło zostało zmienione."}</Text>
      )}
      <HStack>
        <Button
          size="sm"
          bg="rose.400"
          color="white"
          _hover={{ bg: "rose.500" }}
          borderRadius="xl"
          onClick={handleSubmit}
          loading={loading}
        >
          {"Zapisz"}
        </Button>
        <Button size="sm" variant="ghost" borderRadius="xl" onClick={reset}>
          {"Anuluj"}
        </Button>
      </HStack>
    </VStack>
  );
}

/* ── Reset section ───────────────────────────────── */

function ResetSection() {
  const [showReset, setShowReset] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (!resetPassword) {
      setResetError("Podaj hasło, aby potwierdzić reset.");
      return;
    }
    if (!window.confirm("Na pewno chcesz usunąć konto i wszystkie dane? Tej operacji nie można cofnąć.")) {
      return;
    }
    setResetting(true);
    setResetError("");
    try {
      await resetAccount(resetPassword);
      localStorage.removeItem("token");
      useAuth.getState().setToken(null);
      sessionStorage.setItem("anelka_from_reset", "1");
      window.location.href = "/setup";
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetting(false);
    }
  };

  if (!showReset) {
    return (
      <HStack
        justify="space-between"
        cursor="pointer"
        onClick={() => setShowReset(true)}
        _hover={{ bg: "red.50" }}
        borderRadius="xl"
        mx={-2}
        px={2}
        py="1.5"
        transition="background 0.15s"
      >
        <Text fontSize="sm" color="gray.500">{"Resetuj konto"}</Text>
        <Icon as={LuChevronRight} boxSize="14px" color="gray.300" />
      </HStack>
    );
  }

  return (
    <VStack align="stretch" gap="3" className="sm-expand-in">
      <Text fontSize="xs" color="gray.500" lineHeight="tall">
        {"To usunie konto i wszystkie dane — wydarzenia, zakupy, wydatki, plany. Podaj hasło, aby potwierdzić."}
      </Text>
      <Input
        type="password"
        placeholder="Potwierdź hasłem"
        value={resetPassword}
        onChange={(e) => setResetPassword(e.target.value)}
        borderRadius="xl"
        size="sm"
        borderColor="gray.200"
        autoComplete="current-password"
      />
      {resetError && <Text color="red.500" fontSize="xs">{resetError}</Text>}
      <HStack>
        <Button
          size="sm"
          bg="red.400"
          color="white"
          _hover={{ bg: "red.500" }}
          borderRadius="xl"
          onClick={handleReset}
          loading={resetting}
        >
          {"Potwierdź reset"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          borderRadius="xl"
          onClick={() => {
            setShowReset(false);
            setResetPassword("");
            setResetError("");
          }}
        >
          {"Anuluj"}
        </Button>
      </HStack>
    </VStack>
  );
}

/* ── Sound settings ──────────────────────────────── */

function SoundSettingsSection() {
  const enabled = useSoundSettings((s) => s.enabled);
  const volume = useSoundSettings((s) => s.volume);
  const toggle = useSoundSettings((s) => s.toggle);
  const setVolume = useSoundSettings((s) => s.setVolume);

  return (
    <SettingsCard>
      <SectionTitle icon={LuVolume2} color="sky.400">
        {"Dźwięki"}
      </SectionTitle>

      {/* Enable / disable toggle */}
      <Flex
        align="center"
        justify="space-between"
        _hover={{ bg: "gray.50" }}
        borderRadius="xl"
        mx={-2}
        px={2}
        py="1.5"
        transition="background 0.15s"
        cursor="pointer"
        onClick={() => {
          toggle();
          if (!enabled) {
            // Sound is being turned ON — play a preview after toggle
            setTimeout(() => playSound("sparksGained"), 50);
          }
        }}
      >
        <Text fontSize="sm" color="gray.600">{"Efekty dźwiękowe"}</Text>
        <Box
          w="36px"
          h="20px"
          borderRadius="full"
          bg={enabled ? "sky.400" : "gray.300"}
          position="relative"
          transition="background 0.2s"
        >
          <Box
            position="absolute"
            top="2px"
            left={enabled ? "18px" : "2px"}
            w="16px"
            h="16px"
            borderRadius="full"
            bg="white"
            shadow="0 1px 3px rgba(0,0,0,0.2)"
            transition="left 0.2s"
          />
        </Box>
      </Flex>

      {/* Volume slider */}
      {enabled && (
        <Box mt="3" className="sm-expand-in">
          <Flex align="center" justify="space-between" mb="1.5">
            <Text fontSize="xs" color="gray.500" fontWeight="500">{"Głośność"}</Text>
            <Text fontSize="xs" color="gray.400" fontWeight="500">{Math.round(volume * 100)}%</Text>
          </Flex>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(volume * 100)}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            onMouseUp={() => playSound("sparksGained")}
            onTouchEnd={() => playSound("sparksGained")}
            style={{
              width: "100%",
              height: "6px",
              borderRadius: "3px",
              appearance: "none",
              background: `linear-gradient(to right, #63B3ED ${volume * 100}%, #E2E8F0 ${volume * 100}%)`,
              outline: "none",
              cursor: "pointer",
            }}
          />
        </Box>
      )}
    </SettingsCard>
  );
}

/* ── Main page ───────────────────────────────────── */

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const level = useRewards((s) => s.level);
  const avatarKey = getSelectedAvatar(level);
  const avatarConfig = getAvatarConfig(avatarKey);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  return (
    <Box maxW="520px" mx="auto">
      <Heading
        size="lg"
        mb="5"
        fontFamily="'Nunito', sans-serif"
        fontWeight="700"
        color="gray.700"
      >
        {"Ustawienia"}
      </Heading>

      <VStack gap="4" align="stretch">
        {/* ── Section A: Konto ── */}
        <SettingsCard>
          <SectionTitle icon={LuUser} color="rose.400">{"Konto"}</SectionTitle>
          <VStack align="stretch" gap="3">
            {user && (
              <Box>
                <Text fontWeight="600" color="gray.700" fontSize="md">
                  {user.username}
                </Text>
                <Text color="gray.400" fontSize="sm">{user.email}</Text>
              </Box>
            )}
            <Box borderTopWidth="1px" borderColor="gray.100" pt="3">
              <PasswordChangeSection />
            </Box>
            <Box borderTopWidth="1px" borderColor="gray.100" pt="3">
              <HStack
                justify="space-between"
                cursor="pointer"
                onClick={logout}
                _hover={{ bg: "gray.50" }}
                borderRadius="xl"
                mx={-2}
                px={2}
                py="1.5"
                transition="background 0.15s"
              >
                <HStack gap="2">
                  <Icon as={LuLogOut} boxSize="14px" color="gray.400" />
                  <Text fontSize="sm" color="gray.600">{"Wyloguj się"}</Text>
                </HStack>
              </HStack>
            </Box>
          </VStack>
        </SettingsCard>

        {/* ── Section B: Personalizacja ── */}
        <SettingsCard>
          <SectionTitle icon={LuSparkles} color="lavender.400">
            {"Personalizacja"}
          </SectionTitle>
          <HStack
            gap="4"
            cursor="pointer"
            onClick={() => navigate("/postacie")}
            _hover={{ bg: "lavender.50" }}
            borderRadius="xl"
            mx={-2}
            px={3}
            py="2.5"
            transition="background 0.15s"
          >
            <AvatarThumbnail size={44} />
            <Box flex="1">
              <Text fontSize="sm" fontWeight="600" color="gray.700">
                {avatarConfig?.name || "Sol"}
              </Text>
              <Text fontSize="xs" color="gray.400">
                {"Twoja towarzyszka — dotknij, aby zmienić"}
              </Text>
            </Box>
            <Icon as={LuChevronRight} boxSize="16px" color="gray.300" />
          </HStack>
        </SettingsCard>

        {/* ── Section B2: Dźwięki ── */}
        <SoundSettingsSection />

        {/* ── Section C: Opinia ── */}
        <SettingsCard>
          <SectionTitle icon={LuMessageCircle} color="lavender.400">
            {"Opinia beta"}
          </SectionTitle>
          <HStack
            justify="space-between"
            cursor="pointer"
            onClick={() => setFeedbackOpen(true)}
            _hover={{ bg: "lavender.50" }}
            borderRadius="xl"
            mx={-2}
            px={2}
            py="1.5"
            transition="background 0.15s"
          >
            <Text fontSize="sm" color="gray.600">{"Wyślij opinię"}</Text>
            <Icon as={LuChevronRight} boxSize="14px" color="gray.400" />
          </HStack>
          {feedbackSent && (
            <Text fontSize="xs" color="green.500" mt="2">
              {"Dziękujemy za Twoją opinię 💜"}
            </Text>
          )}
        </SettingsCard>

        {/* ── Section D: Prawne ── */}
        <SettingsCard>
          <SectionTitle icon={LuShieldCheck} color="sage.400">
            {"Informacje prawne"}
          </SectionTitle>
          <HStack
            as="a"
            href="/privacy-policy.html"
            target="_blank"
            rel="noopener"
            justify="space-between"
            _hover={{ bg: "sage.50" }}
            borderRadius="xl"
            mx={-2}
            px={2}
            py="1.5"
            transition="background 0.15s"
            textDecoration="none"
          >
            <Text fontSize="sm" color="gray.600">{"Polityka prywatności"}</Text>
            <Icon as={LuChevronRight} boxSize="14px" color="gray.400" />
          </HStack>
        </SettingsCard>

        {/* ── Section E: Strefa ostrożności ── */}
        <SettingsCard
          borderColor="red.50"
          shadow="0 1px 8px 0 rgba(0,0,0,0.02)"
        >
          <SectionTitle icon={LuTriangleAlert} color="red.300">
            {"Strefa ostrożności"}
          </SectionTitle>
          <Text fontSize="xs" color="gray.400" mb="3" lineHeight="tall">
            {"Te akcje są nieodwracalne. Upewnij się, że na pewno tego chcesz."}
          </Text>
          <ResetSection />
        </SettingsCard>
      </VStack>

      <FeedbackDialog
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        onSuccess={() => {
          setFeedbackSent(true);
          setTimeout(() => setFeedbackSent(false), 4000);
        }}
      />
    </Box>
  );
}
