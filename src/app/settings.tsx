import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import AppHeader from "../components/AppHeader";
import { ScreenSurface, SurfaceCard } from "../components/ScreenSurface";
import { useTheme, type ThemeMode } from "../theme/ThemeContext";

export default function SettingsScreen() {
  const { mode, colors, setMode } = useTheme();
  const rows = [{ icon: "notifications-outline" as const, label: "미션 알림", value: "켜짐" }, { icon: "location-outline" as const, label: "위치 권한", value: "사용 중" }, { icon: "shield-checkmark-outline" as const, label: "개인정보 보호", value: "" }];
  return <ScreenSurface><AppHeader title="설정" back /><Text style={[styles.sectionTitle, { color: colors.text }]}>화면 테마</Text><SurfaceCard><View style={styles.themeHeader}><View><Text style={[styles.rowTitle, { color: colors.text }]}>앱 테마</Text><Text style={[styles.rowMeta, { color: colors.muted }]}>원하는 분위기로 동네모아를 사용해요.</Text></View><Switch value={mode === "dark"} onValueChange={(dark) => setMode(dark ? "dark" : "light")} trackColor={{ false: colors.border, true: colors.green }} thumbColor={mode === "dark" ? "#fff" : "#fff"} /></View><View style={styles.themeChoices}><ThemeChoice label="화이트" value="light" selected={mode === "light"} onPress={() => setMode("light")} /><ThemeChoice label="다크" value="dark" selected={mode === "dark"} onPress={() => setMode("dark")} /></View></SurfaceCard><Text style={[styles.sectionTitle, { color: colors.text }]}>환경 설정</Text><SurfaceCard>{rows.map((row) => <View key={row.label} style={[styles.row, { borderBottomColor: colors.border }]}><Ionicons name={row.icon} size={20} color={colors.green} /><View style={styles.rowCopy}><Text style={[styles.rowTitle, { color: colors.text }]}>{row.label}</Text>{row.value ? <Text style={[styles.rowMeta, { color: colors.muted }]}>{row.value}</Text> : null}</View><Ionicons name="chevron-forward" size={17} color={colors.muted} /></View>)}</SurfaceCard></ScreenSurface>;
}

function ThemeChoice({ label, value, selected, onPress }: { label: string; value: ThemeMode; selected: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }} style={[styles.choice, { backgroundColor: selected ? colors.greenSoft : colors.surfaceRaised, borderColor: selected ? colors.green : colors.border }]}><Ionicons name={value === "dark" ? "moon-outline" : "sunny-outline"} size={18} color={selected ? "#17310b" : colors.muted} /><Text style={[styles.choiceText, { color: selected ? "#17310b" : colors.text }]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({ sectionTitle: { fontFamily: "WantedSansB", fontSize: 18, marginBottom: 10, marginTop: 18 }, themeHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" }, rowTitle: { fontFamily: "WantedSansB", fontSize: 14 }, rowMeta: { fontFamily: "WantedSansR", fontSize: 10, marginTop: 4 }, themeChoices: { flexDirection: "row", gap: 9, marginTop: 18 }, choice: { alignItems: "center", borderRadius: 13, borderWidth: 1, flex: 1, flexDirection: "row", gap: 7, justifyContent: "center", paddingVertical: 11 }, choiceText: { fontFamily: "WantedSansB", fontSize: 12 }, row: { alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", minHeight: 58 }, rowCopy: { flex: 1, marginLeft: 12 } });
