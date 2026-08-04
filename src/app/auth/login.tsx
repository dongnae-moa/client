import { useRouter, type Href } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ApiError } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { AuthField, AuthScaffold, FormError, PrimaryFormButton } from "../../components/AuthScaffold";
import { useTheme } from "../../theme/ThemeContext";

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "서버에 연결하지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold eyebrow="돌아오신 걸 환영해요" title="로그인하고 혜택 받기" description="미션을 이어서 해결하고 모은 포인트로 동네 혜택을 사용해요." footer={<Pressable onPress={() => router.push("/auth/signup" as Href)}><Text style={[styles.footer, { color: colors.muted }]}>아직 계정이 없나요? <Text style={{ color: colors.green, fontFamily: "WantedSansB" }}>회원가입</Text></Text></Pressable>}>
      <AuthField label="이메일" value={email} onChangeText={setEmail} placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <AuthField label="비밀번호" value={password} onChangeText={setPassword} placeholder="비밀번호를 입력해주세요" secureTextEntry autoComplete="current-password" />
      <View style={styles.forgotRow}><Text style={[styles.forgot, { color: colors.muted }]}>비밀번호를 잊으셨나요?</Text></View>
      <FormError>{error}</FormError>
      <PrimaryFormButton label="로그인" loading={loading} onPress={() => { void submit(); }} />
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  forgotRow: { alignItems: "flex-end", marginTop: -4 },
  forgot: { fontFamily: "WantedSansR", fontSize: 11 },
  footer: { fontFamily: "WantedSansR", fontSize: 12 },
});
