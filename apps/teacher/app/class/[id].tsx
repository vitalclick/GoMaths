import { Card } from "@gomaths/ui";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchRoster, type RosterStudent } from "../../lib/auth";

export default function ClassRosterScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const [roster, setRoster] = useState<RosterStudent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      setRoster(await fetchRoster(id));
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
      <Stack.Screen options={{ title: name ?? "Roster" }} />
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 64 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text className="font-display text-2xl font-extrabold text-foreground">
          {name ?? "Class roster"}
        </Text>

        {roster === null && !error && (
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

        {roster !== null && roster.length === 0 && (
          <Card className="mt-4">
            <Text className="text-sm text-muted-foreground">
              No learners enrolled in this class yet.
            </Text>
          </Card>
        )}

        {roster && roster.length > 0 && (
          <>
            <Text className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">
              {roster.length} learner{roster.length === 1 ? "" : "s"}
            </Text>
            <View className="mt-3 gap-2">
              {roster.map((s) => (
                <Card key={s.id}>
                  <Text className="font-display text-base font-semibold text-foreground">
                    {s.displayName}
                  </Text>
                  <Text className="mt-0.5 text-xs text-muted-foreground">
                    Grade {s.grade} · enrolled {formatDate(s.enrolledAt)}
                  </Text>
                </Card>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDate(iso: string): string {
  const t = Date.parse(iso);
  if (!t) return "";
  return new Date(t).toLocaleDateString();
}
