import { Button, Card, Heading, Maxi, Pill, ProgressBar } from "@gomaths/ui";
import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PreviewBanner } from "../components/PreviewBanner";
import { useAuth } from "../lib/auth";
import { fetchStats, type LearnerStats } from "../lib/gamification";
import { hasCompletedOnboarding, setDebugEnabled, useDebugEnabled } from "../lib/prefs";

export default function HomeScreen() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const debug = useDebugEnabled();
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    hasCompletedOnboarding().then((done) => {
      if (!done) router.replace("/onboarding");
      else setOnboardingChecked(true);
    });
  }, []);

  if (loading || !onboardingChecked) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!user) return <SignedOut />;

  return (
    <SignedIn
      name={user.displayName}
      subtitle={`Grade ${user.grade}`}
      debug={debug}
      onToggleDebug={() => setDebugEnabled(!debug)}
      onLogout={async () => {
        await logout();
        router.replace("/");
      }}
    />
  );
}

function SignedOut() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <PreviewBanner />
      <View className="flex-1 items-center justify-center px-8">
        <Maxi size={120} />
        <Text className="mt-6 font-display text-4xl font-extrabold text-foreground">GoMaths</Text>
        <Text
          className="mt-2 text-center text-base text-muted-foreground"
          style={{ maxWidth: 280 }}
        >
          Your maths buddy. Learn a little every day and keep the streak alive.
        </Text>
        <View className="mt-8 w-full gap-3">
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

const ZERO_STATS: LearnerStats = {
  xp: 0,
  level: 0,
  xpIntoLevel: 0,
  xpForNextLevel: 100,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveOn: null,
  dailyGoal: 5,
  dailyCompleted: 0,
  dailyGoalMet: false,
};

function SignedIn({
  name,
  subtitle,
  debug,
  onToggleDebug,
  onLogout,
}: {
  name: string;
  subtitle: string;
  debug: boolean;
  onToggleDebug: () => void;
  onLogout: () => void;
}) {
  const [stats, setStats] = useState<LearnerStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setStats(await fetchStats());
    } catch {
      // Gamification is non-critical chrome — never block the home on it.
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

  const s = stats ? { ...ZERO_STATS, ...stats } : ZERO_STATS;
  const remaining = Math.max(0, s.dailyGoal - s.dailyCompleted);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <PreviewBanner />
      <ScrollView
        contentContainerStyle={{ padding: 18, paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header: mascot + greeting + stat pills */}
        <View className="flex-row items-center gap-3">
          <Maxi size={48} />
          <View className="flex-1">
            <Text className="text-sm font-semibold text-muted-foreground">Howzit, {name} 👋</Text>
            <Text className="font-display text-xl font-extrabold text-foreground">
              Ready for today?
            </Text>
          </View>
          {stats && (
            <View className="flex-row gap-2">
              <Pill
                tone="streak"
                icon={<Text style={{ fontSize: 13 }}>🔥</Text>}
                label={`${s.currentStreak}`}
              />
              <Pill tone="xp" icon={<Text style={{ fontSize: 13 }}>⚡</Text>} label={`${s.xp}`} />
            </View>
          )}
        </View>

        {/* Daily-goal hero */}
        <View
          style={{
            marginTop: 18,
            borderRadius: 24,
            padding: 20,
            backgroundColor: "#008a3e",
            shadowColor: "#008a3e",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35,
            shadowRadius: 18,
            elevation: 6,
          }}
        >
          <Text
            style={{
              color: "#fff",
              opacity: 0.9,
              fontWeight: "800",
              fontSize: 12,
              letterSpacing: 0.6,
            }}
          >
            ⚡ DAILY GOAL
          </Text>
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 26, marginTop: 6 }}>
            {s.dailyCompleted} of {s.dailyGoal} lessons
          </Text>
          <Text style={{ color: "#fff", opacity: 0.85, fontSize: 13, marginTop: 2 }}>
            {s.dailyGoalMet
              ? "Goal smashed! 🎉"
              : remaining === s.dailyGoal
                ? "Start your first lesson today"
                : `${remaining} to go — keep the streak alive 🔥`}
          </Text>
          <View style={{ marginTop: 16 }}>
            <ProgressBar
              value={s.dailyGoal > 0 ? s.dailyCompleted / s.dailyGoal : 0}
              color="#ffffff"
              trackColor="rgba(0,0,0,0.18)"
            />
          </View>
          <View style={{ marginTop: 16, flexDirection: "row" }}>
            <Link href="/topics" asChild>
              <Pressable
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                }}
                accessibilityRole="button"
                accessibilityLabel="Continue learning"
              >
                <Text style={{ color: "#008a3e", fontWeight: "900", fontSize: 14 }}>
                  Continue →
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>

        {/* Level progress */}
        {stats && (
          <View className="mt-5">
            <View className="flex-row items-center justify-between">
              <Text className="font-display text-sm font-extrabold text-foreground">
                Level {s.level}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {s.xpIntoLevel}/{s.xpForNextLevel} XP
              </Text>
            </View>
            <View className="mt-2">
              <ProgressBar
                value={s.xpForNextLevel > 0 ? s.xpIntoLevel / s.xpForNextLevel : 0}
                height={8}
              />
            </View>
          </View>
        )}

        {/* Quick actions */}
        <View className="mt-7">
          <Heading>Jump back in</Heading>
          <View className="gap-2">
            <ActionCard
              href="/topics"
              emoji="📘"
              title="Browse topics"
              subtitle="Lessons & practice"
            />
            <ActionCard href="/tutor" emoji="💬" title="Chat with Maya" subtitle="Your AI tutor" />
            <ActionCard
              href="/solver"
              emoji="📷"
              title="Scan a problem"
              subtitle="Step-by-step help"
            />
            <ActionCard
              href="/progress"
              emoji="📈"
              title="My progress"
              subtitle="Mastery by topic"
            />
            <ActionCard
              href="/conversations"
              emoji="🕓"
              title="Past conversations"
              subtitle="Revisit Maya's help"
            />
          </View>
        </View>

        <View className="mt-10">
          <Button label="Sign out" variant="ghost" size="sm" fullWidth onPress={onLogout} />
          <Pressable
            onPress={onToggleDebug}
            className="mt-2 self-center rounded-full px-3 py-1 active:opacity-60"
            accessibilityRole="switch"
            accessibilityState={{ checked: debug }}
          >
            <Text className="text-[11px] text-muted-foreground">
              {subtitle} · Developer mode: {debug ? "ON" : "off"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionCard({
  href,
  emoji,
  title,
  subtitle,
}: {
  href: string;
  emoji: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="button" accessibilityLabel={title}>
        <Card className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft">
            <Text style={{ fontSize: 20 }}>{emoji}</Text>
          </View>
          <View className="flex-1">
            <Text className="font-display text-base font-extrabold text-foreground">{title}</Text>
            <Text className="text-xs text-muted-foreground">{subtitle}</Text>
          </View>
          <Text className="text-base text-muted-foreground">→</Text>
        </Card>
      </Pressable>
    </Link>
  );
}
