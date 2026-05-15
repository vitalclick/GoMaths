import { Button, Card } from "@gomaths/ui";
import { Link, useRouter } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../lib/auth";

export default function HomeScreen() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center px-6">
          <Text className="font-display text-4xl font-extrabold text-foreground">
            GoMaths · Parent
          </Text>
          <Text className="mt-2 text-base text-muted-foreground">
            Keep up with your child's maths journey.
          </Text>

          <Card className="mt-8">
            <Text className="font-display text-base font-semibold text-foreground">
              Phase 1.5 scaffold
            </Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              This app is the entry point for parents. Full features —
              weekly progress digests, push reminders, linked-child view —
              ship when Phase 1.5 begins.
            </Text>
          </Card>

          <View className="mt-8">
            <Link href="/login" asChild>
              <Button label="Sign in" variant="primary" size="lg" fullWidth />
            </Link>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 pt-4">
        <Text className="font-display text-3xl font-extrabold text-foreground">
          Hi, {user.displayName}
        </Text>
        <Text className="mt-1 text-sm text-muted-foreground">{user.email}</Text>

        <Card className="mt-6">
          <Text className="font-display text-base font-semibold text-foreground">
            Linked children
          </Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            No children linked yet. Phase 1.5 brings invite links from the
            Student app's consent flow.
          </Text>
        </Card>

        <Card className="mt-3">
          <Text className="font-display text-base font-semibold text-foreground">
            This week's summary
          </Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            Once a child is linked, you'll see their topics, mastery, and
            time on task here.
          </Text>
        </Card>

        <View className="mt-10">
          <Button
            label="Sign out"
            variant="ghost"
            size="sm"
            fullWidth
            onPress={async () => {
              await logout();
              router.replace("/");
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
