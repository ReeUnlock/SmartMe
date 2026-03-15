import { Capacitor } from "@capacitor/core";

export const isIOS = () => Capacitor.getPlatform() === "ios";
export const isAndroid = () => Capacitor.getPlatform() === "android";
export const isNative = () => Capacitor.isNativePlatform();
