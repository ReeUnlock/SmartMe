// Shared icon list for calendar events
export const EVENT_ICONS = [
  // Existing icons (from quick-add templates)
  { key: "hospital", emoji: "\u{1F3E5}", label: "Szpital" },
  { key: "stethoscope", emoji: "\u{1FA7A}", label: "Klinika" },
  { key: "baby", emoji: "\u{1F476}", label: "Dzieci" },
  { key: "siren", emoji: "\u{1F6A8}", label: "Dy\u017cur" },
  { key: "coffee", emoji: "\u2615", label: "Odpoczynek" },
  { key: "flower", emoji: "\u{1F338}", label: "Wolne" },
  // New icons
  { key: "gym", emoji: "\u{1F3CB}\uFE0F", label: "Sport" },
  { key: "cart", emoji: "\u{1F6D2}", label: "Zakupy" },
  { key: "plane", emoji: "\u2708\uFE0F", label: "Podr\u00f3\u017c" },
  { key: "cake", emoji: "\u{1F382}", label: "Urodziny" },
  { key: "clipboard", emoji: "\u{1F4CB}", label: "Spotkanie" },
];

export function getIconEmoji(iconKey) {
  if (!iconKey) return null;
  const found = EVENT_ICONS.find((i) => i.key === iconKey);
  return found ? found.emoji : iconKey;
}
