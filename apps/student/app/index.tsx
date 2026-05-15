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
          <Text className="font-display text-4xl font-extrabold text-foreground">GoMaths</Text>
          <Text className="mt-2 text-base text-muted-foreground">
            Grade 9 maths, one step at a time.
          </Text>

          <Card className="mt-8">
            <Text className="font-display text-lg font-semibold text-foreground">
              Welcome, learner
            </Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              Sign in to track your progress, or create an account to get started.
            </Text>
          </Card>

          <View className="mt-8 gap-3">
            <Link href="/login" asChild>
              <Button label="Sign in" variant="primary" size="lg" fullWidth />
            </Link>
            <Link href="/register" asChild>
              <Button label="Create account" variant="ghost" size="md" fullWidth />
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
        <Text className="mt-1 text-base text-muted-foreground">
          Grade {user.grade} · {user.email}
        </Text>

        <View className="mt-8 gap-4">
          <Card>
            <Text className="font-display text-lg font-semibold text-foreground">
              Continue learning
            </Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              Pick a topic and work through the practice questions. Maya will check your answers.
            </Text>
          </Card>
        </View>

        <View className="mt-10 gap-3">
          <Link href="/topics" asChild>
            <Button label="Browse topics" variant="primary" size="lg" fullWidth />
          </Link>
          <Link href="/tutor" asChild>
            <Button label="Chat with Maya" variant="accent" size="md" fullWidth />
          </Link>
          <Link href="/solver" asChild>
            <Button label="Scan an equation" variant="secondary" size="md" fullWidth />
          </Link>
          <Link href="/conversations" asChild>
            <Button label="Past conversations" variant="ghost" size="md" fullWidth />
          </Link>
          <Link href="/progress" asChild>
            <Button label="My progress" variant="ghost" size="md" fullWidth />
          </Link>
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
