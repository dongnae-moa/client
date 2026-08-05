import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Image } from "expo-image";
import { useRef, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { getForegroundLocationPermission } from "../services/locationPermission";
import { useTheme } from "../theme/ThemeContext";

export default function LocationSetupScreen() {
  const { colors, mode } = useTheme();
  const { joinNeighborhood } = useAuth();
  const [loading, setLoading] = useState(false);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const detectingRef = useRef(false);

  const detect = async () => {
    if (detectingRef.current) return;
    detectingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const permission = await getForegroundLocationPermission(true);
      if (permission.status !== "granted") {
        setDenied(true);
        return;
      }
      setDenied(false);
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await joinNeighborhood(position.coords.latitude, position.coords.longitude);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "현재 위치를 확인하지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      detectingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <View style={styles.header}><Image source={mode === "dark" ? require("@/assets/images/logo-dark.png") : require("@/assets/images/로고임.png")} style={styles.logo} contentFit="contain" /></View>
      <View style={styles.content}>
        <View style={[styles.locationVisual, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.pinHalo, { backgroundColor: colors.greenSoft }]}><Ionicons name="location" size={48} color={colors.green} /></View>
          <View style={[styles.locationPill, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}><Ionicons name="navigate-outline" size={16} color={colors.green} /><Text style={[styles.locationPillText, { color: colors.text }]}>가장 가까운 동네를 찾아요</Text></View>
        </View>
        <Text style={[styles.eyebrow, { color: colors.green }]}>마지막 한 단계</Text>
        <Text style={[styles.title, { color: colors.text }]}>우리 동네를 연결해요</Text>
        <Text style={[styles.description, { color: colors.muted }]}>현재 위치와 가장 가까운 동네를 찾아 미션과 지역 혜택을 정확하게 보여드려요. 위치는 동네 설정에만 사용해요.</Text>
        {denied ? <View style={[styles.notice, { backgroundColor: colors.surface, borderColor: colors.border }]}><Ionicons name="information-circle-outline" size={20} color={colors.orange} /><Text style={[styles.noticeText, { color: colors.muted }]}>위치 권한이 꺼져 있어요. 설정에서 권한을 허용한 뒤 다시 시도해주세요.</Text></View> : null}
        {error ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.orange }]}>{error}</Text> : null}
      </View>
      <View style={styles.actions}>
        {denied ? <Pressable onPress={() => { void Linking.openSettings(); }} style={[styles.secondaryButton, { borderColor: colors.border }]}><Text style={[styles.secondaryButtonText, { color: colors.text }]}>설정 열기</Text></Pressable> : null}
        <Pressable disabled={loading} onPress={() => { void detect(); }} style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.green }, pressed && styles.pressed, loading && styles.disabled]}><Text style={styles.primaryButtonText}>{loading ? "동네를 찾고 있어요" : denied ? "다시 확인하기" : "현재 위치로 동네 찾기"}</Text><Ionicons name="arrow-forward" size={18} color="#17310b" /></Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 20 },
  logo: { height: 30, width: 112 },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  locationVisual: { alignItems: "center", borderRadius: 30, borderWidth: 1, height: 230, justifyContent: "center", marginBottom: 34 },
  pinHalo: { alignItems: "center", borderRadius: 999, height: 120, justifyContent: "center", width: 120 },
  locationPill: { alignItems: "center", borderRadius: 999, borderWidth: 1, bottom: 24, flexDirection: "row", gap: 7, paddingHorizontal: 14, paddingVertical: 10, position: "absolute" },
  locationPillText: { fontFamily: "WantedSansB", fontSize: 11 },
  eyebrow: { fontFamily: "WantedSansB", fontSize: 12 },
  title: { fontFamily: "WantedSansB", fontSize: 29, letterSpacing: -1.1, marginTop: 9 },
  description: { fontFamily: "WantedSansR", fontSize: 14, lineHeight: 22, marginTop: 13 },
  notice: { alignItems: "flex-start", borderRadius: 15, borderWidth: 1, flexDirection: "row", gap: 9, marginTop: 18, padding: 13 },
  noticeText: { flex: 1, fontFamily: "WantedSansR", fontSize: 11, lineHeight: 17 },
  error: { fontFamily: "WantedSansR", fontSize: 11, lineHeight: 17, marginTop: 14 },
  actions: { gap: 10, paddingBottom: 22, paddingHorizontal: 24 },
  primaryButton: { alignItems: "center", borderRadius: 17, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 58 },
  primaryButtonText: { color: "#17310b", fontFamily: "WantedSansB", fontSize: 14 },
  secondaryButton: { alignItems: "center", borderRadius: 17, borderWidth: 1, justifyContent: "center", minHeight: 52 },
  secondaryButtonText: { fontFamily: "WantedSansB", fontSize: 13 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.62 },
});
