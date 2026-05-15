import { Pressable, Text, View } from "react-native";

const GRADES = [
  { value: "R", label: "Grade R", sub: "Ages 5–6" },
  { value: 1, label: "Grade 1", sub: "Foundation" },
  { value: 2, label: "Grade 2", sub: "Foundation" },
  { value: 3, label: "Grade 3", sub: "Foundation" },
  { value: 4, label: "Grade 4", sub: "Intermediate" },
  { value: 5, label: "Grade 5", sub: "Intermediate" },
  { value: 6, label: "Grade 6", sub: "Intermediate" },
  { value: 7, label: "Grade 7", sub: "Senior" },
  { value: 8, label: "Grade 8", sub: "Senior" },
  { value: 9, label: "Grade 9", sub: "Senior · pilot grade" },
  { value: 10, label: "Grade 10", sub: "FET" },
  { value: 11, label: "Grade 11", sub: "FET" },
  { value: 12, label: "Grade 12", sub: "Matric" },
] as const;

export type GradeValue = (typeof GRADES)[number]["value"];

interface Props {
  value: GradeValue | null;
  onChange: (g: GradeValue) => void;
}

export function GradePicker({ value, onChange }: Props) {
  return (
    <View className="gap-2">
      {GRADES.map((g) => {
        const selected = value === g.value;
        return (
          <Pressable
            key={String(g.value)}
            onPress={() => onChange(g.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            className={`flex-row items-center justify-between rounded-2xl border px-4 py-3 active:opacity-80 ${
              selected ? "border-primary bg-primary-soft" : "border-border bg-card"
            }`}
          >
            <View>
              <Text className={`font-display text-base font-bold ${selected ? "text-primary" : "text-foreground"}`}>
                {g.label}
              </Text>
              <Text className="text-xs text-muted-foreground">{g.sub}</Text>
            </View>
            <View
              className={`h-5 w-5 rounded-full border-2 ${
                selected ? "border-primary bg-primary" : "border-border"
              }`}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
