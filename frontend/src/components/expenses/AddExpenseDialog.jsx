import { useState } from "react";
import { Box, Flex, Text, Input, Heading } from "@chakra-ui/react";
import { useExpenseCategories, useMembers } from "../../hooks/useExpenses";

export default function AddExpenseDialog({ open, onClose, onSubmit, isLoading, defaultDate }) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split("T")[0]);
  const [categoryId, setCategoryId] = useState(null);
  const [paidById, setPaidById] = useState(null);
  const [isShared, setIsShared] = useState(false);

  const { data: categories } = useExpenseCategories();
  const { data: members } = useMembers();

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return;

    onSubmit({
      amount: val,
      description: description.trim() || null,
      date,
      category_id: categoryId,
      paid_by_id: paidById,
      is_shared: isShared,
    });
    setAmount("");
    setDescription("");
    setCategoryId(null);
    setPaidById(null);
    setIsShared(false);
  };

  return (
    <Box position="fixed" inset={0} zIndex={2000} display="flex" alignItems="center" justifyContent="center">
      <Box position="absolute" inset={0} bg="blackAlpha.400" onClick={onClose} />
      <Box
        as="form"
        onSubmit={handleSubmit}
        bg="white"
        borderRadius="2xl"
        p={6}
        w="90%"
        maxW="400px"
        shadow="xl"
        position="relative"
        zIndex={1}
        maxH="90vh"
        overflowY="auto"
      >
        <Heading size="md" mb={4} color="peach.600" fontFamily="'Nunito', sans-serif">
          Nowy wydatek
        </Heading>

        {/* Amount */}
        <Text fontSize="sm" fontWeight="500" color="gray.600" mb={1}>Kwota (zł) *</Text>
        <Input
          placeholder="0.00"
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
          mb={3}
          borderColor="peach.200"
          _focus={{ borderColor: "peach.400", boxShadow: "0 0 0 1px var(--chakra-colors-peach-400)" }}
        />

        {/* Description */}
        <Text fontSize="sm" fontWeight="500" color="gray.600" mb={1}>Opis</Text>
        <Input
          placeholder="np. Obiad w restauracji"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          mb={3}
          borderColor="peach.200"
          _focus={{ borderColor: "peach.400", boxShadow: "0 0 0 1px var(--chakra-colors-peach-400)" }}
        />

        {/* Date */}
        <Text fontSize="sm" fontWeight="500" color="gray.600" mb={1}>Data</Text>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          mb={3}
          borderColor="peach.200"
          _focus={{ borderColor: "peach.400", boxShadow: "0 0 0 1px var(--chakra-colors-peach-400)" }}
        />

        {/* Category */}
        {categories?.length > 0 && (
          <Box mb={3}>
            <Text fontSize="sm" fontWeight="500" color="gray.600" mb={1}>Kategoria</Text>
            <Flex gap={1} flexWrap="wrap">
              {categories.map((cat) => (
                <Text
                  key={cat.id}
                  as="button"
                  type="button"
                  fontSize="xs"
                  px={2}
                  py={1}
                  borderRadius="md"
                  bg={categoryId === cat.id ? "peach.500" : "gray.100"}
                  color={categoryId === cat.id ? "white" : "gray.600"}
                  cursor="pointer"
                  fontWeight="500"
                  onClick={() => setCategoryId(categoryId === cat.id ? null : cat.id)}
                  _hover={{ bg: categoryId === cat.id ? "peach.600" : "gray.200" }}
                >
                  {cat.name}
                </Text>
              ))}
            </Flex>
          </Box>
        )}

        {/* Paid by */}
        {members?.length > 0 && (
          <Box mb={3}>
            <Text fontSize="sm" fontWeight="500" color="gray.600" mb={1}>Kto płaci</Text>
            <Flex gap={1}>
              {members.map((m) => (
                <Text
                  key={m.id}
                  as="button"
                  type="button"
                  fontSize="xs"
                  px={2}
                  py={1}
                  borderRadius="md"
                  bg={paidById === m.id ? "peach.500" : "gray.100"}
                  color={paidById === m.id ? "white" : "gray.600"}
                  cursor="pointer"
                  fontWeight="500"
                  onClick={() => setPaidById(paidById === m.id ? null : m.id)}
                  _hover={{ bg: paidById === m.id ? "peach.600" : "gray.200" }}
                >
                  {m.name}
                </Text>
              ))}
            </Flex>
          </Box>
        )}

        {/* Shared */}
        <Flex
          align="center"
          gap={2}
          mb={4}
          cursor="pointer"
          onClick={() => setIsShared(!isShared)}
        >
          <Box
            w="18px"
            h="18px"
            borderRadius="md"
            border="2px solid"
            borderColor={isShared ? "peach.500" : "gray.300"}
            bg={isShared ? "peach.500" : "transparent"}
            display="flex"
            alignItems="center"
            justifyContent="center"
            transition="all 0.15s"
          >
            {isShared && <Text color="white" fontSize="xs" fontWeight="700" lineHeight="1">✓</Text>}
          </Box>
          <Text fontSize="sm" color="gray.600">Wydatek wspólny</Text>
        </Flex>

        {/* Actions */}
        <Flex gap={3} justify="flex-end">
          <Text
            as="button"
            type="button"
            onClick={onClose}
            color="gray.500"
            fontWeight="500"
            cursor="pointer"
            px={4}
            py={2}
            _hover={{ color: "gray.700" }}
          >
            Anuluj
          </Text>
          <Text
            as="button"
            type="submit"
            bg="peach.500"
            color="white"
            fontWeight="600"
            px={5}
            py={2}
            borderRadius="lg"
            cursor="pointer"
            opacity={!amount || isLoading ? 0.5 : 1}
            _hover={{ bg: "peach.600" }}
          >
            {isLoading ? "Dodaję…" : "Dodaj"}
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}
