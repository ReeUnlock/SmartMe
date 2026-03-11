import { useState } from "react";
import { Box, Flex, Text, Input, Heading } from "@chakra-ui/react";
import BottomSheetDialog, { DialogActions } from "../common/BottomSheetDialog";

const CATEGORIES = [
  { value: "podroze", label: "Podróże" },
  { value: "rozwoj", label: "Rozwój" },
  { value: "zdrowie", label: "Zdrowie" },
  { value: "finanse", label: "Finanse" },
  { value: "inne", label: "Inne" },
];

export default function BucketItemFormDialog({ open, onClose, onSubmit, isLoading }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      category: category || null,
    });
    setTitle("");
    setDescription("");
    setCategory("");
  };

  const handleClose = () => {
    onClose();
    setTitle("");
    setDescription("");
    setCategory("");
  };

  return (
    <BottomSheetDialog open={open} onClose={handleClose} maxW="400px" onSubmit={handleSubmit}>
      <Box p={6} pb={0}>
        <Heading size="md" mb={4} color="rose.700" fontFamily="'Nunito', sans-serif">
          {"Nowe marzenie"}
        </Heading>

        <Text fontSize="xs" fontWeight="600" color="gray.500" mb={1}>{"Tytuł *"}</Text>
        <Input
          placeholder={"np. Zobaczyć zorzę polarną"}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          mb={3}
          borderColor="rose.200"
          _focus={{ borderColor: "rose.400", boxShadow: "0 0 0 1px var(--chakra-colors-rose-400)" }}
        />

        <Text fontSize="xs" fontWeight="600" color="gray.500" mb={1}>{"Opis"}</Text>
        <Input
          placeholder={"Opis marzenia"}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          mb={3}
          borderColor="rose.200"
          _focus={{ borderColor: "rose.400", boxShadow: "0 0 0 1px var(--chakra-colors-rose-400)" }}
        />

        <Text fontSize="xs" fontWeight="600" color="gray.500" mb={1}>{"Kategoria"}</Text>
        <Flex gap={2} mb={2} flexWrap="wrap">
          {CATEGORIES.map((cat) => (
            <Text
              key={cat.value}
              as="button"
              type="button"
              fontSize="xs"
              fontWeight="600"
              px={3}
              py={1.5}
              borderRadius="full"
              cursor="pointer"
              bg={category === cat.value ? "rose.300" : "rose.50"}
              color={category === cat.value ? "white" : "rose.500"}
              _hover={{ bg: category === cat.value ? "rose.400" : "rose.100" }}
              transition="all 0.2s"
              onClick={() => setCategory(category === cat.value ? "" : cat.value)}
            >
              {cat.label}
            </Text>
          ))}
        </Flex>
      </Box>

      {/* Sticky actions */}
      <DialogActions>
        <Flex gap={3} justify="flex-end">
          <Text
            as="button"
            type="button"
            onClick={handleClose}
            color="gray.500"
            fontWeight="500"
            cursor="pointer"
            px={4}
            py={2}
            _hover={{ color: "textSecondary" }}
          >
            {"Anuluj"}
          </Text>
          <Text
            as="button"
            type="submit"
            bg="rose.300"
            color="white"
            fontWeight="600"
            px={5}
            py={2}
            borderRadius="xl"
            cursor="pointer"
            opacity={!title.trim() || isLoading ? 0.5 : 1}
            _hover={{ bg: "rose.400" }}
          >
            {isLoading ? "Dodaję…" : "Dodaj"}
          </Text>
        </Flex>
      </DialogActions>
    </BottomSheetDialog>
  );
}
