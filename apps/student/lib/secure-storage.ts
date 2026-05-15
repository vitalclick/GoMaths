/**
 * Cross-platform secure key-value storage.
 *
 * - Native: `expo-secure-store` (iOS Keychain, Android Keystore)
 * - Web: `localStorage` (NOT comparably secure — Phase 1 should evaluate
 *   moving refresh tokens to httpOnly cookies for the web build, and
 *   keeping only the access token in memory).
 */

import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
  }
  return SecureStore.getItemAsync(key);
}

export async function removeItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
