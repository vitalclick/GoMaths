import { Button, Card, Icon } from "@gomaths/ui";
import { Link, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LessonHtml } from "../../components/LessonHtml";
import { getTopic, type Topic } from "../../lib/curriculum";
import { record } from "../../lib/progress-store";

export default function TopicScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getTopic(id)
      .then((t) => {
        setTopic(t);
        record({ type: "lesson_started", topicId: t.topicId });
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background px-6 pt-8">
        <Text className="text-base text-destructive">Couldn't load topic: {error}</Text>
      </SafeAreaView>
    );
  }

  if (!topic) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
          {formatContentArea(topic.contentArea)} · {topic.capsReference}
        </Text>
        <Text className="mt-1 font-display text-3xl font-extrabold tracking-tight text-foreground">
          {topic.title}
        </Text>
        <View className="mt-2 flex-row items-center gap-1.5">
          <Icon name="clock" size={13} color="#8B9590" />
          <Text className="text-xs text-muted-foreground">~{topic.estimatedMinutes} min</Text>
        </View>

        {topic.learningOutcomes.length > 0 && (
          <Card className="mt-5">
            <Text className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
              You'll be able to
            </Text>
            <View className="mt-2 gap-2">
              {topic.learningOutcomes.map((o, i) => (
                <View key={i} className="flex-row gap-2">
                  <View className="mt-0.5">
                    <Icon name="check" size={15} color="#05ab58" strokeWidth={2.5} />
                  </View>
                  <Text className="flex-1 text-sm text-foreground">{o}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        <View className="mt-6">
          <LessonHtml markdown={topic.lessonMarkdown} />
        </View>

        <View className="mt-8 gap-3">
          <Link href={{ pathname: "/practice/[id]", params: { id: topic.topicId } }} asChild>
            <Button label="Practice this topic" variant="primary" size="lg" fullWidth />
          </Link>
          <Link href={{ pathname: "/tutor", params: { topicId: topic.topicId } }} asChild>
            <Button label="Ask Maya about this" variant="ai" size="md" fullWidth />
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatContentArea(area: string): string {
  return area.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
