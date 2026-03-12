import {
  DrawerRoot,
  DrawerBackdrop,
  DrawerPositioner,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerTitle,
} from "@chakra-ui/react";
import { Box, Button, Flex, Text, VStack } from "@chakra-ui/react";
import dayjs from "dayjs";
import "dayjs/locale/pl";
import EventChip from "./EventChip";

dayjs.locale("pl");

export default function DayEventsDrawer({
  isOpen,
  onClose,
  selectedDate,
  events = [],
  onAddEvent,
  onEditEvent,
}) {
  const dateLabel = selectedDate
    ? dayjs(selectedDate).format("dddd, D MMMM YYYY")
    : "";
  const displayLabel = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

  const dayEvents = events
    .filter((ev) => {
      const evDate = dayjs(ev.start_date || ev.start_datetime).format("YYYY-MM-DD");
      return evDate === selectedDate;
    })
    .sort((a, b) => {
      if (a.all_day && !b.all_day) return -1;
      if (!a.all_day && b.all_day) return 1;
      const aTime = a.start_datetime || a.start_date || "";
      const bTime = b.start_datetime || b.start_date || "";
      return aTime.localeCompare(bTime);
    });

  return (
    <DrawerRoot
      open={isOpen}
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
      placement="bottom"
    >
      <DrawerBackdrop />
      <DrawerPositioner>
        <DrawerContent
          borderTopRadius="2xl"
          maxH="70vh"
        >
          <DrawerHeader borderBottomWidth="1px" borderColor="gray.100">
            <Flex align="center" justify="space-between" w="full">
              <DrawerTitle>
                <Text fontSize="md" fontWeight="600" color="rose.600">
                  {displayLabel}
                </Text>
              </DrawerTitle>
              <DrawerCloseTrigger asChild>
                <Box
                  as="button"
                  aria-label="Zamknij"
                  p="1"
                  borderRadius="full"
                  color="gray.400"
                  _hover={{ color: "gray.600" }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Box>
              </DrawerCloseTrigger>
            </Flex>
          </DrawerHeader>

          <DrawerBody py="4" pb={{ base: "calc(16px + env(safe-area-inset-bottom, 0px))", md: "4" }}>
            {dayEvents.length === 0 ? (
              <Flex direction="column" align="center" py="8" gap="2">
                <Text fontSize="3xl">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#74C0FC" strokeWidth="1.5">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </Text>
                <Text color="gray.400" fontSize="sm">
                  {"Brak wydarze\u0144 na ten dzie\u0144"}
                </Text>
              </Flex>
            ) : (
              <VStack gap="2" align="stretch">
                {dayEvents.map((ev) => (
                  <EventChip
                    key={ev.id}
                    event={ev}
                    onClick={() => onEditEvent(ev)}
                  />
                ))}
              </VStack>
            )}

            <Button
              w="full"
              mt="4"
              bg="rose.400"
              color="white"
              _hover={{ bg: "rose.500" }}
              borderRadius="xl"
              size="md"
              shadow="0 2px 8px 0 rgba(231, 73, 128, 0.2)"
              onClick={onAddEvent}
            >
              + Dodaj wydarzenie
            </Button>
          </DrawerBody>
        </DrawerContent>
      </DrawerPositioner>
    </DrawerRoot>
  );
}
