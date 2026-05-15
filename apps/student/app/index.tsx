import { Button, Card } from "@gomaths/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="font-display text-3xl font-bold text-foreground">GoMaths</Text>
        <Text className="mt-2 text-center text-base text-muted-foreground">
          Phase 0 scaffold. Replace this screen with the real onboarding flow.
        </Text>

        <Card className="mt-8 w-full">
          <Text className="font-display text-lg font-semibold text-foreground">Maya is ready</Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            Your AI tutor will live here once the AI services are wired up.
          </Text>
        </Card>

        <View className="mt-8 w-full gap-3">
          <Button label="Get started" variant="primary" size="lg" fullWidth />
          <Button label="I already have an account" variant="ghost" size="md" fullWidth />
        </View>
      </View>
    </SafeAreaView>
  );
}
