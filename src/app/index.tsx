import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import FloatingBottomNav from "../components/FloatingTabBar";

const colors = {
  background: "#050505",
  surface: "#141414",
  border: "#2b2b2b",
  text: "#f5f5f5",
  muted: "#a4a4a4",
  green: "#a7e66d",
  greenSoft: "#c8f1a7",
  purple: "#b285ff",
  blue: "#72a7ff",
  orange: "#ffb93f",
};

const neighborhoodMetrics = [
  { icon: "checkmark-circle-outline" as const, label: "해결된 문제", value: "24건", color: colors.green },
  { icon: "people-outline" as const, label: "참여 주민", value: "83명", color: colors.purple },
  { icon: "time-outline" as const, label: "누적 참여시간", value: "6시간 40분", color: colors.blue },
  { icon: "notifications-outline" as const, label: "아직 남은 문제", value: "12건", color: colors.orange },
];

export default function Index() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>동네모아</Text>
          <Pressable
            accessibilityLabel="메뉴 열기"
            hitSlop={12}
            onPress={() => Alert.alert("동네모아 메뉴", "알림과 동네 설정을 준비하고 있어요.")}
            style={styles.menuButton}
          >
            <Ionicons name="menu-outline" size={30} color={colors.text} />
          </Pressable>
        </View>

        <Text style={styles.greeting}>지금 할 수 있는 미션을 살펴보세요</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="추천 미션: GCOO 세우기, 50 포인트"
          onPress={() => router.push("/mission")}
          style={({ pressed }) => [styles.recommendedCard, pressed && styles.pressed]}
        >
          <View style={styles.cardEyebrowRow}>
            <Text style={styles.cardEyebrow}>근처 미션 · 100m</Text>
            <View style={styles.pointsPill}>
              <Ionicons name="star" size={17} color="#8a6300" />
              <Text style={styles.pointsText}>50 pts</Text>
            </View>
          </View>
          <Text style={styles.recommendedTitle}>GCOO 세우기</Text>
          <View style={styles.cardMetaRow}>
            <Ionicons name="person-circle" size={26} color="#050505" />
            <Text style={styles.recommendedUser}>temp_username</Text>
          </View>
          <View style={styles.recommendedFooter}>
            <Text style={styles.recommendedMeta}>약 3분 · 인증 사진 필요</Text>
            <Ionicons name="arrow-forward-circle" size={30} color="#050505" />
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="내 활동과 동네 랭크 보기"
          onPress={() => router.push("/my")}
          style={({ pressed }) => [styles.rankCard, pressed && styles.pressed]}
        >
          <View style={styles.rankHeader}>
            <Text style={styles.rankSideLabel}>Silver</Text>
            <Text style={styles.rankCenterLabel}>현재 랭크: <Text style={styles.rankCenterValue}>Gold</Text></Text>
            <Text style={styles.rankSideLabel}>Platinum</Text>
          </View>
          <View style={styles.rankTrack}>
            <View style={styles.rankProgress} />
            <View style={[styles.rankMarker, styles.markerStart]}>
              <Ionicons name="medal-outline" size={24} color="#cbd5e1" />
            </View>
            <View style={[styles.rankMarker, styles.markerCurrent]}>
              <Ionicons name="trophy" size={23} color="#ffd36a" />
            </View>
            <View style={[styles.rankMarker, styles.markerEnd]}>
              <Ionicons name="ribbon" size={24} color="#ffca38" />
            </View>
          </View>
          <View style={styles.rankSummary}>
            <Text style={styles.rankTitle}>서초구 이번 주 미션 100/100 완료</Text>
            <Text style={styles.rankDescription}>
              목표 달성으로 동네 공동체 XP가 쌓이고 있어요.
            </Text>
          </View>
        </Pressable>

        <Text style={styles.sectionTitle}>우리 동네 현황</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="우리 동네 현황을 지도에서 보기"
          onPress={() => router.push("/map")}
          style={({ pressed }) => [styles.surfaceCard, pressed && styles.pressed]}
        >
          <View style={styles.sectionCardHeader}>
            <View style={styles.sectionHeadingRow}>
              <Ionicons name="business-outline" size={24} color={colors.green} />
              <Text style={styles.surfaceTitle}>우리 동네 현황</Text>
            </View>
            <Text style={styles.period}>이번 주 (7.28 - 8.3)</Text>
          </View>
          <View style={styles.metricGrid}>
            {neighborhoodMetrics.map((metric, index) => (
              <View
                key={metric.label}
                style={[styles.metric, index === neighborhoodMetrics.length - 1 && styles.metricLast]}
              >
                <Ionicons name={metric.icon} size={28} color={metric.color} />
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={styles.metricValue}>{metric.value}</Text>
              </View>
            ))}
          </View>
          <View style={styles.cardLinkRow}>
            <Text style={styles.cardLink}>동네 현황 더 보기</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.green} />
          </View>
        </Pressable>

        <Text style={styles.sectionTitle}>오늘의 3분 미션</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="공원 안내판 상태 확인하기 미션 시작"
          onPress={() => router.push("/mission")}
          style={({ pressed }) => [styles.surfaceCard, styles.dailyCard, pressed && styles.pressed]}
        >
          <Image
            contentFit="cover"
            source={require("@/assets/images/omg.png")}
            style={styles.dailyImage}
          />
          <View style={styles.dailyCopy}>
            <Text style={styles.dailyTitle}>공원 안내판 상태 확인하기</Text>
            <Text style={styles.dailyMeta}>180m · 약 2분</Text>
            <View style={styles.rewardRow}>
              <Ionicons name="star" size={16} color={colors.orange} />
              <Text style={styles.rewardText}>5 pts</Text>
            </View>
          </View>
          <View style={styles.startButton}>
            <Text style={styles.startButtonText}>시작하기</Text>
          </View>
        </Pressable>

        <View style={styles.bottomHint}>
          <Text style={styles.bottomHintText}>작은 참여가 더 좋은 동네를 만들어요.</Text>
        </View>
      </ScrollView>
      <FloatingBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 128 },
  header: { alignItems: "center", justifyContent: "center", minHeight: 36 },
  logo: { color: colors.text, fontFamily: "WantedSansB", fontSize: 21, letterSpacing: -0.8 },
  menuButton: { position: "absolute", right: 0, top: 3, padding: 3 },
  greeting: { color: colors.text, fontFamily: "WantedSansB", fontSize: 18, lineHeight: 24, marginTop: 12, marginBottom: 10, textAlign: "center" },
  recommendedCard: { backgroundColor: colors.greenSoft, borderRadius: 17, padding: 15, minHeight: 150 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  cardEyebrowRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardEyebrow: { color: "#2c461c", fontFamily: "WantedSansB", fontSize: 14 },
  pointsPill: { flexDirection: "row", alignItems: "center", gap: 5 },
  pointsText: { color: "#24310e", fontFamily: "WantedSansB", fontSize: 15 },
  recommendedTitle: { color: "#050505", fontFamily: "WantedSansB", fontSize: 24, letterSpacing: -1, marginTop: 10 },
  cardMetaRow: { alignItems: "center", flexDirection: "row", gap: 7, marginTop: 9 },
  recommendedUser: { color: "#14210f", fontFamily: "WantedSansB", fontSize: 14 },
  recommendedFooter: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 7 },
  recommendedMeta: { color: "#4a603c", fontFamily: "WantedSansR", fontSize: 12 },
  rankCard: { marginTop: 8, paddingHorizontal: 7, paddingTop: 1 },
  rankHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  rankSideLabel: { color: colors.text, fontFamily: "WantedSansB", fontSize: 13 },
  rankCenterLabel: { color: colors.text, fontFamily: "WantedSansR", fontSize: 13 },
  rankCenterValue: { fontFamily: "WantedSansB" },
  rankTrack: { height: 36, justifyContent: "center", position: "relative" },
  rankProgress: { backgroundColor: colors.green, height: 5, left: 12, position: "absolute", right: 12, top: 16 },
  rankMarker: { alignItems: "center", backgroundColor: colors.background, borderRadius: 16, justifyContent: "center", position: "absolute", top: 1, width: 30, height: 30 },
  markerStart: { left: 0 },
  markerCurrent: { left: "49%", marginLeft: -18 },
  markerEnd: { right: 0 },
  rankSummary: { alignItems: "center", marginTop: 1 },
  rankTitle: { color: colors.text, fontFamily: "WantedSansB", fontSize: 15, textAlign: "center" },
  rankDescription: { color: colors.muted, fontFamily: "WantedSansR", fontSize: 11, marginTop: 2, textAlign: "center" },
  sectionTitle: { color: colors.text, fontFamily: "WantedSansB", fontSize: 17, marginBottom: 7, marginTop: 13 },
  surfaceCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, padding: 12 },
  sectionCardHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  sectionHeadingRow: { alignItems: "center", flexDirection: "row", gap: 8 },
  surfaceTitle: { color: colors.text, fontFamily: "WantedSansB", fontSize: 15 },
  period: { color: "#76b4d9", fontFamily: "WantedSansR", fontSize: 10 },
  metricGrid: { borderBottomColor: colors.border, borderBottomWidth: 1, borderTopColor: colors.border, borderTopWidth: 1, flexDirection: "row", marginTop: 8, paddingVertical: 7 },
  metric: { alignItems: "center", borderRightColor: colors.border, borderRightWidth: 1, flex: 1, minHeight: 65, paddingHorizontal: 2 },
  metricLast: { borderRightWidth: 0 },
  metricLabel: { color: colors.muted, fontFamily: "WantedSansR", fontSize: 9, marginTop: 5, textAlign: "center" },
  metricValue: { color: colors.text, fontFamily: "WantedSansB", fontSize: 14, marginTop: 3, textAlign: "center" },
  cardLinkRow: { alignItems: "center", flexDirection: "row", justifyContent: "flex-end", marginTop: 8 },
  cardLink: { color: colors.green, fontFamily: "WantedSansB", fontSize: 13 },
  dailyCard: { alignItems: "center", flexDirection: "row", minHeight: 86 },
  dailyImage: { backgroundColor: "#d6ecbb", borderRadius: 50, height: 56, width: 56 },
  dailyCopy: { flex: 1, marginLeft: 12 },
  dailyTitle: { color: colors.text, fontFamily: "WantedSansB", fontSize: 12, lineHeight: 17 },
  dailyMeta: { color: colors.green, fontFamily: "WantedSansR", fontSize: 12, marginTop: 2 },
  rewardRow: { alignItems: "center", flexDirection: "row", gap: 4, marginTop: 3 },
  rewardText: { color: colors.orange, fontFamily: "WantedSansB", fontSize: 11 },
  startButton: { alignItems: "center", backgroundColor: colors.green, borderRadius: 16, justifyContent: "center", minWidth: 74, paddingHorizontal: 9, paddingVertical: 7 },
  startButtonText: { color: "#14220c", fontFamily: "WantedSansB", fontSize: 12 },
  bottomHint: { alignItems: "center", paddingTop: 24 },
  bottomHintText: { color: "#5f5f5f", fontFamily: "WantedSansR", fontSize: 12 },
});
