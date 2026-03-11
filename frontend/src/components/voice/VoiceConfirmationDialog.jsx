import { useState, useEffect } from "react";
import {
  DialogRoot,
  DialogBackdrop,
  DialogPositioner,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
  DialogTitle,
} from "@chakra-ui/react";
import {
  Box,
  Button,
  Flex,
  Input,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import {
  SwitchRoot,
  SwitchControl,
  SwitchThumb,
  SwitchHiddenInput,
} from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useVoiceCommand } from "../../hooks/useVoiceCommand";
import { ACTION_MODULE_MAP, getActionLabel, getModuleColor, getModuleLabel } from "../../services/appService";
import { normalizeCalendarDates } from "../../services/calendarNormalizer";
import DateInput from "../common/DateInput";
import DateTimeInput from "../common/DateTimeInput";

const COLOR_OPTIONS = [
  { key: "sky", value: "#339AF0" },
  { key: "lavender", value: "#845EF7" },
  { key: "peach", value: "#F47340" },
  { key: "sage", value: "#20C997" },
  { key: "rose", value: "#E64980" },
  { key: "yellow", value: "#FAB005" },
  { key: "red", value: "#F03E3E" },
  { key: "green", value: "#40C057" },
  { key: "pink", value: "#F06595" },
];

export default function VoiceConfirmationDialog() {
  const queryClient = useQueryClient();
  const { proposedActions, transcript, isProcessing, error } = useVoiceCommand();
  const confirmAction = useVoiceCommand((s) => s.confirmAction);
  const cancelAction = useVoiceCommand((s) => s.cancelAction);

  const isOpen = proposedActions.length > 0;
  const isBatch = proposedActions.length > 1;
  const singleAction = proposedActions[0] || {};

  if (!isOpen) return null;

  // For batch actions (multiple actions of any type): show mixed-batch summary view
  if (isBatch) {
    // Check if all are same-type add_events (use compact batch view)
    const allAddEvents = proposedActions.every((a) => a.action_type === "add_event");
    // Check if mixed types (cross-module)
    const isMixed = !allAddEvents;

    return (
      <DialogRoot
        open={isOpen}
        onOpenChange={(details) => {
          if (!details.open) cancelAction();
        }}
      >
        <DialogBackdrop bg="blackAlpha.400" backdropFilter="blur(4px)" />
        <DialogPositioner display="flex" alignItems={{ base: "flex-end", md: "center" }} justifyContent="center" p={{ base: "0", md: "5" }}>
          <DialogContent
            borderRadius={{ base: "2xl 2xl 0 0", md: "2xl" }}
            maxW="400px"
            w="full"
            maxH={{ base: "90dvh", md: "85vh" }}
            overflow="hidden"
            display="flex"
            flexDirection="column"
            shadow="0 20px 60px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.04)"
            bg="white"
          >
            <Box h="3px" bgGradient="to-r" gradientFrom="rose.300" gradientVia="pink.300" gradientTo="rose.400" borderTopRadius="2xl" flexShrink={0} />
            <DialogHeader py="3" px="5" flexShrink={0}>
              <Flex align="center" justify="space-between" w="full">
                <DialogTitle>
                  <Text fontSize="md" fontWeight="700" color="textPrimary">
                    {isMixed
                      ? `Rozpoznano ${proposedActions.length} akcji`
                      : `Dodaj ${proposedActions.length} wydarzeń`}
                  </Text>
                </DialogTitle>
                <DialogCloseTrigger asChild>
                  <CloseButton />
                </DialogCloseTrigger>
              </Flex>
            </DialogHeader>
            <DialogBody py="3" px="5" overflowY="auto" flex="1" css={{ WebkitOverflowScrolling: "touch" }}>
              <VStack gap="3" align="stretch">
                {transcript && <TranscriptBox transcript={transcript} />}
                {isMixed ? (
                  <MixedBatchSummary
                    actions={proposedActions}
                    onConfirm={(editedActions) => confirmAction(editedActions, queryClient)}
                    onCancel={cancelAction}
                    isProcessing={isProcessing}
                  />
                ) : (
                  <BatchAddEvents
                    actions={proposedActions}
                    onConfirm={(editedActions) => confirmAction(editedActions, queryClient)}
                    onCancel={cancelAction}
                    isProcessing={isProcessing}
                  />
                )}
                {error && <ErrorBox error={error} />}
              </VStack>
            </DialogBody>
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>
    );
  }

  // Single action flow (existing behavior)
  const actionType = singleAction.action_type || "unknown";
  const params = singleAction.params || {};
  const confidenceNote = singleAction.confidence_note || "";

  const getActionColor = (type) => {
    if (type.includes("expense") || type === "set_budget" || type === "list_expenses" || type.includes("recurring")) return "peach.600";
    if (type.includes("shopping")) return "sage.600";
    if (type.includes("goal") || type.includes("bucket") || type === "list_goals") return "rose.600";
    return "sky.600";
  };

  const getAccentGradient = (type) => {
    if (type.includes("expense") || type === "set_budget" || type === "list_expenses" || type.includes("recurring"))
      return { from: "orange.300", via: "peach.300", to: "orange.400" };
    if (type.includes("shopping"))
      return { from: "green.300", via: "teal.300", to: "green.400" };
    if (type.includes("goal") || type.includes("bucket") || type === "list_goals")
      return { from: "rose.300", via: "pink.300", to: "rose.400" };
    if (type.includes("delete"))
      return { from: "red.300", via: "pink.300", to: "red.400" };
    return { from: "sky.300", via: "blue.300", to: "sky.400" };
  };

  const accent = getAccentGradient(actionType);

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={(details) => {
        if (!details.open) cancelAction();
      }}
    >
      <DialogBackdrop bg="blackAlpha.400" backdropFilter="blur(4px)" />
      <DialogPositioner display="flex" alignItems={{ base: "flex-end", md: "center" }} justifyContent="center" p={{ base: "0", md: "5" }}>
        <DialogContent
          borderRadius={{ base: "2xl 2xl 0 0", md: "2xl" }}
          maxW="400px"
          w="full"
          maxH={{ base: "90dvh", md: "85vh" }}
          overflow="hidden"
          display="flex"
          flexDirection="column"
          shadow="0 20px 60px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.04)"
          bg="white"
        >
          <Box h="3px" bgGradient="to-r" gradientFrom={accent.from} gradientVia={accent.via} gradientTo={accent.to} borderTopRadius="2xl" flexShrink={0} />
          <DialogHeader py="3" px="5">
            <Flex align="center" justify="space-between" w="full">
              <DialogTitle>
                <Text
                  fontSize="md"
                  fontWeight="700"
                  color="textPrimary"
                >
                  <ActionTitle actionType={actionType} params={params} />
                </Text>
              </DialogTitle>
              <DialogCloseTrigger asChild>
                <CloseButton />
              </DialogCloseTrigger>
            </Flex>
          </DialogHeader>

          <DialogBody py="3" px="5">
            <VStack gap="3" align="stretch">
              {transcript && <TranscriptBox transcript={transcript} />}

              {confidenceNote && (
                <Box bg="yellow.50" borderWidth="1px" borderColor="yellow.200" px="3" py="2" borderRadius="xl">
                  <Text fontSize="xs" color="yellow.700">
                    {confidenceNote}
                  </Text>
                </Box>
              )}

              {/* Temporal metadata for single calendar action */}
              {singleAction.temporal_interpretation && (
                <TemporalBanner
                  ti={singleAction.temporal_interpretation}
                  validationErrors={singleAction.validation_errors}
                />
              )}

              {error && <ErrorBox error={error} />}

              <ActionContent
                actionType={actionType}
                params={params}
                proposedAction={singleAction}
                onConfirm={(editedAction) => confirmAction(editedAction, queryClient)}
                onCancel={cancelAction}
                isProcessing={isProcessing}
              />
            </VStack>
          </DialogBody>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}

// ─── Shared Components ───────────────────────────────────────

function CloseButton() {
  return (
    <Box
      as="button"
      aria-label="Zamknij"
      w="32px"
      h="32px"
      display="flex"
      alignItems="center"
      justifyContent="center"
      borderRadius="full"
      color="gray.400"
      bg="gray.50"
      _hover={{ color: "gray.600", bg: "gray.100" }}
      transition="all 0.15s"
    >
      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    </Box>
  );
}

function TranscriptBox({ transcript }) {
  return (
    <Box bg="gray.50" px="4" py="3" borderRadius="xl" borderWidth="1px" borderColor="gray.100">
      <Text fontSize="xs" fontWeight="600" color="gray.400" mb="1" textTransform="uppercase" letterSpacing="0.5px">
        {"Us\u0142ysza\u0142em:"}
      </Text>
      <Text fontSize="sm" color="textSecondary" fontStyle="italic" lineHeight="1.5">
        &ldquo;{transcript}&rdquo;
      </Text>
    </Box>
  );
}

function TemporalBanner({ ti, validationErrors }) {
  if (!ti && (!validationErrors || validationErrors.length === 0)) return null;
  return (
    <>
      {/* GPT interpretation + default assumption */}
      {ti && (ti.default_assumption || ti.needs_clarification) && (
        <Box
          bg={ti.needs_clarification ? "orange.50" : "sky.50"}
          px="3"
          py="2.5"
          borderRadius="xl"
          borderWidth="1px"
          borderColor={ti.needs_clarification ? "orange.200" : "sky.200"}
        >
          {ti.source_text && (
            <Text fontSize="xs" color="gray.600" fontWeight="600">
              {"\u{1F4C5}"} {ti.source_text}
            </Text>
          )}
          {ti.default_assumption && (
            <Text fontSize="xs" color="sky.700" mt="1">
              {"\u2192"} {ti.default_assumption}
            </Text>
          )}
          {ti.needs_clarification && ti.clarification_reason && (
            <Text fontSize="xs" color="orange.700" mt="1" fontWeight="500">
              {"\u26A0"} {ti.clarification_reason}
            </Text>
          )}
        </Box>
      )}
      {/* Validator correction notice */}
      {ti?.validator_corrected && (
        <Box bg="blue.50" px="3" py="2" borderRadius="xl" borderWidth="1px" borderColor="blue.200">
          <Text fontSize="xs" color="blue.700" fontWeight="500">
            {"\u2705"} {ti.validator_note || "Daty zweryfikowane i poprawione."}
          </Text>
          {ti.past_dates_excluded > 0 && (
            <Text fontSize="xs" color="blue.600" mt="0.5">
              {"Pomini\u0119to"} {ti.past_dates_excluded} {"przesz\u0142ych dat."}
            </Text>
          )}
        </Box>
      )}
      {/* Past-date exclusion (when validator didn't rebuild but did exclude) */}
      {ti && !ti.validator_corrected && ti.past_dates_excluded > 0 && (
        <Box bg="gray.50" px="3" py="2" borderRadius="xl" borderWidth="1px" borderColor="gray.200">
          <Text fontSize="xs" color="gray.600">
            {"Pomini\u0119to"} {ti.past_dates_excluded} {"przesz\u0142ych dat."}
          </Text>
        </Box>
      )}
      {/* Validation errors / warnings */}
      {validationErrors && validationErrors.length > 0 && (
        <Box bg="red.50" px="3" py="2" borderRadius="xl" borderWidth="1px" borderColor="red.200">
          {validationErrors.map((err, i) => (
            <Text key={i} fontSize="xs" color="red.600" fontWeight="500">
              {"\u274C"} {err}
            </Text>
          ))}
        </Box>
      )}
    </>
  );
}

function ErrorBox({ error }) {
  return (
    <Box bg="red.50" borderWidth="1px" borderColor="red.200" px="3" py="2" borderRadius="xl">
      <Text fontSize="xs" color="red.600">
        {error}
      </Text>
    </Box>
  );
}

// ─── Batch Add Events ────────────────────────────────────────

function BatchAddEvents({ actions, onConfirm, onCancel, isProcessing }) {
  const [editedActions, setEditedActions] = useState(actions);

  useEffect(() => {
    setEditedActions(actions);
  }, [actions]);

  const formatDatetime = (dt) => {
    if (!dt) return "";
    try {
      const d = new Date(dt);
      return d.toLocaleDateString("pl-PL", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dt;
    }
  };

  // Extract temporal metadata from first action
  const firstAction = editedActions[0];
  const ti = firstAction?.temporal_interpretation || null;
  const validationErrors = firstAction?.validation_errors || null;

  return (
    <>
      <TemporalBanner ti={ti} validationErrors={validationErrors} />
      <VStack gap="2" align="stretch">
        {editedActions.map((action, i) => {
          const p = action.params || {};
          const colorObj = COLOR_OPTIONS.find((c) => c.key === p.color);
          const colorHex = colorObj ? colorObj.value : "#4299E1";
          return (
            <Box
              key={i}
              bg="white"
              px="4"
              py="3"
              borderRadius="xl"
              borderLeftWidth="4px"
              borderColor={colorHex}
              shadow="0 1px 3px rgba(0,0,0,0.06)"
              borderWidth="1px"
              borderRightColor="gray.100"
              borderTopColor="gray.100"
              borderBottomColor="gray.100"
            >
              <Text fontSize="sm" fontWeight="600" color="textPrimary">
                {p.title || "Wydarzenie"}
              </Text>
              <Text fontSize="xs" color="gray.500" mt="1">
                {p.all_day
                  ? new Date(p.start_datetime || p.start_date).toLocaleDateString("pl-PL", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })
                  : `${formatDatetime(p.start_datetime)}${p.end_datetime ? ` \u2014 ${formatDatetime(p.end_datetime)}` : ""}`}
              </Text>
              {action.confidence_note && (
                <Text fontSize="xs" color="yellow.600" mt="1.5" fontStyle="italic">
                  {action.confidence_note}
                </Text>
              )}
            </Box>
          );
        })}
      </VStack>
      <Flex gap="3" mt="4" px="1">
        <Button
          flex="1"
          bg="rose.400"
          color="white"
          _hover={{ bg: "rose.500" }}
          borderRadius="xl"
          size="md"
          fontWeight="600"
          shadow="0 4px 14px 0 rgba(231, 73, 128, 0.25)"
          onClick={() => onConfirm(editedActions)}
          loading={isProcessing}
        >
          Dodaj wszystkie ({editedActions.length})
        </Button>
        <Button
          flex="1"
          variant="outline"
          borderRadius="xl"
          size="md"
          borderColor="gray.200"
          color="gray.600"
          _hover={{ bg: "gray.50" }}
          onClick={onCancel}
        >
          Anuluj
        </Button>
      </Flex>
    </>
  );
}

// ─── Action Title & Content ──────────────────────────────────

function ActionTitle({ actionType, params }) {
  switch (actionType) {
    case "add_event":
      return "Dodaj wydarzenie";
    case "update_event":
      return "Zmień wydarzenie";
    case "delete_event":
      return "Usuń wydarzenie";
    case "delete_all_events":
      return "Usuń wszystkie wydarzenia";
    case "list_events":
      return `Wydarzenia na ${params.date || ""}`;
    case "create_shopping_list":
      return "Nowa lista zakupów";
    case "add_shopping_items":
      return "Dodaj do listy";
    case "delete_shopping_items":
      return "Usuń z listy";
    case "check_shopping_items":
      return "Oznacz jako kupione";
    case "uncheck_shopping_items":
      return "Odznacz produkty";
    case "add_expense":
      return "Dodaj wydatek";
    case "add_recurring_expense":
      return "Dodaj stały koszt";
    case "delete_recurring_expense":
      return "Usuń stały koszt";
    case "set_budget":
      return "Ustaw budżet";
    case "list_expenses":
      return "Podsumowanie wydatków";
    case "add_goal":
      return "Dodaj cel";
    case "update_goal":
      return "Zmień cel";
    case "delete_goal":
      return "Usuń cel";
    case "toggle_goal":
      return "Zmień status celu";
    case "add_bucket_item":
      return "Dodaj marzenie";
    case "delete_bucket_item":
      return "Usuń marzenie";
    case "toggle_bucket_item":
      return "Zmień status marzenia";
    case "list_goals":
      return "Pokaż cele";
    default:
      return "Nie rozumiem polecenia";
  }
}

function ActionContent({ actionType, params, proposedAction, onConfirm, onCancel, isProcessing }) {
  switch (actionType) {
    case "add_event":
      return (
        <AddEventForm
          params={params}
          proposedAction={proposedAction}
          onConfirm={onConfirm}
          onCancel={onCancel}
          isProcessing={isProcessing}
        />
      );
    case "update_event":
      return (
        <UpdateEventForm
          params={params}
          proposedAction={proposedAction}
          onConfirm={onConfirm}
          onCancel={onCancel}
          isProcessing={isProcessing}
        />
      );
    case "delete_event":
      return (
        <DeleteEventContent
          params={params}
          proposedAction={proposedAction}
          onConfirm={onConfirm}
          onCancel={onCancel}
          isProcessing={isProcessing}
        />
      );
    case "delete_all_events":
      return (
        <DeleteAllEventsContent
          params={params}
          proposedAction={proposedAction}
          onConfirm={onConfirm}
          onCancel={onCancel}
          isProcessing={isProcessing}
        />
      );
    case "list_events":
      return (
        <ListEventsContent
          params={params}
          onCancel={onCancel}
        />
      );
    case "create_shopping_list":
    case "add_shopping_items":
      return (
        <ShoppingListForm
          actionType={actionType}
          params={params}
          proposedAction={proposedAction}
          onConfirm={onConfirm}
          onCancel={onCancel}
          isProcessing={isProcessing}
        />
      );
    case "delete_shopping_items":
    case "check_shopping_items":
    case "uncheck_shopping_items":
      return (
        <DeleteShoppingItemsContent
          params={params}
          proposedAction={proposedAction}
          onConfirm={onConfirm}
          onCancel={onCancel}
          isProcessing={isProcessing}
        />
      );
    case "add_expense":
      return (
        <AddExpenseForm
          params={params}
          proposedAction={proposedAction}
          onConfirm={onConfirm}
          onCancel={onCancel}
          isProcessing={isProcessing}
        />
      );
    case "add_recurring_expense":
      return (
        <AddRecurringExpenseForm
          params={params}
          proposedAction={proposedAction}
          onConfirm={onConfirm}
          onCancel={onCancel}
          isProcessing={isProcessing}
        />
      );
    case "delete_recurring_expense":
      return (
        <DeleteRecurringContent
          params={params}
          proposedAction={proposedAction}
          onConfirm={onConfirm}
          onCancel={onCancel}
          isProcessing={isProcessing}
        />
      );
    case "set_budget":
      return (
        <SetBudgetForm
          params={params}
          proposedAction={proposedAction}
          onConfirm={onConfirm}
          onCancel={onCancel}
          isProcessing={isProcessing}
        />
      );
    case "list_expenses":
      return (
        <ListExpensesContent
          params={params}
          proposedAction={proposedAction}
          onConfirm={onConfirm}
          onCancel={onCancel}
          isProcessing={isProcessing}
        />
      );
    case "add_goal":
      return (
        <AddGoalForm
          params={params}
          proposedAction={proposedAction}
          onConfirm={onConfirm}
          onCancel={onCancel}
          isProcessing={isProcessing}
        />
      );
    case "update_goal":
      return (
        <UpdateGoalForm
          params={params}
          proposedAction={proposedAction}
          onConfirm={onConfirm}
          onCancel={onCancel}
          isProcessing={isProcessing}
        />
      );
    case "delete_goal":
      return (
        <DeleteGoalContent
          params={params}
          proposedAction={proposedAction}
          onConfirm={onConfirm}
          onCancel={onCancel}
          isProcessing={isProcessing}
        />
      );
    case "toggle_goal":
      return (
        <ToggleGoalContent
          params={params}
          proposedAction={proposedAction}
          onConfirm={onConfirm}
          onCancel={onCancel}
          isProcessing={isProcessing}
        />
      );
    case "add_bucket_item":
      return (
        <AddBucketItemForm
          params={params}
          proposedAction={proposedAction}
          onConfirm={onConfirm}
          onCancel={onCancel}
          isProcessing={isProcessing}
        />
      );
    case "delete_bucket_item":
      return (
        <DeleteBucketItemContent
          params={params}
          proposedAction={proposedAction}
          onConfirm={onConfirm}
          onCancel={onCancel}
          isProcessing={isProcessing}
        />
      );
    case "toggle_bucket_item":
      return (
        <ToggleBucketItemContent
          params={params}
          proposedAction={proposedAction}
          onConfirm={onConfirm}
          onCancel={onCancel}
          isProcessing={isProcessing}
        />
      );
    case "list_goals":
      return (
        <ListGoalsContent
          params={params}
          proposedAction={proposedAction}
          onConfirm={onConfirm}
          onCancel={onCancel}
          isProcessing={isProcessing}
        />
      );
    default:
      return (
        <UnknownContent onCancel={onCancel} />
      );
  }
}

// ─── Add Event Form ───────────────────────────────────────────

function AddEventForm({ params, proposedAction, onConfirm, onCancel, isProcessing }) {
  const [title, setTitle] = useState(params.title || "");
  const [startDatetime, setStartDatetime] = useState(params.start_datetime || "");
  const [endDatetime, setEndDatetime] = useState(params.end_datetime || "");
  const [allDay, setAllDay] = useState(!!params.all_day);
  const [description, setDescription] = useState(params.description || "");
  const [color, setColor] = useState(params.color || "sky");
  const [location, setLocation] = useState(params.location || "");
  const [category, setCategory] = useState(params.category || "");

  const handleConfirm = () => {
    const editedParams = {
      ...params,
      title: title.trim(),
      all_day: allDay,
      start_datetime: startDatetime,
      end_datetime: endDatetime || null,
      description: description.trim() || null,
      color,
      location: location.trim() || null,
      category: category.trim() || null,
    };
    normalizeCalendarDates(editedParams);
    onConfirm({ ...proposedAction, params: editedParams });
  };

  return (
    <>
      <EventFormFields
        title={title}
        setTitle={setTitle}
        startDatetime={startDatetime}
        setStartDatetime={setStartDatetime}
        endDatetime={endDatetime}
        setEndDatetime={setEndDatetime}
        allDay={allDay}
        setAllDay={setAllDay}
        description={description}
        setDescription={setDescription}
        color={color}
        setColor={setColor}
        location={location}
        setLocation={setLocation}
        category={category}
        setCategory={setCategory}
      />
      <Flex gap="3" mt="3">
        <Button
          flex="1"
          bg="rose.400"
          color="white"
          _hover={{ bg: "rose.500" }}
          borderRadius="xl"
          size="md"
          fontWeight="600"
          shadow="0 4px 14px 0 rgba(231, 73, 128, 0.25)"
          onClick={handleConfirm}
          loading={isProcessing}
          disabled={!title.trim()}
        >
          Dodaj
        </Button>
        <Button
          flex="1"
          variant="outline"
          borderRadius="xl"
          size="md"
          borderColor="gray.200"
          color="gray.600"
          _hover={{ bg: "gray.50" }}
          onClick={onCancel}
        >
          Anuluj
        </Button>
      </Flex>
    </>
  );
}

// ─── Update Event Form ────────────────────────────────────────

function UpdateEventForm({ params, proposedAction, onConfirm, onCancel, isProcessing }) {
  const [title, setTitle] = useState(params.title || "");
  const [startDatetime, setStartDatetime] = useState(params.start_datetime || "");
  const [endDatetime, setEndDatetime] = useState(params.end_datetime || "");
  const [allDay, setAllDay] = useState(!!params.all_day);
  const [description, setDescription] = useState(params.description || "");
  const [color, setColor] = useState(params.color || "sky");
  const [location, setLocation] = useState(params.location || "");
  const [category, setCategory] = useState(params.category || "");

  const handleConfirm = () => {
    const editedParams = {
      ...params,
      title: title.trim(),
      all_day: allDay,
      start_datetime: startDatetime,
      end_datetime: endDatetime || null,
      description: description.trim() || null,
      color,
      location: location.trim() || null,
      category: category.trim() || null,
    };
    normalizeCalendarDates(editedParams);
    onConfirm({ ...proposedAction, params: editedParams });
  };

  return (
    <>
      <EventFormFields
        title={title}
        setTitle={setTitle}
        startDatetime={startDatetime}
        setStartDatetime={setStartDatetime}
        endDatetime={endDatetime}
        setEndDatetime={setEndDatetime}
        allDay={allDay}
        setAllDay={setAllDay}
        description={description}
        setDescription={setDescription}
        color={color}
        setColor={setColor}
        location={location}
        setLocation={setLocation}
        category={category}
        setCategory={setCategory}
      />
      <Flex gap="3" mt="3">
        <Button
          flex="1"
          bg="rose.400"
          color="white"
          _hover={{ bg: "rose.500" }}
          borderRadius="xl"
          size="md"
          fontWeight="600"
          shadow="0 4px 14px 0 rgba(231, 73, 128, 0.25)"
          onClick={handleConfirm}
          loading={isProcessing}
          disabled={!title.trim()}
        >
          Zapisz
        </Button>
        <Button
          flex="1"
          variant="outline"
          borderRadius="xl"
          size="md"
          borderColor="gray.200"
          color="gray.600"
          _hover={{ bg: "gray.50" }}
          onClick={onCancel}
        >
          Anuluj
        </Button>
      </Flex>
    </>
  );
}

// ─── Delete Event Content ─────────────────────────────────────

function DeleteEventContent({ params, proposedAction, onConfirm, onCancel, isProcessing }) {
  return (
    <>
      <Box bg="red.50" px="3" py="3" borderRadius="xl">
        <Text fontSize="sm" fontWeight="500" color="textSecondary" mb="1">
          {params.title || "Wydarzenie"}
        </Text>
        {params.start_datetime && (
          <Text fontSize="xs" color="gray.500">
            {params.start_datetime}
          </Text>
        )}
        {params.start_date && (
          <Text fontSize="xs" color="gray.500">
            {params.start_date}
          </Text>
        )}
      </Box>
      <Flex gap="3" mt="3">
        <Button
          flex="1"
          bg="red.500"
          color="white"
          _hover={{ bg: "red.600" }}
          borderRadius="xl"
          onClick={() => onConfirm(proposedAction)}
          loading={isProcessing}
        >
          Usuń
        </Button>
        <Button
          flex="1"
          variant="outline"
          borderRadius="xl"
          size="md"
          borderColor="gray.200"
          color="gray.600"
          _hover={{ bg: "gray.50" }}
          onClick={onCancel}
        >
          Anuluj
        </Button>
      </Flex>
    </>
  );
}

// ─── Delete All Events Content ────────────────────────────────

function DeleteAllEventsContent({ params, proposedAction, onConfirm, onCancel, isProcessing }) {
  const dateQuery = params.date_query || "";
  const parts = dateQuery.split("/");
  const startDate = parts[0] || "";
  const endDate = parts[1] || startDate;

  const formatRange = () => {
    try {
      const opts = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
      const start = new Date(startDate + "T00:00:00");
      const end = new Date(endDate + "T00:00:00");
      if (startDate === endDate) {
        return start.toLocaleDateString("pl-PL", opts);
      }
      return `${start.toLocaleDateString("pl-PL", { day: "numeric", month: "long" })} — ${end.toLocaleDateString("pl-PL", opts)}`;
    } catch {
      return dateQuery;
    }
  };

  return (
    <>
      <Box bg="red.50" px="3" py="3" borderRadius="xl" borderWidth="1px" borderColor="red.200">
        <Text fontSize="sm" fontWeight="600" color="red.700" mb="1">
          Usunięcie wszystkich wydarzeń
        </Text>
        <Text fontSize="sm" color="textSecondary">
          {formatRange()}
        </Text>
        <Text fontSize="xs" color="gray.500" mt="1">
          Ta operacja jest nieodwracalna.
        </Text>
      </Box>
      <Flex gap="3" mt="3">
        <Button
          flex="1"
          bg="red.500"
          color="white"
          _hover={{ bg: "red.600" }}
          borderRadius="xl"
          onClick={() => onConfirm(proposedAction)}
          loading={isProcessing}
        >
          Usuń wszystkie
        </Button>
        <Button
          flex="1"
          variant="outline"
          borderRadius="xl"
          size="md"
          borderColor="gray.200"
          color="gray.600"
          _hover={{ bg: "gray.50" }}
          onClick={onCancel}
        >
          Anuluj
        </Button>
      </Flex>
    </>
  );
}

// ─── List Events Content ──────────────────────────────────────

function ListEventsContent({ params, onCancel }) {
  const events = params.events || [];

  return (
    <>
      {events.length === 0 ? (
        <Box bg="gray.50" px="3" py="3" borderRadius="xl">
          <Text fontSize="sm" color="gray.500" textAlign="center">
            Brak wydarzeń
          </Text>
        </Box>
      ) : (
        <VStack gap="2" align="stretch">
          {events.map((evt, i) => (
            <Box
              key={i}
              bg="gray.50"
              px="3"
              py="2"
              borderRadius="xl"
              borderLeftWidth="3px"
              borderColor={`${evt.color || "sky"}.400`}
            >
              <Text fontSize="sm" fontWeight="500" color="textSecondary">
                {evt.title}
              </Text>
              {(evt.start_datetime || evt.start_date) && (
                <Text fontSize="xs" color="gray.500">
                  {evt.start_datetime || evt.start_date}
                </Text>
              )}
            </Box>
          ))}
        </VStack>
      )}
      <Button
        w="full"
        variant="outline"
        borderRadius="xl"
        mt="2"
        onClick={onCancel}
      >
        Zamknij
      </Button>
    </>
  );
}

// ─── Unknown Content ──────────────────────────────────────────

function UnknownContent({ onCancel }) {
  return (
    <>
      <Box bg="gray.50" px="3" py="3" borderRadius="xl">
        <Text fontSize="sm" color="gray.500" textAlign="center">
          Spróbuj powiedzieć np. &ldquo;Dodaj spotkanie jutro o 15&rdquo;
        </Text>
      </Box>
      <Button
        w="full"
        variant="outline"
        borderRadius="xl"
        mt="2"
        onClick={onCancel}
      >
        Zamknij
      </Button>
    </>
  );
}

// ─── Delete Shopping Items Content ───────────────────────────

function DeleteShoppingItemsContent({ params, proposedAction, onConfirm, onCancel, isProcessing }) {
  const items = params.items || [];
  const listName = params.list_name || "lista";

  return (
    <>
      <Box bg="red.50" px="3" py="3" borderRadius="xl" borderWidth="1px" borderColor="red.200">
        <Text fontSize="sm" fontWeight="600" color="red.700" mb="2">
          Usunięcie z listy &ldquo;{listName}&rdquo;
        </Text>
        <VStack gap="1" align="stretch">
          {items.map((item, i) => (
            <Flex key={i} align="center" gap="2">
              <Box w="6px" h="6px" borderRadius="full" bg="red.400" />
              <Text fontSize="sm" color="textSecondary">
                {item.name}
                {item.quantity ? ` (${item.quantity}${item.unit ? " " + item.unit : ""})` : ""}
              </Text>
            </Flex>
          ))}
        </VStack>
      </Box>
      <Flex gap="3" mt="3">
        <Button
          flex="1"
          bg="red.500"
          color="white"
          _hover={{ bg: "red.600" }}
          borderRadius="xl"
          onClick={() => onConfirm(proposedAction)}
          loading={isProcessing}
        >
          Usuń ({items.length})
        </Button>
        <Button
          flex="1"
          variant="outline"
          borderRadius="xl"
          size="md"
          borderColor="gray.200"
          color="gray.600"
          _hover={{ bg: "gray.50" }}
          onClick={onCancel}
        >
          Anuluj
        </Button>
      </Flex>
    </>
  );
}

// ─── Shopping List Form ──────────────────────────────────────

function ShoppingListForm({ actionType, params, proposedAction, onConfirm, onCancel, isProcessing }) {
  const [listName, setListName] = useState(params.list_name || "Zakupy");
  const [items, setItems] = useState(
    (params.items || []).map((item, i) => ({ ...item, _key: i }))
  );
  const [newItemName, setNewItemName] = useState("");

  const updateItem = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addItem = () => {
    const name = newItemName.trim();
    if (!name) return;
    setItems((prev) => [...prev, { name, quantity: null, unit: null, category: null, _key: Date.now() }]);
    setNewItemName("");
  };

  const handleConfirm = () => {
    const edited = {
      ...proposedAction,
      params: {
        ...params,
        list_name: listName.trim(),
        items: items.map(({ _key, ...rest }) => rest),
      },
    };
    onConfirm(edited);
  };

  const isCreate = actionType === "create_shopping_list";

  return (
    <>
      <VStack gap="3" align="stretch">
        {/* Nazwa listy */}
        <Box>
          <Text fontSize="sm" fontWeight="500" color="gray.600" mb="1">
            Nazwa listy *
          </Text>
          <Input
            placeholder="np. Biedronka, Na weekend..."
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            borderRadius="xl"
          />
        </Box>

        {/* Produkty */}
        <Box>
          <Text fontSize="sm" fontWeight="500" color="gray.600" mb="2">
            Produkty ({items.length})
          </Text>
          <VStack gap="2" align="stretch">
            {items.map((item, i) => (
              <Flex
                key={item._key}
                bg="sage.50"
                px="3"
                py="2"
                borderRadius="xl"
                align="center"
                gap="2"
                borderLeftWidth="3px"
                borderColor="sage.300"
              >
                <Box flex="1">
                  <Input
                    size="sm"
                    value={item.name}
                    onChange={(e) => updateItem(i, "name", e.target.value)}
                    variant="flushed"
                    fontWeight="500"
                    borderColor="transparent"
                    _focus={{ borderColor: "sage.400" }}
                  />
                  <Flex gap="2" mt="1">
                    <Input
                      size="sm"
                      placeholder="Ilość"
                      value={item.quantity || ""}
                      onChange={(e) =>
                        updateItem(i, "quantity", e.target.value ? parseFloat(e.target.value) || null : null)
                      }
                      w="70px"
                      variant="flushed"
                      fontSize="xs"
                      borderColor="transparent"
                      _focus={{ borderColor: "sage.400" }}
                    />
                    <Input
                      size="sm"
                      placeholder="Jedn."
                      value={item.unit || ""}
                      onChange={(e) => updateItem(i, "unit", e.target.value || null)}
                      w="60px"
                      variant="flushed"
                      fontSize="xs"
                      borderColor="transparent"
                      _focus={{ borderColor: "sage.400" }}
                    />
                    {item.category && (
                      <Text fontSize="xs" color="gray.400" alignSelf="center">
                        {item.category}
                      </Text>
                    )}
                  </Flex>
                </Box>
                <Box
                  as="button"
                  type="button"
                  onClick={() => removeItem(i)}
                  color="gray.400"
                  _hover={{ color: "red.500" }}
                  p="1"
                  aria-label="Usuń produkt"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Box>
              </Flex>
            ))}

            {/* Dodaj nowy produkt */}
            <Flex gap="2">
              <Input
                placeholder="Dodaj produkt..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addItem();
                  }
                }}
                borderRadius="xl"
                size="sm"
                flex="1"
              />
              <Button
                size="sm"
                borderRadius="xl"
                onClick={addItem}
                disabled={!newItemName.trim()}
                variant="outline"
                colorPalette="green"
              >
                +
              </Button>
            </Flex>
          </VStack>
        </Box>
      </VStack>

      <Flex gap="3" mt="3">
        <Button
          flex="1"
          bg="sage.500"
          color="white"
          _hover={{ bg: "sage.600" }}
          borderRadius="xl"
          onClick={handleConfirm}
          loading={isProcessing}
          disabled={!listName.trim() || items.length === 0}
        >
          {isCreate ? "Utwórz listę" : "Dodaj produkty"}
        </Button>
        <Button
          flex="1"
          variant="outline"
          borderRadius="xl"
          size="md"
          borderColor="gray.200"
          color="gray.600"
          _hover={{ bg: "gray.50" }}
          onClick={onCancel}
        >
          Anuluj
        </Button>
      </Flex>
    </>
  );
}

// ─── Add Expense Form ────────────────────────────────────────

const EXPENSE_CATEGORIES = [
  "Jedzenie", "Transport", "Rozrywka", "Zdrowie", "Dom", "Ubrania", "Rachunki", "Edukacja", "Inne",
];

const MEMBERS = ["Ja", "Partner"];

function AddExpenseForm({ params, proposedAction, onConfirm, onCancel, isProcessing }) {
  const [amount, setAmount] = useState(params.amount || "");
  const [description, setDescription] = useState(params.expense_description || "");
  const [expenseDate, setExpenseDate] = useState(params.expense_date || new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState(params.expense_category || "");
  const [paidBy, setPaidBy] = useState(params.paid_by || "");
  const [isShared, setIsShared] = useState(params.is_shared || false);

  const handleConfirm = () => {
    const edited = {
      ...proposedAction,
      params: {
        ...params,
        amount: parseFloat(amount) || 0,
        expense_description: description.trim() || null,
        expense_date: expenseDate,
        expense_category: category || null,
        paid_by: paidBy || null,
        is_shared: isShared,
      },
    };
    onConfirm(edited);
  };

  return (
    <>
      <VStack gap="3" align="stretch">
        <Box>
          <Text fontSize="sm" fontWeight="500" color="gray.600" mb="1">Kwota (zł) *</Text>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            borderRadius="xl"
            autoFocus
          />
        </Box>
        <Box>
          <Text fontSize="sm" fontWeight="500" color="gray.600" mb="1">Opis</Text>
          <Input
            placeholder="np. Obiad w restauracji"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            borderRadius="xl"
          />
        </Box>
        <Box>
          <DateInput
            value={expenseDate}
            onChange={setExpenseDate}
            accentColor="peach"
            label="Data"
          />
        </Box>
        <Box>
          <Text fontSize="sm" fontWeight="500" color="gray.600" mb="1">Kategoria</Text>
          <Flex gap="1" flexWrap="wrap">
            {EXPENSE_CATEGORIES.map((cat) => (
              <Box
                key={cat}
                as="button"
                type="button"
                fontSize="xs"
                px="2"
                py="1"
                borderRadius="md"
                bg={category === cat ? "peach.500" : "gray.100"}
                color={category === cat ? "white" : "gray.600"}
                cursor="pointer"
                fontWeight="500"
                onClick={() => setCategory(category === cat ? "" : cat)}
              >
                {cat}
              </Box>
            ))}
          </Flex>
        </Box>
        <Box>
          <Text fontSize="sm" fontWeight="500" color="gray.600" mb="1">Kto płaci</Text>
          <Flex gap="1">
            {MEMBERS.map((m) => (
              <Box
                key={m}
                as="button"
                type="button"
                fontSize="xs"
                px="2"
                py="1"
                borderRadius="md"
                bg={paidBy === m ? "peach.500" : "gray.100"}
                color={paidBy === m ? "white" : "gray.600"}
                cursor="pointer"
                fontWeight="500"
                onClick={() => setPaidBy(paidBy === m ? "" : m)}
              >
                {m}
              </Box>
            ))}
          </Flex>
        </Box>
        <Flex align="center" gap="2" cursor="pointer" onClick={() => setIsShared(!isShared)}>
          <Box
            w="18px" h="18px" borderRadius="md"
            border="2px solid"
            borderColor={isShared ? "peach.500" : "gray.300"}
            bg={isShared ? "peach.500" : "transparent"}
            display="flex" alignItems="center" justifyContent="center"
          >
            {isShared && <Text color="white" fontSize="xs" fontWeight="700" lineHeight="1">✓</Text>}
          </Box>
          <Text fontSize="sm" color="gray.600">Wydatek wspólny</Text>
        </Flex>
      </VStack>
      <Flex gap="3" mt="3">
        <Button flex="1" bg="peach.500" color="white" _hover={{ bg: "peach.600" }} borderRadius="xl"
          onClick={handleConfirm} loading={isProcessing} disabled={!amount}>
          Dodaj wydatek
        </Button>
        <Button flex="1" variant="outline" borderRadius="xl" onClick={onCancel}>Anuluj</Button>
      </Flex>
    </>
  );
}

// ─── Add Recurring Expense Form ──────────────────────────────

function AddRecurringExpenseForm({ params, proposedAction, onConfirm, onCancel, isProcessing }) {
  const [name, setName] = useState(params.recurring_name || "");
  const [amount, setAmount] = useState(params.amount || "");
  const [dayOfMonth, setDayOfMonth] = useState(params.day_of_month || 1);
  const [category, setCategory] = useState(params.expense_category || "");
  const [paidBy, setPaidBy] = useState(params.paid_by || "");

  const handleConfirm = () => {
    const edited = {
      ...proposedAction,
      params: {
        ...params,
        recurring_name: name.trim(),
        amount: parseFloat(amount) || 0,
        day_of_month: parseInt(dayOfMonth) || 1,
        expense_category: category || null,
        paid_by: paidBy || null,
      },
    };
    onConfirm(edited);
  };

  return (
    <>
      <VStack gap="3" align="stretch">
        <Box>
          <Text fontSize="sm" fontWeight="500" color="gray.600" mb="1">Nazwa *</Text>
          <Input placeholder="np. Netflix, Czynsz" value={name} onChange={(e) => setName(e.target.value)}
            borderRadius="xl" autoFocus />
        </Box>
        <Flex gap="2">
          <Box flex="2">
            <Text fontSize="sm" fontWeight="500" color="gray.600" mb="1">Kwota (zł) *</Text>
            <Input type="number" step="0.01" placeholder="0.00" value={amount}
              onChange={(e) => setAmount(e.target.value)} borderRadius="xl" />
          </Box>
          <Box flex="1">
            <Text fontSize="sm" fontWeight="500" color="gray.600" mb="1">Dzień mies.</Text>
            <Input type="number" min="1" max="31" value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)} borderRadius="xl" />
          </Box>
        </Flex>
        <Box>
          <Text fontSize="sm" fontWeight="500" color="gray.600" mb="1">Kategoria</Text>
          <Flex gap="1" flexWrap="wrap">
            {EXPENSE_CATEGORIES.map((cat) => (
              <Box key={cat} as="button" type="button" fontSize="xs" px="2" py="1" borderRadius="md"
                bg={category === cat ? "peach.500" : "gray.100"} color={category === cat ? "white" : "gray.600"}
                cursor="pointer" fontWeight="500" onClick={() => setCategory(category === cat ? "" : cat)}>
                {cat}
              </Box>
            ))}
          </Flex>
        </Box>
        <Box>
          <Text fontSize="sm" fontWeight="500" color="gray.600" mb="1">Kto płaci</Text>
          <Flex gap="1">
            {MEMBERS.map((m) => (
              <Box key={m} as="button" type="button" fontSize="xs" px="2" py="1" borderRadius="md"
                bg={paidBy === m ? "peach.500" : "gray.100"} color={paidBy === m ? "white" : "gray.600"}
                cursor="pointer" fontWeight="500" onClick={() => setPaidBy(paidBy === m ? "" : m)}>
                {m}
              </Box>
            ))}
          </Flex>
        </Box>
      </VStack>
      <Flex gap="3" mt="3">
        <Button flex="1" bg="peach.500" color="white" _hover={{ bg: "peach.600" }} borderRadius="xl"
          onClick={handleConfirm} loading={isProcessing} disabled={!name.trim() || !amount}>
          Dodaj stały koszt
        </Button>
        <Button flex="1" variant="outline" borderRadius="xl" onClick={onCancel}>Anuluj</Button>
      </Flex>
    </>
  );
}

// ─── Delete Recurring Content ────────────────────────────────

function DeleteRecurringContent({ params, proposedAction, onConfirm, onCancel, isProcessing }) {
  return (
    <>
      <Box bg="red.50" px="3" py="3" borderRadius="xl" borderWidth="1px" borderColor="red.200">
        <Text fontSize="sm" fontWeight="600" color="red.700" mb="1">
          Usunięcie stałego kosztu
        </Text>
        <Text fontSize="sm" color="textSecondary">
          {params.recurring_name || "Nieznany koszt"}
        </Text>
      </Box>
      <Flex gap="3" mt="3">
        <Button flex="1" bg="red.500" color="white" _hover={{ bg: "red.600" }} borderRadius="xl"
          onClick={() => onConfirm(proposedAction)} loading={isProcessing}>
          Usuń
        </Button>
        <Button flex="1" variant="outline" borderRadius="xl" onClick={onCancel}>Anuluj</Button>
      </Flex>
    </>
  );
}

// ─── Set Budget Form ─────────────────────────────────────────

function SetBudgetForm({ params, proposedAction, onConfirm, onCancel, isProcessing }) {
  const MONTH_NAMES = ["", "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
    "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
  const now = new Date();
  const [amount, setAmount] = useState(params.budget_amount || "");
  const [month, setMonth] = useState(params.budget_month || now.getMonth() + 1);
  const [year, setYear] = useState(params.budget_year || now.getFullYear());

  const handleConfirm = () => {
    const edited = {
      ...proposedAction,
      params: {
        ...params,
        budget_amount: parseFloat(amount) || 0,
        budget_month: parseInt(month),
        budget_year: parseInt(year),
      },
    };
    onConfirm(edited);
  };

  return (
    <>
      <VStack gap="3" align="stretch">
        <Box>
          <Text fontSize="sm" fontWeight="500" color="gray.600" mb="1">Kwota budżetu (zł) *</Text>
          <Input type="number" step="100" placeholder="np. 3000" value={amount}
            onChange={(e) => setAmount(e.target.value)} borderRadius="xl" autoFocus />
        </Box>
        <Box>
          <Text fontSize="sm" fontWeight="500" color="gray.600" mb="1">Miesiąc</Text>
          <Text fontSize="md" fontWeight="600" color="peach.600">
            {MONTH_NAMES[month]} {year}
          </Text>
        </Box>
      </VStack>
      <Flex gap="3" mt="3">
        <Button flex="1" bg="peach.500" color="white" _hover={{ bg: "peach.600" }} borderRadius="xl"
          onClick={handleConfirm} loading={isProcessing} disabled={!amount}>
          Ustaw budżet
        </Button>
        <Button flex="1" variant="outline" borderRadius="xl" onClick={onCancel}>Anuluj</Button>
      </Flex>
    </>
  );
}

// ─── List Expenses Content ───────────────────────────────────

function ListExpensesContent({ params, proposedAction, onConfirm, onCancel, isProcessing }) {
  // This action auto-executes to fetch data, then shows results
  const [executed, setExecuted] = useState(false);

  const handleExecute = () => {
    setExecuted(true);
    onConfirm(proposedAction);
  };

  return (
    <>
      <Box bg="peach.50" px="3" py="3" borderRadius="xl">
        <Text fontSize="sm" color="textSecondary">
          Pokaże podsumowanie wydatków za wybrany miesiąc.
        </Text>
      </Box>
      <Flex gap="3" mt="3">
        <Button flex="1" bg="peach.500" color="white" _hover={{ bg: "peach.600" }} borderRadius="xl"
          onClick={handleExecute} loading={isProcessing}>
          Pokaż
        </Button>
        <Button flex="1" variant="outline" borderRadius="xl" onClick={onCancel}>Anuluj</Button>
      </Flex>
    </>
  );
}

// ─── Mixed Batch Summary (cross-module) ─────────────────────

function MixedBatchSummary({ actions, onConfirm, onCancel, isProcessing }) {
  const MODULE_COLORS = {
    calendar: { bg: "sky.50", border: "sky.300", badge: "sky.500" },
    shopping: { bg: "sage.50", border: "sage.300", badge: "sage.500" },
    expenses: { bg: "orange.50", border: "peach.300", badge: "peach.500" },
    plans: { bg: "rose.50", border: "rose.300", badge: "rose.500" },
  };

  const getActionSummary = (action) => {
    const p = action.params || {};
    const type = action.action_type;
    switch (type) {
      case "add_event":
        return p.title || "Wydarzenie";
      case "update_event":
        return `Zmień: ${p.title || "wydarzenie"}`;
      case "delete_event":
        return `Usuń: ${p.title || "wydarzenie"}`;
      case "delete_all_events":
        return `Usuń wszystkie (${p.date_query || ""})`;
      case "list_events":
        return "Pokaż wydarzenia";
      case "create_shopping_list":
        return `Lista "${p.list_name || "Zakupy"}" (${(p.items || []).length} prod.)`;
      case "add_shopping_items":
        return `Dodaj do "${p.list_name || "listy"}" (${(p.items || []).length} prod.)`;
      case "delete_shopping_items":
        return `Usuń z "${p.list_name || "listy"}"`;
      case "check_shopping_items":
        return `Kupione z "${p.list_name || "listy"}" (${(p.items || []).length} prod.)`;
      case "uncheck_shopping_items":
        return `Odznacz z "${p.list_name || "listy"}" (${(p.items || []).length} prod.)`;
      case "add_expense":
        return `${p.amount || 0} zł — ${p.expense_description || p.expense_category || "wydatek"}`;
      case "add_recurring_expense":
        return `${p.recurring_name || "Stały koszt"} — ${p.amount || 0} zł/mies.`;
      case "delete_recurring_expense":
        return `Usuń: ${p.recurring_name || "stały koszt"}`;
      case "set_budget":
        return `Budżet: ${p.budget_amount || 0} zł`;
      case "list_expenses":
        return "Podsumowanie wydatków";
      case "add_goal":
        return p.goal_title || "Nowy cel";
      case "update_goal":
        return `Zmień: ${p.goal_title || "cel"}`;
      case "delete_goal":
        return `Usuń: ${p.goal_title || "cel"}`;
      case "toggle_goal":
        return `Status: ${p.goal_title || "cel"}`;
      case "add_bucket_item":
        return p.bucket_title || "Nowe marzenie";
      case "delete_bucket_item":
        return `Usuń: ${p.bucket_title || "marzenie"}`;
      case "toggle_bucket_item":
        return `Status: ${p.bucket_title || "marzenie"}`;
      case "list_goals":
        return "Pokaż cele";
      default:
        return "Nieznana akcja";
    }
  };

  return (
    <>
      <VStack gap="2" align="stretch">
        {actions.map((action, i) => {
          const mod = ACTION_MODULE_MAP[action.action_type] || "calendar";
          const colors = MODULE_COLORS[mod] || MODULE_COLORS.calendar;
          return (
            <Box
              key={i}
              bg={colors.bg}
              px="4"
              py="3"
              borderRadius="xl"
              borderLeftWidth="4px"
              borderColor={colors.border}
              shadow="0 1px 3px rgba(0,0,0,0.06)"
              borderWidth="1px"
              borderRightColor="gray.100"
              borderTopColor="gray.100"
              borderBottomColor="gray.100"
            >
              <Flex align="center" gap="2" mb="1">
                <Box
                  fontSize="10px"
                  px="1.5"
                  py="0.5"
                  borderRadius="md"
                  bg={colors.badge}
                  color="white"
                  fontWeight="600"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                >
                  {getModuleLabel(mod)}
                </Box>
                <Text fontSize="xs" color="gray.500">
                  {getActionLabel(action.action_type)}
                </Text>
              </Flex>
              <Text fontSize="sm" fontWeight="600" color="textPrimary">
                {getActionSummary(action)}
              </Text>
              {action.confidence_note && (
                <Text fontSize="xs" color="yellow.600" mt="1" fontStyle="italic">
                  {action.confidence_note}
                </Text>
              )}
            </Box>
          );
        })}
      </VStack>
      <Flex gap="3" mt="4" px="1">
        <Button
          flex="1"
          bg="rose.400"
          color="white"
          _hover={{ bg: "rose.500" }}
          borderRadius="xl"
          size="md"
          fontWeight="600"
          shadow="0 4px 14px 0 rgba(231, 73, 128, 0.25)"
          onClick={() => onConfirm(actions)}
          loading={isProcessing}
        >
          {"Potwierdź wszystkie"} ({actions.length})
        </Button>
        <Button
          flex="1"
          variant="outline"
          borderRadius="xl"
          size="md"
          borderColor="gray.200"
          color="gray.600"
          _hover={{ bg: "gray.50" }}
          onClick={onCancel}
        >
          Anuluj
        </Button>
      </Flex>
    </>
  );
}

// ─── Plans: Add Goal Form ───────────────────────────────────

const GOAL_CATEGORIES = ["finanse", "zdrowie", "rozwoj", "podroze", "dom", "inne"];

const GOAL_CATEGORY_LABELS = {
  finanse: "Finanse",
  zdrowie: "Zdrowie",
  rozwoj: "Rozwój",
  podroze: "Podróże",
  dom: "Dom",
  inne: "Inne",
};

function AddGoalForm({ params, proposedAction, onConfirm, onCancel, isProcessing }) {
  const [title, setTitle] = useState(params.goal_title || "");
  const [description, setDescription] = useState(params.goal_description || "");
  const [category, setCategory] = useState(params.goal_category || "");
  const [targetValue, setTargetValue] = useState(params.goal_target_value || "");
  const [unit, setUnit] = useState(params.goal_unit || "");
  const [deadline, setDeadline] = useState(params.goal_deadline || "");
  const [color, setColor] = useState(params.goal_color || "rose");

  const handleConfirm = () => {
    const edited = {
      ...proposedAction,
      params: {
        ...params,
        goal_title: title.trim(),
        goal_description: description.trim() || null,
        goal_category: category || null,
        goal_color: color,
        goal_target_value: parseFloat(targetValue) || null,
        goal_unit: unit.trim() || null,
        goal_deadline: deadline || null,
      },
    };
    onConfirm(edited);
  };

  return (
    <>
      <VStack gap="3" align="stretch">
        <Box>
          <Text fontSize="sm" fontWeight="500" color="gray.600" mb="1">{"Tytuł celu *"}</Text>
          <Input placeholder={"np. Oszczędzić 10000 zł"} value={title}
            onChange={(e) => setTitle(e.target.value)} borderRadius="xl" autoFocus />
        </Box>
        <Box>
          <Text fontSize="sm" fontWeight="500" color="gray.600" mb="1">Opis</Text>
          <Textarea placeholder="Opcjonalny opis..." value={description}
            onChange={(e) => setDescription(e.target.value)} borderRadius="xl" rows={2} resize="none" />
        </Box>
        <Flex gap="2">
          <Box flex="2">
            <Text fontSize="sm" fontWeight="500" color="gray.600" mb="1">{"Wartość docelowa"}</Text>
            <Input type="number" step="0.01" placeholder="np. 10000" value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)} borderRadius="xl" />
          </Box>
          <Box flex="1">
            <Text fontSize="sm" fontWeight="500" color="gray.600" mb="1">Jednostka</Text>
            <Input placeholder={"zł, kg..."} value={unit}
              onChange={(e) => setUnit(e.target.value)} borderRadius="xl" />
          </Box>
        </Flex>
        <Box>
          <DateInput
            value={deadline}
            onChange={setDeadline}
            accentColor="rose"
            label="Termin"
            clearable
          />
        </Box>
        <Box>
          <Text fontSize="sm" fontWeight="500" color="gray.600" mb="1">Kategoria</Text>
          <Flex gap="1" flexWrap="wrap">
            {GOAL_CATEGORIES.map((cat) => (
              <Box key={cat} as="button" type="button" fontSize="xs" px="2" py="1" borderRadius="md"
                bg={category === cat ? "rose.500" : "gray.100"} color={category === cat ? "white" : "gray.600"}
                cursor="pointer" fontWeight="500" onClick={() => setCategory(category === cat ? "" : cat)}>
                {GOAL_CATEGORY_LABELS[cat]}
              </Box>
            ))}
          </Flex>
        </Box>
        <Box>
          <Text fontSize="sm" fontWeight="500" color="gray.600" mb="2">Kolor</Text>
          <Flex gap="2" justify="center">
            {COLOR_OPTIONS.map((c) => (
              <Box key={c.key} as="button" type="button" w="26px" h="26px" borderRadius="full" bg={c.value}
                border="3px solid" borderColor={color === c.key ? "textPrimary" : "transparent"}
                _hover={{ transform: "scale(1.15)" }} transition="all 0.15s" onClick={() => setColor(c.key)}
                cursor="pointer" shadow={color === c.key ? "0 2px 8px rgba(0,0,0,0.2)" : "0 1px 3px rgba(0,0,0,0.1)"} />
            ))}
          </Flex>
        </Box>
      </VStack>
      <Flex gap="3" mt="3">
        <Button flex="1" bg="rose.500" color="white" _hover={{ bg: "rose.600" }} borderRadius="xl"
          onClick={handleConfirm} loading={isProcessing} disabled={!title.trim()}>
          Dodaj cel
        </Button>
        <Button flex="1" variant="outline" borderRadius="xl" onClick={onCancel}>Anuluj</Button>
      </Flex>
    </>
  );
}

// ─── Plans: Update Goal Form ────────────────────────────────

function UpdateGoalForm({ params, proposedAction, onConfirm, onCancel, isProcessing }) {
  const [title, setTitle] = useState(params.goal_title || "");
  const [description, setDescription] = useState(params.goal_description || "");
  const [category, setCategory] = useState(params.goal_category || "");
  const [targetValue, setTargetValue] = useState(params.goal_target_value || "");
  const [currentValue, setCurrentValue] = useState(params.goal_current_value || "");
  const [unit, setUnit] = useState(params.goal_unit || "");
  const [deadline, setDeadline] = useState(params.goal_deadline || "");

  const handleConfirm = () => {
    const edited = {
      ...proposedAction,
      params: {
        ...params,
        goal_title: title.trim(),
        goal_description: description.trim() || null,
        goal_category: category || null,
        goal_target_value: parseFloat(targetValue) || null,
        goal_current_value: parseFloat(currentValue) || null,
        goal_unit: unit.trim() || null,
        goal_deadline: deadline || null,
      },
    };
    onConfirm(edited);
  };

  return (
    <>
      <VStack gap="3" align="stretch">
        <Box>
          <Text fontSize="sm" fontWeight="500" color="gray.600" mb="1">{"Tytuł celu *"}</Text>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} borderRadius="xl" autoFocus />
        </Box>
        <Box>
          <Text fontSize="sm" fontWeight="500" color="gray.600" mb="1">Opis</Text>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} borderRadius="xl" rows={2} resize="none" />
        </Box>
        <Flex gap="2">
          <Box flex="1">
            <Text fontSize="sm" fontWeight="500" color="gray.600" mb="1">{"Wartość docelowa"}</Text>
            <Input type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} borderRadius="xl" />
          </Box>
          <Box flex="1">
            <Text fontSize="sm" fontWeight="500" color="gray.600" mb="1">{"Aktualny postęp"}</Text>
            <Input type="number" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} borderRadius="xl" />
          </Box>
          <Box flex="1">
            <Text fontSize="sm" fontWeight="500" color="gray.600" mb="1">Jedn.</Text>
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} borderRadius="xl" />
          </Box>
        </Flex>
        <Box>
          <DateInput
            value={deadline}
            onChange={setDeadline}
            accentColor="rose"
            label="Termin"
            clearable
          />
        </Box>
      </VStack>
      <Flex gap="3" mt="3">
        <Button flex="1" bg="rose.500" color="white" _hover={{ bg: "rose.600" }} borderRadius="xl"
          onClick={handleConfirm} loading={isProcessing} disabled={!title.trim()}>
          Zapisz
        </Button>
        <Button flex="1" variant="outline" borderRadius="xl" onClick={onCancel}>Anuluj</Button>
      </Flex>
    </>
  );
}

// ─── Plans: Delete Goal Content ─────────────────────────────

function DeleteGoalContent({ params, proposedAction, onConfirm, onCancel, isProcessing }) {
  return (
    <>
      <Box bg="red.50" px="3" py="3" borderRadius="xl" borderWidth="1px" borderColor="red.200">
        <Text fontSize="sm" fontWeight="600" color="red.700" mb="1">
          {"Usunięcie celu"}
        </Text>
        <Text fontSize="sm" color="textSecondary">
          {params.goal_title || "Nieznany cel"}
        </Text>
      </Box>
      <Flex gap="3" mt="3">
        <Button flex="1" bg="red.500" color="white" _hover={{ bg: "red.600" }} borderRadius="xl"
          onClick={() => onConfirm(proposedAction)} loading={isProcessing}>
          {"Usuń"}
        </Button>
        <Button flex="1" variant="outline" borderRadius="xl" onClick={onCancel}>Anuluj</Button>
      </Flex>
    </>
  );
}

// ─── Plans: Toggle Goal Content ─────────────────────────────

function ToggleGoalContent({ params, proposedAction, onConfirm, onCancel, isProcessing }) {
  return (
    <>
      <Box bg="rose.50" px="3" py="3" borderRadius="xl" borderWidth="1px" borderColor="rose.200">
        <Text fontSize="sm" fontWeight="600" color="rose.700" mb="1">
          {"Zmiana statusu celu"}
        </Text>
        <Text fontSize="sm" color="textSecondary">
          {params.goal_title || "Nieznany cel"}
        </Text>
        <Text fontSize="xs" color="gray.500" mt="1">
          {"Cel zostanie oznaczony jako ukończony/aktywny."}
        </Text>
      </Box>
      <Flex gap="3" mt="3">
        <Button flex="1" bg="rose.500" color="white" _hover={{ bg: "rose.600" }} borderRadius="xl"
          onClick={() => onConfirm(proposedAction)} loading={isProcessing}>
          {"Zmień status"}
        </Button>
        <Button flex="1" variant="outline" borderRadius="xl" onClick={onCancel}>Anuluj</Button>
      </Flex>
    </>
  );
}

// ─── Plans: Add Bucket Item Form ────────────────────────────

const BUCKET_CATEGORIES = ["podroze", "rozwoj", "zdrowie", "finanse", "inne"];

const BUCKET_CATEGORY_LABELS = {
  podroze: "Podróże",
  rozwoj: "Rozwój",
  zdrowie: "Zdrowie",
  finanse: "Finanse",
  inne: "Inne",
};

function AddBucketItemForm({ params, proposedAction, onConfirm, onCancel, isProcessing }) {
  const [title, setTitle] = useState(params.bucket_title || "");
  const [description, setDescription] = useState(params.bucket_description || "");
  const [category, setCategory] = useState(params.bucket_category || "");

  const handleConfirm = () => {
    const edited = {
      ...proposedAction,
      params: {
        ...params,
        bucket_title: title.trim(),
        bucket_description: description.trim() || null,
        bucket_category: category || null,
      },
    };
    onConfirm(edited);
  };

  return (
    <>
      <VStack gap="3" align="stretch">
        <Box>
          <Text fontSize="sm" fontWeight="500" color="gray.600" mb="1">{"Tytuł marzenia *"}</Text>
          <Input placeholder={"np. Podróż do Japonii"} value={title}
            onChange={(e) => setTitle(e.target.value)} borderRadius="xl" autoFocus />
        </Box>
        <Box>
          <Text fontSize="sm" fontWeight="500" color="gray.600" mb="1">Opis</Text>
          <Textarea placeholder="Opcjonalny opis..." value={description}
            onChange={(e) => setDescription(e.target.value)} borderRadius="xl" rows={2} resize="none" />
        </Box>
        <Box>
          <Text fontSize="sm" fontWeight="500" color="gray.600" mb="1">Kategoria</Text>
          <Flex gap="1" flexWrap="wrap">
            {BUCKET_CATEGORIES.map((cat) => (
              <Box key={cat} as="button" type="button" fontSize="xs" px="2" py="1" borderRadius="md"
                bg={category === cat ? "rose.500" : "gray.100"} color={category === cat ? "white" : "gray.600"}
                cursor="pointer" fontWeight="500" onClick={() => setCategory(category === cat ? "" : cat)}>
                {BUCKET_CATEGORY_LABELS[cat]}
              </Box>
            ))}
          </Flex>
        </Box>
      </VStack>
      <Flex gap="3" mt="3">
        <Button flex="1" bg="rose.500" color="white" _hover={{ bg: "rose.600" }} borderRadius="xl"
          onClick={handleConfirm} loading={isProcessing} disabled={!title.trim()}>
          Dodaj marzenie
        </Button>
        <Button flex="1" variant="outline" borderRadius="xl" onClick={onCancel}>Anuluj</Button>
      </Flex>
    </>
  );
}

// ─── Plans: Delete Bucket Item Content ──────────────────────

function DeleteBucketItemContent({ params, proposedAction, onConfirm, onCancel, isProcessing }) {
  return (
    <>
      <Box bg="red.50" px="3" py="3" borderRadius="xl" borderWidth="1px" borderColor="red.200">
        <Text fontSize="sm" fontWeight="600" color="red.700" mb="1">
          {"Usunięcie z listy marzeń"}
        </Text>
        <Text fontSize="sm" color="textSecondary">
          {params.bucket_title || "Nieznana pozycja"}
        </Text>
      </Box>
      <Flex gap="3" mt="3">
        <Button flex="1" bg="red.500" color="white" _hover={{ bg: "red.600" }} borderRadius="xl"
          onClick={() => onConfirm(proposedAction)} loading={isProcessing}>
          {"Usuń"}
        </Button>
        <Button flex="1" variant="outline" borderRadius="xl" onClick={onCancel}>Anuluj</Button>
      </Flex>
    </>
  );
}

// ─── Plans: Toggle Bucket Item Content ──────────────────────

function ToggleBucketItemContent({ params, proposedAction, onConfirm, onCancel, isProcessing }) {
  return (
    <>
      <Box bg="rose.50" px="3" py="3" borderRadius="xl" borderWidth="1px" borderColor="rose.200">
        <Text fontSize="sm" fontWeight="600" color="rose.700" mb="1">
          {"Zmiana statusu marzenia"}
        </Text>
        <Text fontSize="sm" color="textSecondary">
          {params.bucket_title || "Nieznana pozycja"}
        </Text>
        <Text fontSize="xs" color="gray.500" mt="1">
          {"Pozycja zostanie oznaczona jako zrealizowana/niezrealizowana."}
        </Text>
      </Box>
      <Flex gap="3" mt="3">
        <Button flex="1" bg="rose.500" color="white" _hover={{ bg: "rose.600" }} borderRadius="xl"
          onClick={() => onConfirm(proposedAction)} loading={isProcessing}>
          {"Zmień status"}
        </Button>
        <Button flex="1" variant="outline" borderRadius="xl" onClick={onCancel}>Anuluj</Button>
      </Flex>
    </>
  );
}

// ─── Plans: List Goals Content ──────────────────────────────

function ListGoalsContent({ params, proposedAction, onConfirm, onCancel, isProcessing }) {
  const [executed, setExecuted] = useState(false);

  const handleExecute = () => {
    setExecuted(true);
    onConfirm(proposedAction);
  };

  return (
    <>
      <Box bg="rose.50" px="3" py="3" borderRadius="xl">
        <Text fontSize="sm" color="textSecondary">
          {"Pokaże listę Twoich celów i marzeń."}
        </Text>
      </Box>
      <Flex gap="3" mt="3">
        <Button flex="1" bg="rose.500" color="white" _hover={{ bg: "rose.600" }} borderRadius="xl"
          onClick={handleExecute} loading={isProcessing}>
          {"Pokaż"}
        </Button>
        <Button flex="1" variant="outline" borderRadius="xl" onClick={onCancel}>Anuluj</Button>
      </Flex>
    </>
  );
}

// ─── Shared Event Form Fields ─────────────────────────────────

function EventFormFields({
  title,
  setTitle,
  startDatetime,
  setStartDatetime,
  endDatetime,
  setEndDatetime,
  allDay,
  setAllDay,
  description,
  setDescription,
  color,
  setColor,
  location,
  setLocation,
  category,
  setCategory,
}) {
  return (
    <VStack gap="4" align="stretch">
      {/* Tytuł */}
      <Box>
        <Text fontSize="xs" fontWeight="600" color="gray.500" mb="1.5" textTransform="uppercase" letterSpacing="0.5px">
          {"Tytu\u0142 *"}
        </Text>
        <Input
          placeholder="Nazwa wydarzenia"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          borderRadius="xl"
          size="sm"
          bg="gray.50"
          borderColor="gray.200"
          _hover={{ borderColor: "gray.300" }}
          _focus={{ borderColor: "rose.300", bg: "white", boxShadow: "0 0 0 1px var(--chakra-colors-rose-300)" }}
        />
      </Box>

      {/* Cały dzień */}
      <Flex align="center" justify="space-between">
        <Text fontSize="xs" fontWeight="600" color="gray.500" textTransform="uppercase" letterSpacing="0.5px">
          {"Ca\u0142y dzie\u0144"}
        </Text>
        <SwitchRoot
          checked={allDay}
          onCheckedChange={(details) => {
            setAllDay(details.checked);
            if (details.checked && startDatetime) {
              setStartDatetime(startDatetime.split("T")[0]);
              if (endDatetime) setEndDatetime(endDatetime.split("T")[0]);
            } else if (!details.checked && startDatetime) {
              setStartDatetime(startDatetime + "T09:00");
              if (endDatetime) setEndDatetime(endDatetime + "T10:00");
            }
          }}
          colorPalette="blue"
        >
          <SwitchHiddenInput />
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
        </SwitchRoot>
      </Flex>

      {/* Data rozpoczęcia */}
      <Box>
        {allDay ? (
          <DateInput
            value={startDatetime}
            onChange={setStartDatetime}
            accentColor="sky"
            label="Data"
          />
        ) : (
          <DateTimeInput
            value={startDatetime}
            onChange={setStartDatetime}
            accentColor="sky"
            label={"Data i godzina"}
          />
        )}
      </Box>

      {/* Data zakończenia */}
      <Box>
        {allDay ? (
          <DateInput
            value={endDatetime}
            onChange={setEndDatetime}
            accentColor="sky"
            label={"Data zako\u0144czenia"}
          />
        ) : (
          <DateTimeInput
            value={endDatetime}
            onChange={setEndDatetime}
            accentColor="sky"
            label={"Zako\u0144czenie"}
          />
        )}
      </Box>

      {/* Opis */}
      <Box>
        <Text fontSize="xs" fontWeight="600" color="gray.500" mb="1.5" textTransform="uppercase" letterSpacing="0.5px">
          Opis
        </Text>
        <Textarea
          placeholder="Opcjonalny opis..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          borderRadius="xl"
          rows={2}
          resize="none"
          size="sm"
          bg="gray.50"
          borderColor="gray.200"
          _hover={{ borderColor: "gray.300" }}
          _focus={{ borderColor: "rose.300", bg: "white", boxShadow: "0 0 0 1px var(--chakra-colors-rose-300)" }}
        />
      </Box>

      {/* Kolor */}
      <Box>
        <Text fontSize="xs" fontWeight="600" color="gray.500" mb="2" textTransform="uppercase" letterSpacing="0.5px">
          Kolor
        </Text>
        <Flex gap="2" justify="center">
          {COLOR_OPTIONS.map((c) => (
            <Box
              key={c.key}
              as="button"
              type="button"
              w="30px"
              h="30px"
              borderRadius="full"
              bg={c.value}
              border="3px solid"
              borderColor={color === c.key ? "textPrimary" : "transparent"}
              _hover={{ transform: "scale(1.15)" }}
              transition="all 0.15s"
              onClick={() => setColor(c.key)}
              cursor="pointer"
              shadow={color === c.key ? "0 2px 8px rgba(0,0,0,0.2)" : "0 1px 3px rgba(0,0,0,0.1)"}
            />
          ))}
        </Flex>
      </Box>

      {/* Miejsce */}
      <Box>
        <Text fontSize="xs" fontWeight="600" color="gray.500" mb="1.5" textTransform="uppercase" letterSpacing="0.5px">
          Miejsce
        </Text>
        <Input
          placeholder="np. Biuro, Dom..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          borderRadius="xl"
          size="sm"
          bg="gray.50"
          borderColor="gray.200"
          _hover={{ borderColor: "gray.300" }}
          _focus={{ borderColor: "rose.300", bg: "white", boxShadow: "0 0 0 1px var(--chakra-colors-rose-300)" }}
        />
      </Box>

      {/* Kategoria */}
      <Box>
        <Text fontSize="xs" fontWeight="600" color="gray.500" mb="1.5" textTransform="uppercase" letterSpacing="0.5px">
          Kategoria
        </Text>
        <Input
          placeholder="np. Praca, Zdrowie..."
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          borderRadius="xl"
          size="sm"
          bg="gray.50"
          borderColor="gray.200"
          _hover={{ borderColor: "gray.300" }}
          _focus={{ borderColor: "rose.300", bg: "white", boxShadow: "0 0 0 1px var(--chakra-colors-rose-300)" }}
        />
      </Box>
    </VStack>
  );
}
