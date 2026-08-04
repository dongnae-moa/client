import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../components/AppHeader";
import { ScreenSurface, SurfaceCard } from "../components/ScreenSurface";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import { StyleSheet, Text, View } from "react-native";

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  return <ScreenSurface>
    <AppHeader title="프로필 상세" back />
    <View style={styles.hero}>
      <View style={[styles.avatar, { backgroundColor: colors.greenSoft, borderColor: user?.profileDecorationKey ? colors.green : "transparent" }]}><Ionicons name={user?.profileDecorationKey === "community-hero" ? "medal" : "person"} size={34} color={colors.green} /></View>
      <Text style={[styles.nickname, { color: colors.text }]}>{user?.nickname ?? "동네 주민"}</Text>
      <Text style={[styles.neighborhood, { color: colors.muted }]}>{user?.neighborhoodName ?? "동네 설정 중"} 주민</Text>
    </View>

    <SurfaceCard style={styles.levelCard}>
      <View style={styles.levelHeader}><View><Text style={[styles.eyebrow, { color: colors.purple }]}>PERSONAL XP · 개인 성장</Text><Text style={[styles.levelTitle, { color: colors.text }]}>레벨 12 · Gold</Text></View><Text style={[styles.levelValue, { color: colors.purple }]}>240/300 XP</Text></View>
      <View style={[styles.track, { backgroundColor: colors.border }]}><View style={[styles.fill, { backgroundColor: colors.purple, width: "80%" }]} /></View>
      <Text style={[styles.levelHint, { color: colors.muted }]}>다음 개인 레벨까지 60 XP 남았어요.</Text>
    </SurfaceCard>

    <SurfaceCard style={styles.communityCard}>
      <View style={[styles.iconWrap, { backgroundColor: colors.greenSoft }]}><Ionicons name="people" size={22} color={colors.green} /></View><View style={styles.communityCopy}><Text style={[styles.eyebrow, { color: colors.greenInk }]}>COMMUNITY XP · 동네 성장</Text><Text style={[styles.communityTitle, { color: colors.text }]}>서초2동 레벨 7에 73 XP 기여</Text></View>
    </SurfaceCard>

    <Text style={[styles.sectionTitle, { color: colors.text }]}>계정 정보</Text>
    <SurfaceCard>{[
      ["mail-outline", "이메일", user?.email ?? "연결된 이메일 없음"],
      ["location-outline", "활동 동네", user?.neighborhoodName ?? "설정 중"],
      ["star-outline", "보유 포인트", `${(user?.point ?? 0).toLocaleString()} P`],
      ["calendar-outline", "가입 후 참여", "12일"],
    ].map(([icon, label, value], index) => <View key={label} style={[styles.infoRow, index < 3 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}><Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={colors.green} /><View style={styles.infoCopy}><Text style={[styles.infoLabel, { color: colors.muted }]}>{label}</Text><Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text></View></View>)}</SurfaceCard>
  </ScreenSurface>;
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", marginBottom: 22 },
  avatar: { alignItems: "center", borderRadius: 999, borderWidth: 3, height: 88, justifyContent: "center", width: 88 },
  nickname: { fontFamily: "WantedSansB", fontSize: 22, marginTop: 12 },
  neighborhood: { fontFamily: "WantedSansR", fontSize: 11, marginTop: 5 },
  levelCard: { marginBottom: 11 },
  levelHeader: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between" },
  eyebrow: { fontFamily: "WantedSansB", fontSize: 9, letterSpacing: 0.5 },
  levelTitle: { fontFamily: "WantedSansB", fontSize: 17, marginTop: 4 },
  levelValue: { fontFamily: "WantedSansB", fontSize: 12 },
  track: { borderRadius: 999, height: 8, marginTop: 15, overflow: "hidden" },
  fill: { borderRadius: 999, height: "100%" },
  levelHint: { fontFamily: "WantedSansR", fontSize: 9, marginTop: 8 },
  communityCard: { alignItems: "center", flexDirection: "row" },
  iconWrap: { alignItems: "center", borderRadius: 999, height: 48, justifyContent: "center", width: 48 },
  communityCopy: { flex: 1, marginLeft: 11 },
  communityTitle: { fontFamily: "WantedSansB", fontSize: 13, marginTop: 4 },
  sectionTitle: { fontFamily: "WantedSansB", fontSize: 18, marginBottom: 10, marginTop: 24 },
  infoRow: { alignItems: "center", flexDirection: "row", minHeight: 62 },
  infoCopy: { flex: 1, marginLeft: 10 },
  infoLabel: { fontFamily: "WantedSansR", fontSize: 9 },
  infoValue: { fontFamily: "WantedSansB", fontSize: 12, marginTop: 4 },
});
