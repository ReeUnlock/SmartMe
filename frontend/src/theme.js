import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        // Brand pink — vivid fuchsia-pink
        rose: {
          50: { value: "#FFF0F7" },
          100: { value: "#FFDEEB" },
          200: { value: "#FCC2D7" },
          300: { value: "#FAA2C1" },
          400: { value: "#F783AC" },
          500: { value: "#E64980" },
          600: { value: "#D6336C" },
          700: { value: "#C2255C" },
          800: { value: "#A61E4D" },
          900: { value: "#8C1941" },
        },
        // Warm coral-apricot
        peach: {
          50: { value: "#FFF4ED" },
          100: { value: "#FFE8D6" },
          200: { value: "#FDD0B1" },
          300: { value: "#FCAF8A" },
          400: { value: "#F9915E" },
          500: { value: "#F47340" },
          600: { value: "#E25B2A" },
          700: { value: "#C44B20" },
          800: { value: "#9E3D1B" },
          900: { value: "#7D3118" },
        },
        // Soft teal-mint
        sage: {
          50: { value: "#E6FCF5" },
          100: { value: "#C3FAE8" },
          200: { value: "#96F2D7" },
          300: { value: "#63E6BE" },
          400: { value: "#38D9A9" },
          500: { value: "#20C997" },
          600: { value: "#12B886" },
          700: { value: "#0CA678" },
          800: { value: "#099268" },
          900: { value: "#087F5B" },
        },
        // Warm periwinkle-blue
        sky: {
          50: { value: "#E7F5FF" },
          100: { value: "#D0EBFF" },
          200: { value: "#A5D8FF" },
          300: { value: "#74C0FC" },
          400: { value: "#4DABF7" },
          500: { value: "#339AF0" },
          600: { value: "#228BE6" },
          700: { value: "#1C7ED6" },
          800: { value: "#1971C2" },
          900: { value: "#1864AB" },
        },
        // Rich violet-purple
        lavender: {
          50: { value: "#F3F0FF" },
          100: { value: "#E5DBFF" },
          200: { value: "#D0BFFF" },
          300: { value: "#B197FC" },
          400: { value: "#9775FA" },
          500: { value: "#845EF7" },
          600: { value: "#7950F2" },
          700: { value: "#7048E8" },
          800: { value: "#6741D9" },
          900: { value: "#5F3DC4" },
        },
      },
      fonts: {
        heading: { value: "'Nunito', 'Inter', sans-serif" },
        body: { value: "'Inter', sans-serif" },
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          DEFAULT: { value: "#FBF8F9" },
        },
        // Warm blue-gray text hierarchy — replaces harsh black/gray.800/gray.700
        textPrimary: { value: "#3B4A63" },
        textSecondary: { value: "#5A6B82" },
        textTertiary: { value: "#8294AA" },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
