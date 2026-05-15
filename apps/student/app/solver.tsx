import { Button, Card } from "@gomaths/ui";
import * as ImagePicker from "expo-image-picker";
import { Stack } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Math as MathView } from "../components/Math";
import { useAuth } from "../lib/auth";
import { prepareImageForOcr } from "../lib/image-prep";
import { scanImage, solveLatex, type SolverResponse } from "../lib/solver";

type Mode = "scan" | "type";

export default function SolverScreen() {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("scan");
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [typedLatex, setTypedLatex] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SolverResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background px-8">
        <Text className="text-center text-base text-muted-foreground">
          Sign in to use the solver.
        </Text>
      </SafeAreaView>
    );
  }

  const pickFromLibrary = async () => {
    setError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError("Photo library permission denied.");
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: false,
    });
    if (r.canceled || r.assets.length === 0) return;
    await submitImage(r.assets[0]);
  };

  const captureFromCamera = async () => {
    setError(null);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError("Camera permission denied.");
      return;
    }
    const r = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (r.canceled || r.assets.length === 0) return;
    await submitImage(r.assets[0]);
  };

  const submitImage = async (asset: ImagePicker.ImagePickerAsset) => {
    setPreviewUri(asset.uri);
    setBusy(true);
    setResult(null);
    try {
      // Auto-rotate from EXIF, resize to a sane upload size, re-encode as
      // JPEG. Strips metadata (no GPS coords sent to OCR).
      const prepared = await prepareImageForOcr({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      });
      // Show the preprocessed image (correctly rotated) in the preview too.
      setPreviewUri(prepared.uri);
      const r = await scanImage({
        uri: prepared.uri,
        mimeType: prepared.mimeType,
        fileName: prepared.fileName,
      });
      setResult(r);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const submitTyped = async () => {
    if (!typedLatex.trim()) return;
    setBusy(true);
    setResult(null);
    setError(null);
    try {
      const r = await solveLatex(typedLatex);
      setResult(r);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ title: "Solver" }} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 32 }}>
        <View className="flex-row gap-2">
          <ModeChip label="Scan" active={mode === "scan"} onPress={() => setMode("scan")} />
          <ModeChip label="Type" active={mode === "type"} onPress={() => setMode("type")} />
        </View>

        {mode === "scan" ? (
          <>
            <Card>
              <Text className="font-display text-lg font-semibold text-foreground">
                Capture or pick an equation
              </Text>
              <Text className="mt-1 text-sm text-muted-foreground">
                Works best with clearly printed equations. The mock OCR returns a canned
                expression — wire MathPix to enable real recognition.
              </Text>
              <View className="mt-4 gap-2">
                <Button label="Use camera" variant="primary" size="md" fullWidth onPress={captureFromCamera} />
                <Button label="Pick from library" variant="ghost" size="md" fullWidth onPress={pickFromLibrary} />
              </View>
            </Card>

            {previewUri && (
              <View className="overflow-hidden rounded-2xl border border-border">
                <Image source={{ uri: previewUri }} style={{ width: "100%", height: 220 }} resizeMode="contain" />
              </View>
            )}
          </>
        ) : (
          <Card>
            <Text className="font-display text-lg font-semibold text-foreground">Type an equation</Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              Use plain notation: <Text className="font-mono">2x + 5 = 13</Text>,{" "}
              <Text className="font-mono">x^2 + 5x + 6 = 0</Text>.
            </Text>
            <TextInput
              value={typedLatex}
              onChangeText={setTypedLatex}
              placeholder="2x + 5 = 13"
              autoCapitalize="none"
              autoCorrect={false}
              className="mt-3 rounded-2xl border border-border bg-card px-4 py-3 font-mono text-base text-foreground"
            />
            <View className="mt-3">
              <Button
                label={busy ? "Solving…" : "Solve"}
                variant="primary"
                size="md"
                fullWidth
                disabled={busy || !typedLatex.trim()}
                onPress={submitTyped}
              />
            </View>
          </Card>
        )}

        {busy && (
          <View className="items-center py-4">
            <ActivityIndicator />
            <Text className="mt-2 text-xs text-muted-foreground">Working…</Text>
          </View>
        )}

        {error && <Text className="text-sm text-destructive">{error}</Text>}

        {result && <SolutionView result={result} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function ModeChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full px-4 py-2 ${active ? "bg-primary" : "bg-muted"}`}
    >
      <Text className={`text-sm font-semibold ${active ? "text-primary-foreground" : "text-muted-foreground"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

function SolutionView({ result }: { result: SolverResponse }) {
  if (!result.accepted) {
    return (
      <Card className="border-destructive">
        <Text className="font-display text-base font-bold text-destructive">Couldn't solve</Text>
        <Text className="mt-1 text-sm text-muted-foreground">{result.detail || "Try a clearer image or rephrase the equation."}</Text>
      </Card>
    );
  }
  return (
    <View className="gap-3">
      {result.detectedLatex && (
        <Card>
          <Text className="text-xs uppercase tracking-wider text-muted-foreground">Detected</Text>
          <View className="mt-2">
            <MathView latex={result.detectedLatex} display fontSize={18} />
          </View>
          <Text className="mt-2 text-[10px] text-muted-foreground">
            OCR: {result.ocrProvider}
            {result.ocrConfidence != null ? ` · confidence ${Math.round(result.ocrConfidence * 100)}%` : ""}
          </Text>
        </Card>
      )}

      {result.steps.length > 0 && (
        <Card>
          <Text className="text-xs uppercase tracking-wider text-muted-foreground">Working</Text>
          <View className="mt-3 gap-3">
            {result.steps.map((s, i) => (
              <View key={i} className="rounded-xl bg-muted px-3 py-2">
                <Text className="text-xs text-muted-foreground">Step {i + 1}</Text>
                <Text className="mt-1 text-sm text-foreground">{s.explanation}</Text>
                <View className="mt-2">
                  <MathView latex={s.math} fontSize={16} />
                </View>
              </View>
            ))}
          </View>
        </Card>
      )}

      {result.finalAnswer && (
        <Card className="border-success">
          <Text className="text-xs uppercase tracking-wider text-success">Final answer</Text>
          <Text className="mt-1 font-mono text-lg font-bold text-foreground">{result.finalAnswer}</Text>
        </Card>
      )}
    </View>
  );
}
