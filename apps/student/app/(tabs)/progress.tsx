import { Card, Icon, ProgressBar } from "@gomaths/ui";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { masteryByTopic, subscribe, type TopicMastery } from "../../lib/progress-store";

export default function ProgressScreen() {
  const [rows, setRows] = useState<TopicMastery[]>(() => [...masteryByTopic().values()]);

  useEffect(() => subscribe(() => setRows([...masteryByTopic().values()])), []);

  if (rows.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-8">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-3xl bg-primary-soft">
            <Icon name="chart" size={30} color="#008a3e" />
          </View>
          <Text className="font-display text-2xl font-extrabold text-foreground">
            No progress yet
          </Text>
          <Text className="mt-2 text-center text-base text-muted-foreground">
            Open a topic and try a few practice questions — your mastery shows up here.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 10, paddingBottom: 110 }}>
        <View className="mb-2">
          <Text className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Mastery
          </Text>
          <Text className="mt-1 font-display text-2xl font-extrabold tracking-tight text-foreground">
            Your progress
          </Text>
        </View>
        {rows.map((r) => {
          const pct = Math.round(r.masteryScore * 100);
          return (
            <Card key={r.topicId}>
              <View className="flex-row items-center justify-between">
                <Text className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  {r.topicId}
                </Text>
                <Text className="font-display text-lg font-extrabold text-foreground">{pct}%</Text>
              </View>
              <View className="mt-2">
                <ProgressBar value={r.masteryScore} height={8} />
              </View>
              <Text className="mt-2 text-xs text-muted-foreground">
                {r.correct} of {r.attempts} correct
              </Text>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
