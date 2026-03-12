import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  plugins: [
    react(),
    // Sentry source map upload — only runs when SENTRY_AUTH_TOKEN is set (CI)
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: {
        name: process.env.SENTRY_RELEASE,
      },
      sourcemaps: {
        filesToDeleteAfterUpload: ["./dist/**/*.map"],
      },
      // Silently skip when auth token is not available (local dev)
      disable: !process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  server: {
    port: 3000,
    host: "0.0.0.0",
    allowedHosts: ["www.smartme.life"],
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-chakra": ["@chakra-ui/react", "@emotion/react"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-utils": ["zustand", "dayjs"],
          "vendor-sentry": ["@sentry/react"],
        },
      },
    },
  },
});
