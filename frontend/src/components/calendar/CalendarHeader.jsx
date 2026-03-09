import { Flex, Heading, IconButton } from "@chakra-ui/react";
import dayjs from "dayjs";
import "dayjs/locale/pl";

dayjs.locale("pl");

export default function CalendarHeader({ currentMonth, onPrev, onNext }) {
  const label = dayjs(currentMonth).format("MMMM YYYY");
  // Capitalize first letter
  const displayLabel = label.charAt(0).toUpperCase() + label.slice(1);

  return (
    <Flex align="center" justify="space-between" mb="1">
      <IconButton
        aria-label="Poprzedni miesi\u0105c"
        variant="ghost"
        size="sm"
        color="sky.500"
        onClick={onPrev}
        borderRadius="full"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </IconButton>

      <Heading size="md" color="sky.600" fontWeight="600">
        {displayLabel}
      </Heading>

      <IconButton
        aria-label="Nast\u0119pny miesi\u0105c"
        variant="ghost"
        size="sm"
        color="sky.500"
        onClick={onNext}
        borderRadius="full"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </IconButton>
    </Flex>
  );
}
