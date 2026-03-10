import { useState } from "react";
import { Box, Heading } from "@chakra-ui/react";

export default function SmartMeLogo({ height = "64px" }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <Box>
      {!error && (
        <img
          src="/logo-smartme.png"
          alt="SmartMe"
          style={{
            height,
            objectFit: "contain",
            display: loaded ? "block" : "none",
          }}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
      {(!loaded || error) && (
        <Heading
          size="xl"
          fontFamily="'Nunito', sans-serif"
          fontWeight="800"
          bgGradient="to-r"
          gradientFrom="rose.400"
          gradientTo="lavender.400"
          bgClip="text"
          letterSpacing="-0.02em"
        >
          SmartMe
        </Heading>
      )}
    </Box>
  );
}
