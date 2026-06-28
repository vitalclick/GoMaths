import { Button, Card, Icon, Maxi } from "@gomaths/ui";
import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchLinkedChildren, useAuth, type LinkedChild } from "../lib/auth";

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
      onLogout={() => logout().then(() => router.replace("/"))}
      userName={user.displayName}
      userEmail={user.email}
    />
  );
}

function SignedOut() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center px-6">
        <View className="mb-4">
          <Maxi size={72} />
        </View>
        <Text className="font-display text-4xl font-extrabold text-foreground">
          GoMaths · Parent
        </Text>
        <Text className="mt-2 text-base text-muted-foreground">
          Keep up with your child's maths journey.
        </Text>

        <Card className="mt-8">
          <Text className="font-display text-base font-semibold text-foreground">
            What you can do today
          </Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            See every child whose parental-consent you've confirmed — name, grade, and when they
            joined. Per-child progress and a weekly digest land in Phase 1.5.
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

function SignedIn({
  userName,
  userEmail,
  onLogout,
}: {
  userName: string;
  userEmail: string;
  onLogout: () => void;
}) {
  const [children, setChildren] = useState<LinkedChild[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setChildren(await fetchLinkedChildren());
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
          Linked children
        </Text>

        {children === null && !error && (
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

        {children !== null && children.length === 0 && (
          <Card className="mt-3">
            <Text className="text-sm text-muted-foreground">
              No children linked to {userEmail} yet. When your child signs up and asks you to
              confirm, the link appears here once you've clicked the email.
            </Text>
          </Card>
        )}

        {children && children.length > 0 && (
          <View className="mt-3 gap-3">
            {children.map((c) => (
              <ChildCard key={c.email} child={c} />
            ))}
          </View>
        )}

        <Text className="mt-10 font-display text-base font-semibold text-foreground">
          This week's summary
        </Text>
        <Card className="mt-3">
          <Text className="text-sm text-muted-foreground">
            Per-child mastery, time on task, and topic-by-topic progress arrive in Phase 1.5. We'll
            email a weekly digest too — opt-in from this screen once the toggle ships.
          </Text>
        </Card>

        <View className="mt-12">
          <Button label="Sign out" variant="ghost" size="sm" fullWidth onPress={onLogout} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ChildCard({ child }: { child: LinkedChild }) {
  return (
    <Card className="flex-row items-center gap-3">
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft">
        <Icon name="profile" size={22} color="#008a3e" />
      </View>
      <View className="flex-1">
        <Text className="font-display text-base font-extrabold text-foreground">
          {child.displayName}
        </Text>
        <Text className="mt-0.5 text-xs text-muted-foreground">{child.email}</Text>
        <View className="mt-2 flex-row gap-2">
          <Pill label={child.grade ? `Grade ${child.grade}` : "Grade —"} />
          <Pill label={`Linked ${formatRelative(child.linkedAt)}`} />
        </View>
      </View>
    </Card>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <View className="rounded-full bg-muted px-2.5 py-1">
      <Text className="text-xs text-muted-foreground">{label}</Text>
    </View>
  );
}

function formatRelative(iso: string): string {
  const then = Date.parse(iso);
  if (!then) return "";
  const days = Math.floor((Date.now() - then) / (24 * 3600 * 1000));
  if (days < 1) return "today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
