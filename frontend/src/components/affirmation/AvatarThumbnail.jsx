import { Box } from "@chakra-ui/react";
import useRewards from "../../hooks/useRewards";
import { getSelectedAvatar, getAvatarConfig } from "./avatarConfig";

/**
 * AvatarThumbnail — clean miniature avatar preview.
 *
 * Renders the avatar SVG in thumbnail mode: no floating, no glow,
 * no sparkles, no text, no interactions. Just the core character
 * scaled to fit a small container.
 *
 * Props:
 *   size  — container size in px (default 44)
 *
 * Reusable in Settings, Gablotka, profile cards, etc.
 */
export default function AvatarThumbnail({ size = 44 }) {
  const level = useRewards((s) => s.level);
  const avatarKey = getSelectedAvatar(level);
  const config = getAvatarConfig(avatarKey);
  const AvatarComponent = config?.component;

  if (!AvatarComponent) return null;

  return (
    <Box
      w={`${size}px`}
      h={`${size}px`}
      flexShrink={0}
      display="flex"
      alignItems="center"
      justifyContent="center"
      css={{
        "& > svg": {
          width: "100%",
          height: "100%",
        },
      }}
    >
      <AvatarComponent mode="thumbnail" />
    </Box>
  );
}
