import { Card, Icon, type IconName, Maxi, Pill, ProgressBar } from "@gomaths/ui";
import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../lib/auth";
import { fetchStats, type LearnerStats } from "../../lib/gamification";
import { setDebugEnabled, useDebugEnabled } from "../../lib/prefs";

const ZERO: LearnerStats = {
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

interface Badge {
  id: string;
  icon: IconName;
  label: string;
  desc: string;
  earned: boolean;
}

/** Pure: derive the badge set from a stats snapshot. */
function badgesFor(s: LearnerStats): Badge[] {
  return [
    {
      id: "first",
      icon: "sparkle",
      label: "First Steps",
      desc: "Earn your first XP",
      earned: s.xp > 0,
    },
    { id: "century", icon: "bolt", label: "Century", desc: "Reach 100 XP", earned: s.xp >= 100 },
    {
      id: "streak3",
      icon: "flame",
      label: "On a Roll",
      desc: "3-day streak",
      earned: s.longestStreak >= 3,
    },
    {
      id: "streak7",
      icon: "flame",
      label: "Unstoppable",
      desc: "7-day streak",
      earned: s.longestStreak >= 7,
    },
    {
      id: "level5",
      icon: "star",
      label: "Rising Star",
      desc: "Reach level 5",
      earned: s.level >= 5,
    },
    {
      id: "goal",
      icon: "check",
      label: "Goal Getter",
      desc: "Hit a daily goal",
      earned: s.dailyGoalMet,
    },
  ];
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const debug = useDebugEnabled();
  const [stats, setStats] = useState<LearnerStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setStats(await fetchStats());
    } catch {
      // Non-critical — Profile renders a zeroed state on failure.
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

  const s = stats ? { ...ZERO, ...stats } : ZERO;
  const badges = badgesFor(s);
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 18, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Identity header */}
        <View className="items-center pt-2">
          <Maxi size={84} />
          <Text className="mt-3 font-display text-2xl font-extrabold text-foreground">
            {user?.displayName ?? "Learner"}
          </Text>
          <Text className="mt-0.5 text-sm text-muted-foreground">
            {user ? `Grade ${user.grade}` : ""}
          </Text>
        </View>

        {/* Level + XP */}
        <Card className="mt-5">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Icon name="bolt" size={18} color="#8a6500" />
              <Text className="font-display text-base font-extrabold text-foreground">
                Level {s.level}
              </Text>
            </View>
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
          <View className="mt-3 flex-row gap-2">
            <Pill
              tone="streak"
              icon={<Icon name="flame" size={14} color="#ff6728" />}
              label={`${s.currentStreak}-day streak`}
            />
            <Pill
              tone="xp"
              icon={<Icon name="bolt" size={14} color="#8a6500" />}
              label={`${s.xp} XP`}
            />
          </View>
        </Card>

        {/* Achievements */}
        <View className="mt-6 mb-2 flex-row items-end justify-between">
          <Text className="font-display text-xl font-extrabold tracking-tight text-foreground">
            Achievements
          </Text>
          <Text className="text-xs text-muted-foreground">
            {earnedCount}/{badges.length}
          </Text>
        </View>
        <View className="flex-row flex-wrap" style={{ gap: 10 }}>
          {badges.map((b) => (
            <BadgeTile key={b.id} badge={b} />
          ))}
        </View>

        {/* Links */}
        <View className="mt-6 gap-2">
          <LinkRow href="/progress" icon="chart" label="My progress" />
          <LinkRow href="/conversations" icon="clock" label="Past conversations" />
        </View>

        {/* Account */}
        <View className="mt-8 items-center gap-2">
          <Pressable
            onPress={async () => {
              await logout();
              router.replace("/");
            }}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            className="rounded-full px-4 py-2 active:opacity-60"
          >
            <Text className="text-sm font-extrabold text-destructive">Sign out</Text>
          </Pressable>
          <Pressable
            onPress={() => setDebugEnabled(!debug)}
            accessibilityRole="switch"
            accessibilityState={{ checked: debug }}
            className="rounded-full px-3 py-1 active:opacity-60"
          >
            <Text className="text-[11px] text-muted-foreground">
              Developer mode: {debug ? "ON" : "off"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BadgeTile({ badge }: { badge: Badge }) {
  const earned = badge.earned;
  return (
    <View
      className="rounded-2xl border p-3"
      style={{
        width: "31%",
        alignItems: "center",
        backgroundColor: earned ? "#d7f9de" : "#edf3f0",
        borderColor: earned ? "#008a3e" : "transparent",
        opacity: earned ? 1 : 0.7,
      }}
    >
      <Icon name={earned ? badge.icon : "lock"} size={22} color={earned ? "#008a3e" : "#8B9590"} />
      <Text
        className="mt-1.5 text-center text-[11px] font-extrabold"
        style={{ color: earned ? "#0a140f" : "#5a675f" }}
      >
        {badge.label}
      </Text>
      <Text className="mt-0.5 text-center text-[9px] text-muted-foreground">{badge.desc}</Text>
    </View>
  );
}

function LinkRow({ href, icon, label }: { href: string; icon: IconName; label: string }) {
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="button" accessibilityLabel={label}>
        <Card className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary-soft">
            <Icon name={icon} size={18} color="#008a3e" />
          </View>
          <Text className="flex-1 font-display text-base font-extrabold text-foreground">
            {label}
          </Text>
          <Icon name="arrow-right" size={16} color="#8B9590" />
        </Card>
      </Pressable>
    </Link>
  );
}
