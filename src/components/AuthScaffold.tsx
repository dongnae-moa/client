import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { type ReactNode, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../theme/ThemeContext";

export function AuthScaffold({ eyebrow, title, description, children, footer }: { eyebrow: string; title: string; description: string; children: ReactNode; footer?: ReactNode }) {
  const { colors, mode } = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Image source={mode === "dark" ? require("@/assets/images/logo-dark.png") : require("@/assets/images/로고임.png")} style={styles.logo} contentFit="contain" />
          <Text style={[styles.eyebrow, { color: colors.green }]}>{eyebrow}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.description, { color: colors.muted }]}>{description}</Text>
          <View style={styles.form}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function AuthField({ label, secureTextEntry, ...props }: TextInputProps & { label: string }) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const isSecure = Boolean(secureTextEntry);
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.text }]}>{label}</Text>
      <View style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextInput
          {...props}
          secureTextEntry={isSecure && !visible}
          placeholderTextColor={colors.faint}
          selectionColor={colors.green}
          style={[styles.input, { color: colors.text }]}
        />
        {isSecure ? (
          <Pressable accessibilityLabel={visible ? "비밀번호 숨기기" : "비밀번호 보기"} onPress={() => setVisible((current) => !current)} hitSlop={10}>
            <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={20} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function FormError({ children }: { children?: string | null }) {
  const { colors } = useTheme();
  if (!children) return null;
  return <Text accessibilityRole="alert" style={[styles.error, { color: colors.orange }]}>{children}</Text>;
}

export function PrimaryFormButton({ label, loading, onPress }: { label: string; loading?: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" disabled={loading} onPress={onPress} style={({ pressed }) => [styles.primary, { backgroundColor: colors.green }, pressed && styles.pressed, loading && styles.disabled]}>
      <Text style={styles.primaryText}>{loading ? "잠시만 기다려주세요" : label}</Text>
      {!loading ? <Ionicons name="arrow-forward" size={18} color="#17310b" /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingBottom: 36, paddingHorizontal: 24, paddingTop: 32 },
  logo: { alignSelf: "flex-start", height: 34, width: 128 },
  eyebrow: { fontFamily: "WantedSansB", fontSize: 12, marginTop: 38 },
  title: { fontFamily: "WantedSansB", fontSize: 30, letterSpacing: -1.2, lineHeight: 38, marginTop: 8 },
  description: { fontFamily: "WantedSansR", fontSize: 13, lineHeight: 20, marginTop: 10 },
  form: { gap: 15, marginTop: 32 },
  fieldWrap: { gap: 8 },
  fieldLabel: { fontFamily: "WantedSansB", fontSize: 12 },
  field: { alignItems: "center", borderRadius: 16, borderWidth: 1, flexDirection: "row", minHeight: 58, paddingHorizontal: 16 },
  input: { flex: 1, fontFamily: "WantedSansR", fontSize: 14, paddingVertical: 14 },
  error: { fontFamily: "WantedSansR", fontSize: 12, lineHeight: 18 },
  primary: { alignItems: "center", borderRadius: 16, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 56, marginTop: 3 },
  primaryText: { color: "#17310b", fontFamily: "WantedSansB", fontSize: 15 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.62 },
  footer: { alignItems: "center", marginTop: 24 },
});
