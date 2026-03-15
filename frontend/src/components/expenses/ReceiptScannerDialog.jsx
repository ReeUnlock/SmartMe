import { useState, useRef } from "react";
import { Box, Flex, Text, VStack, Icon, Input, Heading } from "@chakra-ui/react";
import { LuCamera, LuImage, LuReceipt, LuCheck, LuChevronLeft, LuTriangleAlert } from "react-icons/lu";
import BottomSheetDialog, { DialogActions } from "../common/BottomSheetDialog";
import SmartMeLoader from "../common/SmartMeLoader";
import DateInput from "../common/DateInput";
import { useExpenseCategories, useMembers } from "../../hooks/useExpenses";
import { scanReceipt } from "../../api/receipts";
import { compressImage } from "../../utils/imageCompressor";

const STEPS = { PICK: "pick", SCANNING: "scanning", DRAFT: "draft" };

const CONFIDENCE_INFO = {
  good: null,
  partial: "Część danych mogła zostać odczytana niedokładnie. Sprawdź kwotę.",
  weak: "Odczytano niewiele danych z paragonu. Uzupełnij brakujące pola ręcznie.",
  none: "Nie udało się rozpoznać danych paragonu. Wprowadź dane ręcznie.",
};

export default function ReceiptScannerDialog({ open, onClose, onSubmitExpenses, isLoading: isSaving }) {
  const [step, setStep] = useState(STEPS.PICK);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

  // Draft state
  const [storeName, setStoreName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [total, setTotal] = useState("");
  const [categoryId, setCategoryId] = useState(null);
  const [paidById, setPaidById] = useState(null);
  const [rawText, setRawText] = useState("");
  const [showRawText, setShowRawText] = useState(false);
  const [confidence, setConfidence] = useState("none");

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const { data: categories } = useExpenseCategories();
  const { data: members } = useMembers();

  const reset = () => {
    setStep(STEPS.PICK);
    setError("");
    setPreview(null);
    setStoreName("");
    setDate(new Date().toISOString().split("T")[0]);
    setTotal("");
    setCategoryId(null);
    setPaidById(null);
    setRawText("");
    setShowRawText(false);
    setConfidence("none");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    setPreview(URL.createObjectURL(file));
    setStep(STEPS.SCANNING);

    try {
      let compressed;
      try {
        compressed = await compressImage(file);
      } catch (compErr) {
        console.error("[ReceiptScanner] Image compression failed:", compErr);
        throw new Error("Nie udało się przetworzyć zdjęcia. Spróbuj inny plik.");
      }

      let result;
      try {
        result = await scanReceipt(compressed);
      } catch (apiErr) {
        console.error("[ReceiptScanner] API scan failed:", apiErr);
        throw apiErr;
      }

      console.info("[ReceiptScanner] OCR result:", {
        confidence: result.confidence,
        store: result.store_name,
        date: result.date,
        total: result.total,
        rawTextLength: result.raw_text?.length ?? 0,
      });

      // Populate draft
      setStoreName(result.store_name || "");
      setDate(result.date || "");
      setTotal(result.total != null ? String(result.total) : "");
      setRawText(result.raw_text || "");
      setConfidence(result.confidence || "none");

      // Auto-select suggested category
      if (result.suggested_category && categories?.length) {
        const match = categories.find(
          (c) => c.name.toLowerCase() === result.suggested_category.toLowerCase()
        );
        if (match) setCategoryId(match.id);
      }

      setStep(STEPS.DRAFT);
    } catch (err) {
      console.error("[ReceiptScanner] Error:", err);
      setError(err.message || "Wystąpił nieoczekiwany błąd.");
      setStep(STEPS.PICK);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const totalVal = parseFloat(total);
    if (!totalVal || totalVal <= 0) return;
    if (!date) return;

    onSubmitExpenses({
      amount: totalVal,
      description: storeName || "Paragon",
      date,
      category_id: categoryId,
      paid_by_id: paidById,
      is_shared: false,
      source: "receipt",
    });
  };

  // Image picker step
  if (step === STEPS.PICK) {
    return (
      <BottomSheetDialog open={open} onClose={handleClose} maxW="400px">
        <Box px={4} pt={4} pb={2}>
          <Heading size="sm" mb={4} color="peach.600" fontFamily="'Nunito', sans-serif">
            {"Skanuj paragon"}
          </Heading>

          {error && (
            <Box bg="red.50" borderRadius="xl" p={3} mb={3}>
              <Text fontSize="sm" color="red.600">{error}</Text>
            </Box>
          )}

          <VStack gap={3}>
            {/* Camera button */}
            <Flex
              as="button"
              type="button"
              w="full"
              py={4}
              px={4}
              bg="peach.50"
              borderRadius="2xl"
              align="center"
              gap={3}
              cursor="pointer"
              transition="all 0.15s"
              _hover={{ bg: "peach.100" }}
              _active={{ transform: "scale(0.98)" }}
              onClick={() => cameraInputRef.current?.click()}
            >
              <Flex
                w="44px" h="44px" borderRadius="xl"
                bg="peach.400" align="center" justify="center"
              >
                <Icon as={LuCamera} boxSize={5} color="white" />
              </Flex>
              <Box textAlign="left">
                <Text fontWeight="600" fontSize="sm" color="textPrimary">{"Zrób zdjęcie"}</Text>
                <Text fontSize="xs" color="textTertiary">{"Użyj aparatu telefonu"}</Text>
              </Box>
            </Flex>

            {/* Gallery button */}
            <Flex
              as="button"
              type="button"
              w="full"
              py={4}
              px={4}
              bg="peach.50"
              borderRadius="2xl"
              align="center"
              gap={3}
              cursor="pointer"
              transition="all 0.15s"
              _hover={{ bg: "peach.100" }}
              _active={{ transform: "scale(0.98)" }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Flex
                w="44px" h="44px" borderRadius="xl"
                bg="peach.300" align="center" justify="center"
              >
                <Icon as={LuImage} boxSize={5} color="white" />
              </Flex>
              <Box textAlign="left">
                <Text fontWeight="600" fontSize="sm" color="textPrimary">{"Wybierz z galerii"}</Text>
                <Text fontSize="xs" color="textTertiary">{"Załaduj istniejące zdjęcie"}</Text>
              </Box>
            </Flex>
          </VStack>

          {/* Hidden inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={handleFileInput}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            style={{ display: "none" }}
            onChange={handleFileInput}
          />
        </Box>

        <DialogActions>
          <Flex justify="flex-end" px={1}>
            <Text
              as="button" type="button" onClick={handleClose}
              color="gray.500" fontWeight="500" cursor="pointer"
              px={3} py={1.5} fontSize="sm" _hover={{ color: "textSecondary" }}
            >
              Anuluj
            </Text>
          </Flex>
        </DialogActions>
      </BottomSheetDialog>
    );
  }

  // Scanning step
  if (step === STEPS.SCANNING) {
    return (
      <BottomSheetDialog open={open} onClose={handleClose} maxW="400px">
        <VStack gap={4} py={8} px={4} align="center">
          {preview && (
            <Box
              w="120px" h="160px" borderRadius="xl" overflow="hidden"
              shadow="0 2px 12px rgba(0,0,0,0.1)"
            >
              <img src={preview} alt="receipt" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </Box>
          )}
          <SmartMeLoader color="peach" label={"Odczytuję paragon…"} />
        </VStack>
      </BottomSheetDialog>
    );
  }

  // Draft step
  const confidenceMsg = CONFIDENCE_INFO[confidence];
  const isMissingTotal = !total;

  return (
    <BottomSheetDialog open={open} onClose={handleClose} maxW="440px" onSubmit={handleSubmit}>
      <Box px={4} pt={4} pb={1}>
        <Flex align="center" gap={2} mb={3}>
          <Flex
            as="button" type="button" onClick={() => { reset(); setStep(STEPS.PICK); }}
            align="center" justify="center" color="gray.400" cursor="pointer"
            _hover={{ color: "peach.500" }}
          >
            <Icon as={LuChevronLeft} boxSize={5} />
          </Flex>
          <Flex align="center" gap={2}>
            <Icon as={LuReceipt} boxSize={5} color="peach.500" />
            <Heading size="sm" color="peach.600" fontFamily="'Nunito', sans-serif">
              {"Sprawdź dane paragonu"}
            </Heading>
          </Flex>
        </Flex>

        {/* Confidence banner */}
        {confidenceMsg && (
          <Flex
            bg={confidence === "none" || confidence === "weak" ? "orange.50" : "sky.50"}
            borderRadius="xl" p={3} mb={3} align="flex-start" gap={2}
          >
            <Icon as={LuTriangleAlert} boxSize={4} color={confidence === "none" || confidence === "weak" ? "orange.400" : "sky.400"} mt="1px" flexShrink={0} />
            <Text fontSize="xs" color={confidence === "none" || confidence === "weak" ? "orange.700" : "sky.700"}>
              {confidenceMsg}
            </Text>
          </Flex>
        )}

        {/* Store name / description */}
        <Text fontSize="2xs" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" mb={1}>
          {"Opis"}
        </Text>
        <Input
          placeholder={"np. Biedronka, Apteka"}
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          size="sm" mb={2.5} bg="gray.50" borderRadius="lg"
          borderColor="peach.200"
          _focus={{ bg: "white", borderColor: "peach.400", boxShadow: "0 0 0 1px var(--chakra-colors-peach-400)" }}
          _placeholder={{ color: "gray.400" }}
        />

        {/* Total */}
        <Text fontSize="2xs" fontWeight="600" color={isMissingTotal ? "orange.500" : "gray.500"} textTransform="uppercase" letterSpacing="0.5px" mb={1}>
          {"Kwota (zł) *"}
        </Text>
        <Input
          placeholder={"np. 149.90"}
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          value={total}
          onChange={(e) => setTotal(e.target.value)}
          size="sm" mb={isMissingTotal ? 1 : 2.5} bg={isMissingTotal ? "orange.50" : "gray.50"} borderRadius="lg"
          borderColor={isMissingTotal ? "orange.200" : "peach.200"}
          _focus={{ bg: "white", borderColor: "peach.400", boxShadow: "0 0 0 1px var(--chakra-colors-peach-400)" }}
          _placeholder={{ color: "gray.400" }}
        />
        {isMissingTotal && (
          <Text fontSize="2xs" color="orange.500" mb={2}>
            {"Nie udało się odczytać kwoty — wpisz ręcznie"}
          </Text>
        )}

        {/* Date */}
        <Text fontSize="2xs" fontWeight="600" color={!date ? "orange.500" : "gray.500"} textTransform="uppercase" letterSpacing="0.5px" mb={1}>
          Data
        </Text>
        <DateInput value={date} onChange={setDate} accentColor="peach" mb={!date ? 1 : 2.5} />
        {!date && (
          <Text fontSize="2xs" color="orange.500" mb={2}>
            {"Nie udało się odczytać daty — wybierz ręcznie"}
          </Text>
        )}

        {/* Category */}
        {categories?.length > 0 && (
          <Box mb={2.5}>
            <Text fontSize="2xs" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" mb={1}>
              Kategoria
            </Text>
            <Flex gap={1.5} flexWrap="wrap">
              {categories.map((cat) => (
                <Text
                  key={cat.id}
                  as="button" type="button"
                  fontSize="xs" fontWeight="600" px={3} py={1} borderRadius="full"
                  bg={categoryId === cat.id ? "peach.400" : "peach.50"}
                  color={categoryId === cat.id ? "white" : "peach.600"}
                  cursor="pointer" transition="all 0.15s"
                  onClick={() => setCategoryId(categoryId === cat.id ? null : cat.id)}
                  _hover={{ bg: categoryId === cat.id ? "peach.500" : "peach.100" }}
                >
                  {cat.name}
                </Text>
              ))}
            </Flex>
          </Box>
        )}

        {/* Paid by */}
        {members?.length > 0 && (
          <Box mb={2.5}>
            <Text fontSize="2xs" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="0.5px" mb={1}>
              {"Kto płaci"}
            </Text>
            <Flex gap={1.5}>
              {members.map((m) => (
                <Text
                  key={m.id}
                  as="button" type="button"
                  fontSize="xs" fontWeight="600" px={3} py={1} borderRadius="full"
                  bg={paidById === m.id ? "peach.400" : "peach.50"}
                  color={paidById === m.id ? "white" : "peach.600"}
                  cursor="pointer" transition="all 0.15s"
                  onClick={() => setPaidById(paidById === m.id ? null : m.id)}
                  _hover={{ bg: paidById === m.id ? "peach.500" : "peach.100" }}
                >
                  {m.name}
                </Text>
              ))}
            </Flex>
          </Box>
        )}

        {/* Raw text toggle */}
        <Flex
          as="button" type="button"
          onClick={() => setShowRawText(!showRawText)}
          align="center" gap={1} fontSize="xs" color="gray.400"
          cursor="pointer" mb={1} _hover={{ color: "gray.600" }}
        >
          <Text>{showRawText ? "Ukryj tekst OCR" : "Pokaż tekst OCR"}</Text>
        </Flex>
        {showRawText && (
          <Box
            bg="gray.50" borderRadius="lg" p={3} mb={2}
            maxH="150px" overflowY="auto"
            fontSize="xs" color="gray.500"
            whiteSpace="pre-wrap" fontFamily="mono"
          >
            {rawText}
          </Box>
        )}
      </Box>

      <DialogActions>
        <Flex gap={3} justify="flex-end">
          <Text
            as="button" type="button" onClick={handleClose}
            color="gray.500" fontWeight="500" cursor="pointer"
            px={3} py={1.5} fontSize="sm" _hover={{ color: "textSecondary" }}
          >
            Anuluj
          </Text>
          <Flex
            as="button" type="submit"
            align="center" gap={1.5}
            bg="peach.400" color="white" fontWeight="600"
            px={5} py={2} borderRadius="xl" cursor="pointer" fontSize="sm"
            opacity={!total || !date || isSaving ? 0.5 : 1}
            _hover={{ bg: "peach.500" }} transition="all 0.15s"
          >
            <Icon as={LuCheck} boxSize={4} />
            <Text>{isSaving ? "Zapisuję…" : "Zapisz wydatek"}</Text>
          </Flex>
        </Flex>
      </DialogActions>
    </BottomSheetDialog>
  );
}
