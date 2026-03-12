import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.rafaldebski.smartme",
  appName: "SmartMe",
  webDir: "dist",
  server: {
    // In production builds, the app loads from the bundled assets.
    // For development, uncomment the url below to point to your dev server:
    // url: "http://192.168.x.x:3000",
    androidScheme: "https",
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#FBF8F9",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#FBF8F9",
    },
  },
};

export default config;
