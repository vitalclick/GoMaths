import { Button } from "@gomaths/ui";
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
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <Text className="text-xs uppercase tracking-wider text-muted-foreground">
          {topic.capsReference}
        </Text>
        <Text className="mt-1 font-display text-3xl font-bold text-foreground">{topic.title}</Text>

        {topic.learningOutcomes.length > 0 && (
          <View className="mt-4 rounded-2xl border border-border bg-card p-4">
            <Text className="text-xs uppercase tracking-wider text-muted-foreground">
              You'll be able to
            </Text>
            {topic.learningOutcomes.map((o, i) => (
              <Text key={i} className="mt-1 text-sm text-foreground">
                • {o}
              </Text>
            ))}
          </View>
        )}

        <View className="mt-6">
          <LessonHtml markdown={topic.lessonMarkdown} />
        </View>

        <View className="mt-8 gap-3">
          <Link href={{ pathname: "/practice/[id]", params: { id: topic.topicId } }} asChild>
            <Button label="Practice this topic" variant="primary" size="lg" fullWidth />
          </Link>
          <Link href={{ pathname: "/tutor", params: { topicId: topic.topicId } }} asChild>
            <Button label="Ask Maya about this" variant="accent" size="md" fullWidth />
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
