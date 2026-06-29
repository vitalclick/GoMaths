import "../global.css";
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from "@expo-google-fonts/nunito";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider } from "../lib/auth";
import { initSentry } from "../lib/sentry";

// Fire Sentry init at module load so we capture render errors that
// happen before the AuthProvider's first effect runs.
initSentry();

export default function RootLayout() {
  // Register the design1 Nunito families (per-weight, since RN can't pick a
  // weight from one custom family). The design-tokens map font-display →
  // ExtraBold and font-sans → Regular against these names.
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fbfcf9",
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#fbfcf9" },
          headerTitleStyle: { fontWeight: "700" },
          headerShadowVisible: false,
        }}
      >
        {/* The five main destinations live in the (tabs) group, which is
            invisible in the URL so /, /topics, /solver, /tutor, /progress
            are unchanged. */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: "Sign in" }} />
        <Stack.Screen name="register" options={{ title: "Create account" }} />
        <Stack.Screen name="topic/[id]" options={{ title: "Lesson" }} />
        <Stack.Screen name="practice/[id]" options={{ title: "Practice" }} />
        <Stack.Screen name="conversations" options={{ title: "Conversations" }} />
        <Stack.Screen name="graphing" options={{ title: "Function Grapher" }} />
      </Stack>
    </AuthProvider>
  );
}
