import { Card } from "@gomaths/ui";
import { useState } from "react";
import { Dimensions, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Line, Polyline, Text as SvgText } from "react-native-svg";

/**
 * Function grapher — plots a small set of preset functions on a coordinate
 * grid with react-native-svg. Presets (not free-form parsing) keep it
 * dependency-light and safe; the maths is plain JS.
 */

interface Preset {
  id: string;
  label: string;
  f: (x: number) => number | null;
}

const PRESETS: Preset[] = [
  { id: "linear", label: "y = x", f: (x) => x },
  { id: "line2", label: "y = 2x + 1", f: (x) => 2 * x + 1 },
  { id: "quad", label: "y = x²", f: (x) => x * x },
  { id: "quad2", label: "y = x² − 4", f: (x) => x * x - 4 },
  { id: "cubic", label: "y = x³", f: (x) => x * x * x },
  { id: "recip", label: "y = 1/x", f: (x) => (x === 0 ? null : 1 / x) },
];

const MIN = -5;
const MAX = 5;

/**
 * Sample `f` across [MIN,MAX] and split into continuous in-range segments
 * (breaking at asymptotes / out-of-range jumps). Pure — returns maths
 * coordinates; the caller maps them to pixels.
 */
export function toSegments(
  f: (x: number) => number | null,
  step = 0.1,
): Array<Array<[number, number]>> {
  const segments: Array<Array<[number, number]>> = [];
  let current: Array<[number, number]> = [];
  for (let x = MIN; x <= MAX + 1e-9; x += step) {
    const y = f(Number(x.toFixed(4)));
    if (y === null || !Number.isFinite(y) || y < MIN || y > MAX) {
      if (current.length > 1) segments.push(current);
      current = [];
      continue;
    }
    current.push([x, y]);
  }
  if (current.length > 1) segments.push(current);
  return segments;
}

export default function GraphingScreen() {
  const [active, setActive] = useState<Preset>(PRESETS[0]);

  const size = Math.min(Dimensions.get("window").width - 36, 340);
  const mapX = (x: number) => ((x - MIN) / (MAX - MIN)) * size;
  const mapY = (y: number) => size - ((y - MIN) / (MAX - MIN)) * size;
  const ticks = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5];

  const segments = toSegments(active.f);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <Text className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          Tools
        </Text>
        <Text className="mt-1 font-display text-2xl font-extrabold tracking-tight text-foreground">
          Function grapher
        </Text>

        <Card className="mt-4 items-center">
          <Svg width={size} height={size}>
            {/* grid */}
            {ticks.map((t) => (
              <Line
                key={`gx${t}`}
                x1={mapX(t)}
                y1={0}
                x2={mapX(t)}
                y2={size}
                stroke="#edf3f0"
                strokeWidth={1}
              />
            ))}
            {ticks.map((t) => (
              <Line
                key={`gy${t}`}
                x1={0}
                y1={mapY(t)}
                x2={size}
                y2={mapY(t)}
                stroke="#edf3f0"
                strokeWidth={1}
              />
            ))}
            {/* axes */}
            <Line x1={mapX(0)} y1={0} x2={mapX(0)} y2={size} stroke="#8B9590" strokeWidth={1.5} />
            <Line x1={0} y1={mapY(0)} x2={size} y2={mapY(0)} stroke="#8B9590" strokeWidth={1.5} />
            <SvgText x={size - 10} y={mapY(0) - 6} fontSize={10} fill="#8B9590">
              x
            </SvgText>
            <SvgText x={mapX(0) + 6} y={12} fontSize={10} fill="#8B9590">
              y
            </SvgText>
            {/* curve */}
            {segments.map((seg, i) => (
              <Polyline
                key={i}
                points={seg.map(([x, y]) => `${mapX(x)},${mapY(y)}`).join(" ")}
                fill="none"
                stroke="#008a3e"
                strokeWidth={2.5}
              />
            ))}
          </Svg>
        </Card>

        <Text className="mt-5 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          Choose a function
        </Text>
        <View className="mt-2 flex-row flex-wrap" style={{ gap: 8 }}>
          {PRESETS.map((p) => {
            const isActive = p.id === active.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => setActive(p)}
                accessibilityRole="button"
                accessibilityLabel={p.label}
                accessibilityState={{ selected: isActive }}
                style={{
                  borderRadius: 999,
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  backgroundColor: isActive ? "#008a3e" : "#edf3f0",
                }}
              >
                <Text
                  style={{
                    fontWeight: "800",
                    fontSize: 14,
                    color: isActive ? "#ffffff" : "#5a675f",
                  }}
                >
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text className="mt-5 text-sm text-muted-foreground">
          Tap a function to see its shape. The green curve is plotted across x from {MIN} to {MAX}.
          Notice how a straight line, a parabola and a cubic differ — and how y = 1/x never touches
          the axes.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
