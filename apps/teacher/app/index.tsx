import { Button, Card } from "@gomaths/ui";
import { Link, useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
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
            GoMaths · Teacher
          </Text>
          <Text className="mt-2 text-base text-muted-foreground">
            Manage your classes and follow your learners' progress.
          </Text>

          <Card className="mt-8">
            <Text className="font-display text-base font-semibold text-foreground">Phase 1</Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              Roster, per-student progress, assignment creation and grading land in Phase 1. This
              skeleton boots end-to-end and shares auth with the rest of the apps so we can iterate.
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
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text className="font-display text-3xl font-extrabold text-foreground">
          Hi, {user.displayName}
        </Text>
        <Text className="mt-1 text-sm text-muted-foreground">{user.email}</Text>

        <Card className="mt-6">
          <Text className="font-display text-base font-semibold text-foreground">Classes</Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            Your class roster shows here once Phase 1's roster import is wired (see
            apps/teacher/README.md).
          </Text>
        </Card>

        <Card className="mt-3">
          <Text className="font-display text-base font-semibold text-foreground">Assignments</Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            Create from the curriculum bank or AI-draft them. Lands with the curriculum module.
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
      </ScrollView>
    </SafeAreaView>
  );
}
