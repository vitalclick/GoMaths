import { Button, Card } from "@gomaths/ui";
import { Link, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { checkAnswer, listQuestions, type Question } from "../../lib/curriculum";
import { record } from "../../lib/progress-store";

type Feedback =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "answered"; correct: boolean; validated: boolean; expected: string };

export default function PracticeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback>({ state: "idle" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    listQuestions(id)
      .then(setQuestions)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background px-6 pt-8">
        <Text className="text-base text-destructive">Couldn't load questions: {error}</Text>
      </SafeAreaView>
    );
  }

  if (!questions) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background px-6 pt-8">
        <Text className="text-base text-muted-foreground">No questions yet for this topic.</Text>
      </SafeAreaView>
    );
  }

  if (index >= questions.length) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="font-display text-3xl font-bold text-foreground">All done!</Text>
          <Text className="mt-2 text-center text-base text-muted-foreground">
            You worked through every question for this topic.
          </Text>
          <View className="mt-8 w-full gap-3">
            <Link href="/progress" asChild>
              <Button label="See progress" variant="primary" size="lg" fullWidth />
            </Link>
            <Link href="/topics" asChild>
              <Button label="Pick another topic" variant="ghost" size="md" fullWidth />
            </Link>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const q = questions[index];

  const submit = async () => {
    if (!answer.trim()) return;
    setFeedback({ state: "checking" });
    try {
      const result = await checkAnswer(q.id, answer);
      record({
        type: result.correct ? "question_correct" : "question_incorrect",
        topicId: q.topicId,
        questionId: q.id,
      });
      setFeedback({
        state: "answered",
        correct: result.correct,
        validated: result.validated,
        expected: result.expected,
      });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const next = () => {
    setIndex((i) => i + 1);
    setAnswer("");
    setFeedback({ state: "idle" });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-xs uppercase tracking-wider text-muted-foreground">
          Question {index + 1} of {questions.length} · {q.difficulty}
        </Text>

        <Card className="mt-3">
          <Text className="text-xs uppercase tracking-wider text-muted-foreground">Solve</Text>
          <Text className="mt-2 font-mono text-2xl text-foreground">{q.stem}</Text>
        </Card>

        <View className="mt-6">
          <Text className="text-xs uppercase tracking-wider text-muted-foreground">
            Your answer
          </Text>
          <TextInput
            value={answer}
            onChangeText={setAnswer}
            placeholder="e.g. x = 4"
            editable={feedback.state !== "answered"}
            autoCorrect={false}
            autoCapitalize="none"
            className="mt-2 rounded-2xl border border-border bg-card px-4 py-3 font-mono text-lg text-foreground"
          />
        </View>

        {feedback.state === "answered" && (
          <Card className={feedback.correct ? "mt-4 border-success" : "mt-4 border-destructive"}>
            <Text
              className={`font-display text-lg font-bold ${feedback.correct ? "text-success" : "text-destructive"}`}
            >
              {feedback.correct ? "Correct" : "Not quite"}
            </Text>
            {!feedback.correct && (
              <Text className="mt-1 text-sm text-foreground">
                Expected: <Text className="font-mono">{feedback.expected}</Text>
              </Text>
            )}
            <Text className="mt-2 text-xs text-muted-foreground">
              {feedback.validated
                ? "Verified by SymPy."
                : "Quick string check only — backend offline."}
            </Text>
            {q.solutionSteps.length > 0 && (
              <View className="mt-3">
                <Text className="text-xs uppercase tracking-wider text-muted-foreground">
                  Working
                </Text>
                {q.solutionSteps.map((s, i) => (
                  <Text key={i} className="mt-1 text-sm text-foreground">
                    {i + 1}. {s}
                  </Text>
                ))}
              </View>
            )}
          </Card>
        )}

        <View className="mt-6">
          {feedback.state === "answered" ? (
            <Button label="Next question" variant="primary" size="lg" fullWidth onPress={next} />
          ) : (
            <Button
              label={feedback.state === "checking" ? "Checking…" : "Check answer"}
              variant="primary"
              size="lg"
              fullWidth
              disabled={feedback.state === "checking" || !answer.trim()}
              onPress={submit}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
