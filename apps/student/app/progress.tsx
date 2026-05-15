import { Card } from "@gomaths/ui";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { masteryByTopic, subscribe, type TopicMastery } from "../lib/progress-store";

export default function ProgressScreen() {
  const [rows, setRows] = useState<TopicMastery[]>(() => [...masteryByTopic().values()]);

  useEffect(() => subscribe(() => setRows([...masteryByTopic().values()])), []);

  if (rows.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-8">
          <Text className="font-display text-2xl font-bold text-foreground">No progress yet</Text>
          <Text className="mt-2 text-center text-base text-muted-foreground">
            Open a topic and try a few practice questions — your mastery shows up here.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        <Text className="mb-2 font-display text-2xl font-bold text-foreground">Your progress</Text>
        {rows.map((r) => (
          <Card key={r.topicId}>
            <Text className="text-xs uppercase tracking-wider text-muted-foreground">
              {r.topicId}
            </Text>
            <View className="mt-2 flex-row items-baseline gap-2">
              <Text className="font-display text-3xl font-extrabold text-foreground">
                {Math.round(r.masteryScore * 100)}%
              </Text>
              <Text className="text-sm text-muted-foreground">
                {r.correct} of {r.attempts} correct
              </Text>
            </View>
            <View className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <View
                className="h-full bg-primary"
                style={{ width: `${Math.round(r.masteryScore * 100)}%` }}
              />
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
