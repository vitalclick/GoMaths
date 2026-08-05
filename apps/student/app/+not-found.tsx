/**
 * Safety net for any URL the router can't match.
 *
 * Without this, expo-router falls back to its built-in "Unmatched Route"
 * screen — a development affordance, complete with a link to the route
 * sitemap, that real learners should never be shown. A stray deep link,
 * a stale notification link or an old share URL is a normal thing to hit,
 * so it gets a plain apology and a way back rather than a debug screen.
 *
 * It deliberately does *not* auto-redirect: a broken route stays visible
 * during development instead of silently bouncing home and hiding itself.
 */

import { Button } from "@gomaths/ui";
import { Stack, useRouter } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: "Not found" }} />
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center font-display text-2xl font-bold text-foreground">
            We couldn't find that page
          </Text>
          <Text
            className="mt-2 text-center text-base text-muted-foreground"
            style={{ maxWidth: 280 }}
          >
            The link may be out of date. Let's get you back to your maths.
          </Text>
          <View className="mt-8 w-full">
            <Button label="Go home" size="lg" fullWidth onPress={() => router.replace("/")} />
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}
