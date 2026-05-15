import { Button, Card } from "@gomaths/ui";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 pt-8">
        <Text className="font-display text-4xl font-extrabold text-foreground">GoMaths</Text>
        <Text className="mt-2 text-base text-muted-foreground">Grade 9 maths, one step at a time.</Text>

        <View className="mt-8 gap-4">
          <Card>
            <Text className="font-display text-lg font-semibold text-foreground">Maya is your buddy</Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              The AI tutor isn't wired up in this prototype, but the lessons and practice below are real.
            </Text>
          </Card>

          <Card>
            <Text className="font-display text-base font-semibold text-foreground">Demo scope</Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              Two Grade 9 algebra topics, real practice questions, real SymPy-validated answer checking
              when the backend is running.
            </Text>
          </Card>
        </View>

        <View className="mt-10 gap-3">
          <Link href="/topics" asChild>
            <Button label="Browse topics" variant="primary" size="lg" fullWidth />
          </Link>
          <Link href="/progress" asChild>
            <Button label="My progress" variant="ghost" size="md" fullWidth />
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
