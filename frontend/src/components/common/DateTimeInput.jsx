import { Box, Flex, Text } from "@chakra-ui/react";
import DateInput from "./DateInput";

/**
 * Combined date + time input using Portal-based calendar for the date part.
 *
 * Props:
 *   value        – ISO datetime-local string "YYYY-MM-DDTHH:MM" or ""
 *   onChange      – receives datetime-local string
 *   accentColor  – module color token prefix
 *   required     – HTML required attribute
 *   label        – optional label
 */
export default function DateTimeInput({
  value,
  onChange,
  accentColor = "gray",
  required = false,
  label,
}) {
  const datePart = value ? value.split("T")[0] : "";
  const timePart = value ? value.split("T")[1] || "" : "";

  const accent = (shade) => `${accentColor}.${shade}`;

  const handleDateChange = (newDate) => {
    if (!newDate) {
      onChange("");
      return;
    }
    const time = timePart || "12:00";
    onChange(`${newDate}T${time}`);
  };

  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    const date = datePart || new Date().toISOString().split("T")[0];
    onChange(`${date}T${newTime}`);
  };

  return (
    <>
      {label && (
        <Text fontSize="xs" fontWeight="600" color="gray.500" mb="1.5" textTransform="uppercase" letterSpacing="0.5px">
          {label}
        </Text>
      )}
      <Flex gap={2} align="stretch">
        <Box flex={1}>
          <DateInput
            value={datePart}
            onChange={handleDateChange}
            accentColor={accentColor}
            required={required}
            placeholder="Data"
          />
        </Box>
        <Box
          as="input"
          type="time"
          value={timePart}
          onChange={handleTimeChange}
          required={required}
          px="3"
          py="2"
          borderRadius="xl"
          borderWidth="1px"
          borderColor={accent(200)}
          fontSize="sm"
          bg="white"
          w="120px"
          flexShrink={0}
          _hover={{ borderColor: accent(300) }}
          _focus={{
            borderColor: accent(400),
            outline: "none",
            boxShadow: `0 0 0 1px var(--chakra-colors-${accentColor}-400)`,
          }}
        />
      </Flex>
    </>
  );
}
