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
        <Stack.Screen name="index" options={{ title: "GoMaths" }} />
        <Stack.Screen name="login" options={{ title: "Sign in" }} />
        <Stack.Screen name="register" options={{ title: "Create account" }} />
        <Stack.Screen name="topics" options={{ title: "Grade 9" }} />
        <Stack.Screen name="topic/[id]" options={{ title: "Lesson" }} />
        <Stack.Screen name="practice/[id]" options={{ title: "Practice" }} />
        <Stack.Screen name="tutor" options={{ title: "Maya · AI Tutor" }} />
        <Stack.Screen name="progress" options={{ title: "Progress" }} />
      </Stack>
    </AuthProvider>
  );
}
