import { Button, Card, Icon } from "@gomaths/ui";
import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchClasses, useAuth, type TeacherClass } from "../lib/auth";

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

  if (!user) return <SignedOut />;
  return (
    <SignedIn
      userName={user.displayName}
      userEmail={user.email}
      onLogout={() => logout().then(() => router.replace("/"))}
    />
  );
}

function SignedOut() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center px-6">
        <Text className="font-display text-4xl font-extrabold text-foreground">
          GoMaths · Teacher
        </Text>
        <Text className="mt-2 text-base text-muted-foreground">
          Manage your classes and follow your learners' progress.
        </Text>
        <View className="mt-8">
          <Link href="/login" asChild>
            <Button label="Sign in" variant="primary" size="lg" fullWidth />
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

function SignedIn({
  userName,
  userEmail,
  onLogout,
}: {
  userName: string;
  userEmail: string;
  onLogout: () => void;
}) {
  const [classes, setClasses] = useState<TeacherClass[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setClasses(await fetchClasses());
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 64 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text className="font-display text-3xl font-extrabold text-foreground">Hi, {userName}</Text>
        <Text className="mt-1 text-sm text-muted-foreground">{userEmail}</Text>

        <Text className="mt-8 font-display text-base font-semibold text-foreground">
          My classes
        </Text>

        {classes === null && !error && (
          <Card className="mt-3">
            <ActivityIndicator />
          </Card>
        )}

        {error && (
          <Card className="mt-3">
            <Text className="text-sm text-destructive">{error}</Text>
            <Text className="mt-2 text-xs text-muted-foreground">
              Pull to refresh, or check your connection.
            </Text>
          </Card>
        )}

        {classes !== null && classes.length === 0 && (
          <Card className="mt-3">
            <Text className="text-sm text-muted-foreground">
              No classes assigned to {userEmail} yet. Once your school admin links you to a class,
              it appears here.
            </Text>
          </Card>
        )}

        {classes && classes.length > 0 && (
          <View className="mt-3 gap-3">
            {classes.map((c) => (
              <ClassCard key={c.id} cls={c} />
            ))}
          </View>
        )}

        <View className="mt-12">
          <Button label="Sign out" variant="ghost" size="sm" fullWidth onPress={onLogout} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ClassCard({ cls }: { cls: TeacherClass }) {
  return (
    <Link href={{ pathname: "/class/[id]", params: { id: cls.id, name: cls.name } }} asChild>
      <Card className="flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft">
          <Icon name="book" size={22} color="#008a3e" />
        </View>
        <View className="flex-1">
          <Text className="font-display text-base font-extrabold text-foreground">{cls.name}</Text>
          <View className="mt-2 flex-row gap-2">
            <Pill label={`Grade ${cls.grade}`} />
            <Pill label={`${cls.studentCount} learner${cls.studentCount === 1 ? "" : "s"}`} />
          </View>
        </View>
        <Icon name="arrow-right" size={16} color="#8B9590" />
      </Card>
    </Link>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <View className="rounded-full bg-muted px-2.5 py-1">
      <Text className="text-xs text-muted-foreground">{label}</Text>
    </View>
  );
}
