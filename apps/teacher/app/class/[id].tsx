import { Card, Icon, ProgressBar } from "@gomaths/ui";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchClassProgress, type ClassProgressEntry } from "../../lib/auth";

export default function ClassProgressScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const [rows, setRows] = useState<ClassProgressEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      setRows(await fetchClassProgress(id));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);

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
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <Stack.Screen options={{ title: name ?? "Class" }} />
      <ScrollView
        contentContainerStyle={{ padding: 18, paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          Class progress
        </Text>
        <Text className="mt-1 font-display text-2xl font-extrabold tracking-tight text-foreground">
          {name ?? "Class"}
        </Text>

        {rows === null && !error && (
          <Card className="mt-4">
            <ActivityIndicator />
          </Card>
        )}

        {error && (
          <Card className="mt-4">
            <Text className="text-sm text-destructive">{error}</Text>
            <Text className="mt-2 text-xs text-muted-foreground">
              Pull to refresh to try again.
            </Text>
          </Card>
        )}

        {rows !== null && rows.length === 0 && (
          <Card className="mt-4">
            <Text className="text-sm text-muted-foreground">
              No learners enrolled in this class yet.
            </Text>
          </Card>
        )}

        {rows && rows.length > 0 && (
          <>
            <Text className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">
              {rows.length} learner{rows.length === 1 ? "" : "s"}
            </Text>
            <View className="mt-3 gap-2">
              {rows.map((s) => (
                <StudentRow key={s.studentId} entry={s} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StudentRow({ entry }: { entry: ClassProgressEntry }) {
  const pct = Math.round(entry.averageMastery * 100);
  return (
    <Card>
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary-soft">
          <Icon name="profile" size={18} color="#008a3e" />
        </View>
        <View className="flex-1">
          <Text className="font-display text-base font-extrabold text-foreground">
            {entry.displayName}
          </Text>
          <Text className="mt-0.5 text-xs text-muted-foreground">
            Grade {entry.grade} · {entry.topicsAttempted} topic
            {entry.topicsAttempted === 1 ? "" : "s"} attempted
          </Text>
        </View>
        <Text className="font-display text-lg font-extrabold text-foreground">{pct}%</Text>
      </View>
      <View className="mt-2">
        <ProgressBar value={entry.averageMastery} height={7} />
      </View>
    </Card>
  );
}
