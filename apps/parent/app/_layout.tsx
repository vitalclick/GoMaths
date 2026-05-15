import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../lib/auth";

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "oklch(0.99 0.005 130)" as unknown as string },
          headerTitleStyle: { fontWeight: "700" },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ title: "GoMaths · Parent" }} />
        <Stack.Screen name="login" options={{ title: "Sign in" }} />
      </Stack>
    </AuthProvider>
  );
}
