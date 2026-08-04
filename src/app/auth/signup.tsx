import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ApiError } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { AuthField, FormError } from "../../components/AuthScaffold";
import { useTheme } from "../../theme/ThemeContext";

const TOTAL_STEPS = 3;

export default function SignupScreen() {
  const router = useRouter();
  const { colors, mode } = useTheme();
  const { signUp } = useAuth();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const copy = useMemo(() => [
    { kicker: "계정 만들기", title: "사용할 이메일을\n입력해주세요", description: "미션 참여 기록과 받은 혜택을 안전하게 보관할 계정이에요." },
    { kicker: "프로필 이름", title: "동네에서 어떤 이름으로\n활동할까요?", description: "미션과 이웃 검토에서 보이는 이름이에요. 나중에 변경할 수 있어요." },
    { kicker: "비밀번호 만들기", title: "안전한 비밀번호를\n설정해주세요", description: "8~64자로 입력하고, 같은 비밀번호를 한 번 더 확인해주세요." },
  ][step], [step]);

  const validateStep = () => {
    if (step === 0) {
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "올바른 이메일 주소를 입력해주세요.";
    }
    if (step === 1) {
      const length = nickname.trim().length;
      if (length < 2 || length > 20) return "닉네임은 2~20자로 입력해주세요.";
    }
    if (step === 2) {
      if (password.length < 8 || password.length > 64) return "비밀번호는 8~64자로 입력해주세요.";
      if (password !== confirm) return "비밀번호가 서로 일치하지 않아요.";
    }
    return null;
  };

  const next = async () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    if (step < TOTAL_STEPS - 1) {
      setStep((current) => current + 1);
      return;
    }
    setLoading(true);
    try {
      await signUp(email, nickname, password);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "회원가입을 처리하지 못했어요.");
    } finally {
      setLoading(false);
    }
  };

  const back = () => {
    setError(null);
    if (step === 0) router.back();
    else setStep((current) => current - 1);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="이전" hitSlop={10} onPress={back} style={[styles.backButton, { backgroundColor: colors.surface }]}>
            <Ionicons name="arrow-back" size={21} color={colors.text} />
          </Pressable>
          <Image source={mode === "dark" ? require("@/assets/images/logo-dark.png") : require("@/assets/images/로고임.png")} style={styles.logo} contentFit="contain" />
          <Text style={[styles.stepCount, { color: colors.muted }]}>{step + 1}/{TOTAL_STEPS}</Text>
        </View>

        <View accessibilityLabel={`회원가입 ${step + 1}단계`} style={styles.progressTrack}>
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => <View key={index} style={[styles.progressSegment, { backgroundColor: index <= step ? colors.green : colors.border }]} />)}
        </View>

        <View style={styles.body}>
          <Text style={[styles.kicker, { color: colors.green }]}>{copy.kicker}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{copy.title}</Text>
          <Text style={[styles.description, { color: colors.muted }]}>{copy.description}</Text>

          <View style={styles.form}>
            {step === 0 ? <AuthField autoFocus label="이메일" value={email} onChangeText={setEmail} placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" returnKeyType="next" onSubmitEditing={() => { void next(); }} /> : null}
            {step === 1 ? <AuthField autoFocus label="닉네임" value={nickname} onChangeText={setNickname} placeholder="동네에서 사용할 이름" autoCapitalize="none" maxLength={20} returnKeyType="next" onSubmitEditing={() => { void next(); }} /> : null}
            {step === 2 ? <>
              <View style={[styles.accountSummary, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.summaryIcon, { backgroundColor: colors.greenSoft }]}><Ionicons name="person-outline" size={18} color={colors.green} /></View><View style={styles.summaryCopy}><Text style={[styles.summaryNickname, { color: colors.text }]}>{nickname}</Text><Text style={[styles.summaryEmail, { color: colors.muted }]}>{email}</Text></View><Ionicons name="checkmark-circle" size={19} color={colors.green} /></View>
              <AuthField autoFocus label="비밀번호" value={password} onChangeText={setPassword} placeholder="8~64자" secureTextEntry autoComplete="new-password" />
              <AuthField label="비밀번호 확인" value={confirm} onChangeText={setConfirm} placeholder="한 번 더 입력해주세요" secureTextEntry autoComplete="new-password" returnKeyType="done" onSubmitEditing={() => { void next(); }} />
            </> : null}
            <FormError>{error}</FormError>
          </View>
        </View>

        <View style={styles.bottom}>
          <Pressable accessibilityRole="button" disabled={loading} onPress={() => { void next(); }} style={({ pressed }) => [styles.primary, { backgroundColor: colors.green }, pressed && styles.pressed, loading && styles.disabled]}>
            <Text style={styles.primaryText}>{loading ? "계정을 만들고 있어요" : step === TOTAL_STEPS - 1 ? "계정 만들기" : "다음"}</Text>
            {!loading ? <Ionicons name="arrow-forward" size={19} color="#17310b" /> : null}
          </Pressable>
          <Pressable onPress={() => router.replace("/auth/login")}><Text style={[styles.loginLink, { color: colors.muted }]}>이미 계정이 있나요? <Text style={{ color: colors.green, fontFamily: "WantedSansB" }}>로그인</Text></Text></Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 22, paddingTop: 14 },
  backButton: { alignItems: "center", borderRadius: 999, height: 42, justifyContent: "center", width: 42 },
  logo: { height: 26, width: 98 },
  stepCount: { fontFamily: "WantedSansB", fontSize: 12, minWidth: 42, textAlign: "right" },
  progressTrack: { flexDirection: "row", gap: 7, marginHorizontal: 24, marginTop: 24 },
  progressSegment: { borderRadius: 99, flex: 1, height: 4 },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 44 },
  kicker: { fontFamily: "WantedSansB", fontSize: 12 },
  title: { fontFamily: "WantedSansB", fontSize: 30, letterSpacing: -1.2, lineHeight: 39, marginTop: 10 },
  description: { fontFamily: "WantedSansR", fontSize: 13, lineHeight: 20, marginTop: 12, maxWidth: 340 },
  form: { gap: 15, marginTop: 38 },
  accountSummary: { alignItems: "center", borderRadius: 17, borderWidth: 1, flexDirection: "row", padding: 13 },
  summaryIcon: { alignItems: "center", borderRadius: 999, height: 38, justifyContent: "center", width: 38 },
  summaryCopy: { flex: 1, marginLeft: 11 },
  summaryNickname: { fontFamily: "WantedSansB", fontSize: 12 },
  summaryEmail: { fontFamily: "WantedSansR", fontSize: 10, marginTop: 3 },
  bottom: { paddingBottom: 24, paddingHorizontal: 24 },
  primary: { alignItems: "center", borderRadius: 17, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 58 },
  primaryText: { color: "#17310b", fontFamily: "WantedSansB", fontSize: 15 },
  loginLink: { fontFamily: "WantedSansR", fontSize: 11, marginTop: 18, textAlign: "center" },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.62 },
});
