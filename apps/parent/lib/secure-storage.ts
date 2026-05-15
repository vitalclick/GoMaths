/**
 * Cross-platform secure key-value storage — mirror of the Student app's
 * wrapper. Phase 1 should factor this (and `auth.tsx`, `push.ts`) into
 * a shared workspace package so the three Expo apps don't drift.
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
