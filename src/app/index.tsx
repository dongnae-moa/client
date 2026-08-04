import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FloatingNavBar from "../components/FloatingNavBar";

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

// Notion > Geeks 2026 > 테스트 데이터에서 가져온 미션 더미데이터예요.
const missionCards = [
  { title: "인도를 막고 있는 공유자전거를 지정 구역으로 이동", shortTitle: "공유자전거 이동하기", type: "공공질서", distance: "20m", time: "3분", points: "20P" },
  { title: "점자블록 위 이동 가능한 방해물 정리", shortTitle: "점자블록 방해물 정리", type: "접근성", distance: "80m", time: "3분", points: "25P" },
  { title: "공원 운동기구 파손 여부 확인", shortTitle: "운동기구 상태 확인", type: "시설 확인", distance: "120m", time: "4분", points: "15P" },
  { title: "벤치 주변 가벼운 쓰레기 정리", shortTitle: "벤치 주변 정리", type: "환경", distance: "160m", time: "5분", points: "20P" },
];

function ProgressRing() {
  const radius = 39;
  const circumference = 2 * Math.PI * radius;
  const progress = 73;
  return (
    <View style={styles.progressRingWrap} accessibilityLabel="이번 주 Community XP 진행도 73점">
      <Svg width={104} height={104} viewBox="0 0 104 104">
        <Circle cx="52" cy="52" r={radius} stroke="#2b3a28" strokeWidth="10" fill="none" />
        <Circle
          cx="52"
          cy="52"
          r={radius}
          stroke={colors.green}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - progress / 100)}
          fill="none"
          transform="rotate(-90 52 52)"
        />
      </Svg>
      <View style={styles.progressRingText}>
        <Text style={styles.progressValue}>73</Text>
        <Text style={styles.progressTotal}>/100</Text>
      </View>
    </View>
  );
}

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [activeMission, setActiveMission] = useState(0);
  const missionCardWidth = Math.min(width - 40, 320);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image accessibilityLabel="동네모아 로고" contentFit="contain" source={require("@/assets/images/로고임.png")} style={styles.logo} />
        </View>

        <Text style={styles.sectionTitle}>추천 미션</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="추천 미션: 공유자전거를 지정 구역으로 이동, 20 포인트"
          onPress={() => router.push("/mission")}
          style={({ pressed }) => [styles.recommendedCard, pressed && styles.pressed]}
        >
          <View style={styles.cardEyebrowRow}>
            <Text style={styles.cardEyebrow}>근처 미션 · 20m</Text>
            <View style={styles.pointsPill}><Ionicons name="star" size={17} color="#8a6300" /><Text style={styles.pointsText}>20P</Text></View>
          </View>
          <Text style={styles.recommendedTitle}>공유자전거 이동하기</Text>
          <View style={styles.cardMetaRow}><Ionicons name="person-circle" size={26} color="#050505" /><Text style={styles.recommendedUser}>동네모아 추천 · 공공질서</Text></View>
          <View style={styles.recommendedFooter}><Text style={styles.recommendedMeta}>3분 · Before/After 사진</Text><Ionicons name="arrow-forward-circle" size={30} color="#050505" /></View>
        </Pressable>

        <Text style={[styles.sectionTitle, styles.missionSectionTitle]}>미션 둘러보기</Text>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={missionCardWidth + 12}
          decelerationRate="fast"
          contentContainerStyle={styles.missionRail}
          onMomentumScrollEnd={(event) => setActiveMission(Math.round(event.nativeEvent.contentOffset.x / (missionCardWidth + 12)))}
        >
          {missionCards.map((mission) => (
            <Pressable
              key={mission.title}
              accessibilityRole="button"
              accessibilityLabel={`${mission.title}, ${mission.points}`}
              onPress={() => router.push("/mission")}
              style={({ pressed }) => [styles.swipeCard, { width: missionCardWidth }, pressed && styles.pressed]}
            >
              <Image contentFit="cover" source={require("@/assets/images/omg.png")} style={styles.swipeImage} />
              <View style={styles.swipeCopy}><Text style={styles.swipeType}>{mission.type}</Text><Text style={styles.swipeTitle} numberOfLines={2}>{mission.shortTitle}</Text><Text style={styles.swipeMeta}>{mission.distance} · 약 {mission.time}</Text></View>
              <View style={styles.swipePoints}><Ionicons name="star" size={16} color={colors.orange} /><Text style={styles.swipePointsText}>{mission.points}</Text></View>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.dots} accessibilityLabel={`미션 카드 ${activeMission + 1}번 선택됨`}>
          {missionCards.map((mission, index) => <View key={mission.title} style={[styles.dot, index === activeMission && styles.activeDot]} />)}
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="내 활동과 동네 랭크 보기" onPress={() => router.push("/my")} style={({ pressed }) => [styles.progressCard, pressed && styles.pressed]}>
          <View style={styles.progressHeader}>
            <View><Text style={styles.progressEyebrow}>이번 주 활동</Text><Text style={styles.progressHeading}>Community XP</Text></View>
            <View style={styles.rankBadge}><Ionicons name="trophy" size={15} color="#ffd36a" /><Text style={styles.rankBadgeText}>Gold</Text></View>
          </View>
          <View style={styles.progressBody}>
            <ProgressRing />
            <View style={styles.progressCopy}><Text style={styles.progressTitle}>이번 주 목표의 73%를 채웠어요</Text><Text style={styles.progressDescription}>작은 미션을 더하면 다음 랭크에 가까워져요.</Text><View style={styles.progressStats}><View style={styles.progressStat}><Text style={styles.progressStatValue}>24</Text><Text style={styles.progressStatLabel}>해결한 문제</Text></View><View style={styles.progressStat}><Text style={styles.progressStatValue}>83</Text><Text style={styles.progressStatLabel}>참여 주민</Text></View></View></View>
          </View>
        </Pressable>

        <Pressable accessibilityRole="button" accessibilityLabel="우리 동네 현황을 지도에서 보기" onPress={() => router.push("/map")} style={({ pressed }) => [styles.surfaceCard, pressed && styles.pressed]}>
          <View style={styles.sectionCardHeader}><View style={styles.sectionHeadingRow}><Ionicons name="business-outline" size={24} color={colors.green} /><Text style={styles.surfaceTitle}>우리 동네 현황</Text></View><Text style={styles.period}>이번 주 (7.28 - 8.3)</Text></View>
          <View style={styles.metricGrid}>{neighborhoodMetrics.map((metric, index) => <View key={metric.label} style={[styles.metric, index === neighborhoodMetrics.length - 1 && styles.metricLast]}><Ionicons name={metric.icon} size={28} color={metric.color} /><Text style={styles.metricLabel}>{metric.label}</Text><Text style={styles.metricValue}>{metric.value}</Text></View>)}</View>
          <View style={styles.cardLinkRow}><Text style={styles.cardLink}>동네 현황 더 보기</Text><Ionicons name="chevron-forward" size={20} color={colors.green} /></View>
        </Pressable>

        <Text style={styles.sectionTitle}>오늘의 3분 미션</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="공원 안내판이 나뭇가지에 가려졌는지 확인 미션 시작" onPress={() => router.push("/mission")} style={({ pressed }) => [styles.surfaceCard, styles.dailyCard, pressed && styles.pressed]}>
          <Image contentFit="cover" source={require("@/assets/images/omg.png")} style={styles.dailyImage} />
          <View style={styles.dailyCopy}><Text style={styles.dailyTitle}>공원 안내판 가려짐 확인</Text><Text style={styles.dailyMeta}>180m · 약 4분</Text><View style={styles.rewardRow}><Ionicons name="star" size={16} color={colors.orange} /><Text style={styles.rewardText}>15P</Text></View></View>
          <View style={styles.startButton}><Text style={styles.startButtonText}>시작하기</Text></View>
        </Pressable>
        <View style={styles.bottomHint}><Text style={styles.bottomHintText}>작은 참여가 더 좋은 동네를 만들어요.</Text></View>
      </ScrollView>
      <FloatingNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 160 },
  header: { alignItems: "center", justifyContent: "center", minHeight: 52 },
  logo: { width: 176, height: 48 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  sectionTitle: { color: colors.text, fontFamily: "WantedSansB", fontSize: 24, lineHeight: 30, marginBottom: 9, marginTop: 18 },
  missionSectionTitle: { marginTop: 20 },
  recommendedCard: { backgroundColor: colors.greenSoft, borderRadius: 18, minHeight: 150, padding: 15 },
  cardEyebrowRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  cardEyebrow: { color: "#2c461c", fontFamily: "WantedSansB", fontSize: 14 },
  pointsPill: { alignItems: "center", flexDirection: "row", gap: 5 },
  pointsText: { color: "#24310e", fontFamily: "WantedSansB", fontSize: 15 },
  recommendedTitle: { color: "#050505", fontFamily: "WantedSansB", fontSize: 23, letterSpacing: -1, marginTop: 10 },
  cardMetaRow: { alignItems: "center", flexDirection: "row", gap: 7, marginTop: 9 },
  recommendedUser: { color: "#14210f", fontFamily: "WantedSansB", fontSize: 13 },
  recommendedFooter: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 7 },
  recommendedMeta: { color: "#4a603c", fontFamily: "WantedSansR", fontSize: 12 },
  missionRail: { gap: 12 },
  swipeCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, flexDirection: "row", minHeight: 112, overflow: "hidden", padding: 10 },
  swipeImage: { backgroundColor: "#d6ecbb", borderRadius: 12, height: 90, width: 90 },
  swipeCopy: { flex: 1, justifyContent: "center", marginLeft: 12 },
  swipeType: { color: colors.green, fontFamily: "WantedSansB", fontSize: 10, marginBottom: 4 },
  swipeTitle: { color: colors.text, fontFamily: "WantedSansB", fontSize: 16, lineHeight: 21 },
  swipeMeta: { color: colors.muted, fontFamily: "WantedSansR", fontSize: 11, marginTop: 5 },
  swipePoints: { alignItems: "center", justifyContent: "center", minWidth: 38 },
  swipePointsText: { color: colors.orange, fontFamily: "WantedSansB", fontSize: 12, marginTop: 3 },
  dots: { alignItems: "center", flexDirection: "row", gap: 5, justifyContent: "center", marginTop: 8 },
  dot: { backgroundColor: "#3d3d3d", borderRadius: 4, height: 5, width: 5 },
  activeDot: { backgroundColor: colors.green, width: 16 },
  progressCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, marginTop: 14, padding: 14 },
  progressHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  progressEyebrow: { color: colors.muted, fontFamily: "WantedSansR", fontSize: 11 },
  progressHeading: { color: colors.text, fontFamily: "WantedSansB", fontSize: 18, marginTop: 2 },
  rankBadge: { alignItems: "center", backgroundColor: "#3c321f", borderColor: "#6f5927", borderRadius: 999, borderWidth: 1, flexDirection: "row", gap: 5, paddingHorizontal: 9, paddingVertical: 6 },
  rankBadgeText: { color: "#ffd36a", fontFamily: "WantedSansB", fontSize: 11 },
  progressBody: { alignItems: "center", flexDirection: "row", marginTop: 12 },
  progressRingWrap: { alignItems: "center", height: 104, justifyContent: "center", width: 104 },
  progressRingText: { alignItems: "center", position: "absolute" },
  progressValue: { color: colors.text, fontFamily: "WantedSansB", fontSize: 28, lineHeight: 30 },
  progressTotal: { color: colors.muted, fontFamily: "WantedSansR", fontSize: 10 },
  progressCopy: { flex: 1, marginLeft: 14 },
  progressTitle: { color: colors.text, fontFamily: "WantedSansB", fontSize: 14, lineHeight: 19 },
  progressDescription: { color: colors.muted, fontFamily: "WantedSansR", fontSize: 11, lineHeight: 16, marginTop: 4 },
  progressStats: { flexDirection: "row", gap: 10, marginTop: 9 },
  progressStat: { backgroundColor: "#20251f", borderRadius: 10, minWidth: 72, paddingHorizontal: 8, paddingVertical: 6 },
  progressStatValue: { color: colors.green, fontFamily: "WantedSansB", fontSize: 14 },
  progressStatLabel: { color: colors.muted, fontFamily: "WantedSansR", fontSize: 9, marginTop: 1 },
  surfaceCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, marginTop: 14, padding: 12 },
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
