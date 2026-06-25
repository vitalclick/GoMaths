import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Dimensions, FlatList, Text, TouchableOpacity, View, type ViewToken } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { markOnboardingDone } from "../lib/prefs";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const slides = [
  {
    id: "welcome",
    emoji: "📐",
    title: "Grade 9 maths,\none step at a time",
    body: "GoMaths breaks every topic into short, clear lessons and practice sets — so you always know exactly what to do next.",
    accent: "#008a3e",
  },
  {
    id: "maya",
    emoji: "🤖",
    title: "Meet Maya,\nyour AI tutor",
    body: "Type a question in plain English — or snap a photo of a problem. Maya checks your working, explains mistakes, and never gets impatient.",
    accent: "#2098db",
  },
  {
    id: "progress",
    emoji: "📈",
    title: "Watch yourself\nimprove",
    body: "Every practice session is logged. Track your accuracy, see which topics need work, and celebrate the streaks that prove you're getting better.",
    accent: "#e9ac00",
  },
] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const finish = async () => {
    await markOnboardingDone();
    router.replace("/");
  };

  const next = () => {
    if (activeIndex < slides.length - 1) {
      listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      finish();
    }
  };

  const isLast = activeIndex === slides.length - 1;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Skip button */}
      <View className="items-end px-6 pt-2">
        <TouchableOpacity
          onPress={finish}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
        >
          <Text className="text-base text-muted-foreground">Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={{ width: SCREEN_WIDTH }} className="flex-1 items-center justify-center px-8">
            {/* Illustration circle */}
            <View
              style={{ backgroundColor: item.accent + "22", width: 160, height: 160 }}
              className="items-center justify-center rounded-full"
            >
              <Text style={{ fontSize: 72 }}>{item.emoji}</Text>
            </View>

            <Text className="mt-10 text-center font-display text-3xl font-extrabold text-foreground">
              {item.title}
            </Text>
            <Text className="mt-4 text-center text-base leading-6 text-muted-foreground">
              {item.body}
            </Text>
          </View>
        )}
      />

      {/* Dot indicators */}
      <View className="flex-row justify-center gap-2 pb-4">
        {slides.map((s, i) => (
          <View
            key={s.id}
            style={{
              width: i === activeIndex ? 20 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i === activeIndex ? "#008a3e" : "#dfe7e2",
            }}
          />
        ))}
      </View>

      {/* CTA */}
      <View className="px-6 pb-6 gap-3">
        <TouchableOpacity
          onPress={next}
          accessibilityRole="button"
          accessibilityLabel={isLast ? "Get started" : "Next"}
          style={{ backgroundColor: "#008a3e" }}
          className="w-full items-center rounded-2xl py-4 active:opacity-80"
        >
          <Text className="text-lg font-bold text-white">{isLast ? "Get started" : "Next"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
