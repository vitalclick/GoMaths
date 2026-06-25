import { Link, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  type ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { markOnboardingDone } from "../lib/prefs";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Maxi mascot (faithful port of UI/design1/tokens.jsx Maxi component) ───
function Maxi({ size = 64 }: { size?: number }) {
  const eyeY = size * 0.38;
  const eyeSize = size * 0.14;
  const eyeOffset = size * 0.18;
  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      {/* body */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#008a3e",
          borderRadius: size * 0.38,
          shadowColor: "#004d1e",
          shadowOffset: { width: 0, height: size * 0.04 },
          shadowOpacity: 0.35,
          shadowRadius: size * 0.08,
          elevation: 6,
        }}
      />
      {/* cheek highlight */}
      <View
        style={{
          position: "absolute",
          top: size * 0.2,
          left: size * 0.18,
          width: size * 0.28,
          height: size * 0.22,
          backgroundColor: "rgba(255,255,255,0.35)",
          borderRadius: size * 0.14,
        }}
      />
      {/* left eye */}
      <View
        style={{
          position: "absolute",
          top: eyeY,
          left: eyeOffset,
          width: eyeSize,
          height: eyeSize,
          backgroundColor: "#0a140f",
          borderRadius: eyeSize / 2,
        }}
      >
        <View
          style={{
            position: "absolute",
            top: "15%",
            left: "15%",
            width: "40%",
            height: "40%",
            backgroundColor: "#fff",
            borderRadius: 99,
          }}
        />
      </View>
      {/* right eye */}
      <View
        style={{
          position: "absolute",
          top: eyeY,
          right: eyeOffset,
          width: eyeSize,
          height: eyeSize,
          backgroundColor: "#0a140f",
          borderRadius: eyeSize / 2,
        }}
      >
        <View
          style={{
            position: "absolute",
            top: "15%",
            left: "15%",
            width: "40%",
            height: "40%",
            backgroundColor: "#fff",
            borderRadius: 99,
          }}
        />
      </View>
      {/* smile */}
      <View
        style={{
          position: "absolute",
          bottom: size * 0.22,
          left: size * 0.32,
          width: size * 0.36,
          height: size * 0.18,
          borderBottomWidth: size * 0.05,
          borderBottomColor: "#0a140f",
          borderBottomLeftRadius: 99,
          borderBottomRightRadius: 99,
        }}
      />
    </View>
  );
}

// ─── Floating math chip ─────────────────────────────────────────────────────
function MathChip({
  label,
  color,
  rotate,
  top,
  bottom,
  left,
  right,
}: {
  label: string;
  color: string;
  rotate: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}) {
  return (
    <View
      style={{
        position: "absolute",
        top,
        bottom,
        left,
        right,
        backgroundColor: "#ffffff",
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 8,
        shadowColor: "#0a140f",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        transform: [{ rotate: `${rotate}deg` }],
      }}
    >
      <Text style={{ fontFamily: "monospace", fontSize: 13, fontWeight: "700", color }}>
        {label}
      </Text>
    </View>
  );
}

// ─── Screen 1: Welcome ──────────────────────────────────────────────────────
function WelcomeSlide({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <View style={{ width: SCREEN_WIDTH, flex: 1 }} className="bg-background overflow-hidden">
      {/* decorative blobs */}
      <View
        style={{
          position: "absolute",
          top: -40,
          right: -30,
          width: 180,
          height: 180,
          borderRadius: 90,
          backgroundColor: "#d7f9de",
          opacity: 0.7,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 90,
          left: -50,
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: "#e8e0ff",
          opacity: 0.5,
        }}
      />

      {/* centre content */}
      <View className="flex-1 items-center justify-center px-8">
        <Maxi size={140} />

        <MathChip label="x² + 2x" color="#008a3e" rotate={-8} top={-220} left={-60} />
        <MathChip label="√169" color="#ea3c3f" rotate={6} top={-190} right={-60} />
        <MathChip label="½ + ⅓" color="#2098db" rotate={10} bottom={0} right={-60} />

        <Text
          style={{ fontWeight: "900", fontSize: 34, letterSpacing: -0.8, lineHeight: 38 }}
          className="mt-7 text-center text-foreground"
        >
          Hi, I'm Maxi!
        </Text>
        <Text
          className="mt-3 text-center text-base leading-6 text-muted-foreground"
          style={{ maxWidth: 270 }}
        >
          Your maths buddy. Together we'll turn tricky problems into wins — one streak at a time.
        </Text>
      </View>

      {/* CTAs */}
      <View className="px-6 pb-2 gap-3">
        <TouchableOpacity
          onPress={onGetStarted}
          accessibilityRole="button"
          accessibilityLabel="Get started"
          style={{ backgroundColor: "#008a3e" }}
          className="w-full flex-row items-center justify-center rounded-2xl py-4 gap-2 active:opacity-80"
        >
          <Text style={{ color: "#fff", fontSize: 17, fontWeight: "900" }}>Get started</Text>
          <Text style={{ color: "#fff", fontSize: 17 }}>→</Text>
        </TouchableOpacity>
        <Link href="/login" asChild>
          <TouchableOpacity
            accessibilityRole="button"
            className="w-full items-center rounded-2xl py-3 active:opacity-60"
          >
            <Text className="text-base text-muted-foreground" style={{ fontWeight: "700" }}>
              I already have an account
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

// ─── Grade row ──────────────────────────────────────────────────────────────
const GRADES = [
  { id: "R", label: "Grade R", sub: "Ages 5–6", tone: "amber" },
  { id: "1-3", label: "Grade 1–3", sub: "Foundation", tone: "mint" },
  { id: "4-6", label: "Grade 4–6", sub: "Intermediate", tone: "purple" },
  { id: "7-9", label: "Grade 7–9", sub: "Senior · pilot grade", tone: "mint" },
  { id: "10", label: "Grade 10", sub: "FET", tone: "amber" },
  { id: "11", label: "Grade 11", sub: "FET", tone: "purple" },
  { id: "12", label: "Grade 12", sub: "Matric", tone: "mint" },
] as const;

const TONE_BG: Record<string, string> = {
  mint: "#d7f9de",
  amber: "#fef3c7",
  purple: "#ede9fe",
};
const TONE_FG: Record<string, string> = {
  mint: "#008a3e",
  amber: "#92400e",
  purple: "#5b21b6",
};

function GradeSlide({
  selected,
  onSelect,
  onBack,
  onContinue,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <View style={{ width: SCREEN_WIDTH, flex: 1 }} className="bg-background">
      {/* top nav */}
      <View className="flex-row items-center justify-between px-6 pt-2 pb-4">
        <TouchableOpacity
          onPress={onBack}
          accessibilityRole="button"
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: "#ffffff",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <PageDots active={1} />
        <View style={{ width: 40 }} />
      </View>

      <View className="px-6 pb-4">
        <Text
          style={{ fontSize: 28, fontWeight: "900", letterSpacing: -0.6, lineHeight: 32 }}
          className="text-foreground"
        >
          What grade are you in?
        </Text>
        <Text className="mt-1.5 text-sm text-muted-foreground">
          We'll match the curriculum to your year.
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ gap: 10, paddingBottom: 12 }}>
        {GRADES.map((g) => {
          const active = selected === g.id;
          return (
            <Pressable
              key={g.id}
              onPress={() => onSelect(g.id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={g.label}
              style={{
                backgroundColor: active ? "#008a3e" : "#ffffff",
                borderRadius: 18,
                padding: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                borderWidth: 2,
                borderColor: active ? "#006b30" : "transparent",
                shadowColor: "#0a140f",
                shadowOffset: { width: 0, height: active ? 6 : 1 },
                shadowOpacity: active ? 0.25 : 0.06,
                shadowRadius: active ? 12 : 4,
                elevation: active ? 5 : 1,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: active ? "rgba(255,255,255,0.18)" : TONE_BG[g.tone],
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "900",
                    color: active ? "#fff" : TONE_FG[g.tone],
                    letterSpacing: -0.2,
                  }}
                >
                  {g.id}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "900",
                    letterSpacing: -0.2,
                    color: active ? "#fff" : "#0a140f",
                  }}
                >
                  {g.label}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    marginTop: 2,
                    color: active ? "rgba(255,255,255,0.85)" : "#8B9590",
                  }}
                >
                  {g.sub}
                </Text>
              </View>
              {active && (
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: "rgba(255,255,255,0.22)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "900", fontSize: 14 }}>✓</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <View className="px-6 py-4">
        <TouchableOpacity
          onPress={onContinue}
          disabled={!selected}
          accessibilityRole="button"
          accessibilityLabel="Continue"
          style={{ backgroundColor: selected ? "#008a3e" : "#dfe7e2" }}
          className="w-full flex-row items-center justify-center rounded-2xl py-4 gap-2 active:opacity-80"
        >
          <Text style={{ fontSize: 17, fontWeight: "900", color: selected ? "#fff" : "#8B9590" }}>
            Continue →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Avatar colours ──────────────────────────────────────────────────────────
const AVATARS = [
  { hue: 148, label: "Maxi" },
  { hue: 25, label: "Pixel" },
  { hue: 240, label: "Nova" },
  { hue: 75, label: "Sunny" },
  { hue: 200, label: "Sky" },
  { hue: 320, label: "Berry" },
] as const;

function hueToGreen(hue: number) {
  // Map hue offsets relative to green (148°) to hex approximations
  const map: Record<number, string> = {
    148: "#008a3e",
    25: "#ea3c3f",
    240: "#2098db",
    75: "#e9ac00",
    200: "#0ea5c9",
    320: "#c026d3",
  };
  return map[hue] ?? "#008a3e";
}

function AvatarBall({ hue, size = 40 }: { hue: number; size?: number }) {
  const color = hueToGreen(hue);
  const eyeY = size * 0.38;
  const eyeSize = size * 0.14;
  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      <View
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: color,
          borderRadius: size * 0.38,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: size * 0.2,
          left: size * 0.18,
          width: size * 0.28,
          height: size * 0.22,
          backgroundColor: "rgba(255,255,255,0.35)",
          borderRadius: 99,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: eyeY,
          left: size * 0.18,
          width: eyeSize,
          height: eyeSize,
          backgroundColor: "#0a140f",
          borderRadius: 99,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: eyeY,
          right: size * 0.18,
          width: eyeSize,
          height: eyeSize,
          backgroundColor: "#0a140f",
          borderRadius: 99,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: size * 0.22,
          left: size * 0.32,
          width: size * 0.36,
          height: size * 0.18,
          borderBottomWidth: size * 0.05,
          borderBottomColor: "#0a140f",
          borderBottomLeftRadius: 99,
          borderBottomRightRadius: 99,
        }}
      />
    </View>
  );
}

function AvatarSlide({
  selectedHue,
  onSelect,
  onBack,
  onFinish,
}: {
  selectedHue: number;
  onSelect: (hue: number) => void;
  onBack: () => void;
  onFinish: () => void;
}) {
  const color = hueToGreen(selectedHue);
  return (
    <View style={{ width: SCREEN_WIDTH, flex: 1 }} className="bg-background">
      {/* top nav */}
      <View className="flex-row items-center justify-between px-6 pt-2 pb-4">
        <TouchableOpacity
          onPress={onBack}
          accessibilityRole="button"
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: "#ffffff",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <PageDots active={2} />
        <View style={{ width: 40 }} />
      </View>

      <View className="px-6 pb-4">
        <Text
          style={{ fontSize: 28, fontWeight: "900", letterSpacing: -0.6, lineHeight: 32 }}
          className="text-foreground"
        >
          Pick your buddy
        </Text>
        <Text className="mt-1.5 text-sm text-muted-foreground">
          They'll cheer you on every day.
        </Text>
      </View>

      {/* Big preview */}
      <View className="items-center py-6">
        <View style={{ position: "relative" }}>
          <View
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 180,
              height: 180,
              borderRadius: 90,
              backgroundColor: "#d7f9de",
              transform: [{ translateX: -90 }, { translateY: -90 }],
            }}
          />
          <AvatarBall hue={selectedHue} size={140} />
          <Text style={{ position: "absolute", top: -8, right: -14, fontSize: 18 }}>✨</Text>
          <Text style={{ position: "absolute", bottom: 0, left: -18, fontSize: 13 }}>✨</Text>
        </View>
      </View>

      <View className="px-6">
        <Text className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Choose a colour
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {AVATARS.map((a) => (
            <Pressable
              key={a.hue}
              onPress={() => onSelect(a.hue)}
              accessibilityRole="button"
              accessibilityLabel={a.label}
              style={{
                borderRadius: 14,
                padding: 4,
                backgroundColor: a.hue === selectedHue ? "#ffffff" : "transparent",
                borderWidth: 2,
                borderColor: a.hue === selectedHue ? "#008a3e" : "transparent",
              }}
            >
              <AvatarBall hue={a.hue} size={44} />
            </Pressable>
          ))}
        </View>
      </View>

      <View className="px-6 py-6 mt-auto">
        <TouchableOpacity
          onPress={onFinish}
          accessibilityRole="button"
          accessibilityLabel="Let's go!"
          style={{ backgroundColor: color }}
          className="w-full flex-row items-center justify-center rounded-2xl py-4 gap-2 active:opacity-80"
        >
          <Text style={{ color: "#fff", fontSize: 17, fontWeight: "900" }}>Let's go! 🎉</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Page dots ───────────────────────────────────────────────────────────────
function PageDots({ active }: { active: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            width: i === active ? 22 : 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: i === active ? "#008a3e" : "#dfe7e2",
          }}
        />
      ))}
    </View>
  );
}

// ─── Root screen ─────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const router = useRouter();
  const listRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedGrade, setSelectedGrade] = useState<string | null>("7-9");
  const [selectedHue, setSelectedHue] = useState(148);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) setActiveIndex(viewableItems[0].index);
  }).current;

  const scrollTo = (index: number) => {
    listRef.current?.scrollToIndex({ index, animated: true });
  };

  const finish = async () => {
    await markOnboardingDone();
    router.replace("/");
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Dots row shown only on slide 0 */}
      {activeIndex === 0 && (
        <View className="items-center pt-3 pb-1">
          <PageDots active={0} />
        </View>
      )}

      <FlatList
        ref={listRef}
        data={[0, 1, 2]}
        keyExtractor={(i) => String(i)}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        style={{ flex: 1 }}
        renderItem={({ item }) => {
          if (item === 0) {
            return <WelcomeSlide onGetStarted={() => scrollTo(1)} />;
          }
          if (item === 1) {
            return (
              <GradeSlide
                selected={selectedGrade}
                onSelect={setSelectedGrade}
                onBack={() => scrollTo(0)}
                onContinue={() => scrollTo(2)}
              />
            );
          }
          return (
            <AvatarSlide
              selectedHue={selectedHue}
              onSelect={setSelectedHue}
              onBack={() => scrollTo(1)}
              onFinish={finish}
            />
          );
        }}
      />
    </SafeAreaView>
  );
}
