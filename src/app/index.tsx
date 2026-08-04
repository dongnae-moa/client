import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Circle } from "react-native-svg";
import AppHeader from "../components/AppHeader";
import { missionCards, neighborhoodMetrics } from "../data/mock";
import { useTheme } from "../theme/ThemeContext";

function ProgressRing({ colors }: { colors: ReturnType<typeof useTheme>["colors"] }) {
  const radius = 39;
  const circumference = 2 * Math.PI * radius;
  const progress = 73;
  return (
    <View style={styles.progressRingWrap} accessibilityLabel="이번 주 Community XP 진행도 73점">
      <Svg width={104} height={104} viewBox="0 0 104 104">
        <Circle cx="52" cy="52" r={radius} stroke={colors.border} strokeWidth="10" fill="none" />
        <Circle cx="52" cy="52" r={radius} stroke={colors.green} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={circumference * 0.27} fill="none" transform="rotate(-90 52 52)" />
      </Svg>
      <View style={styles.progressRingText}><Text style={[styles.progressValue, { color: colors.text }]}>73</Text><Text style={[styles.progressTotal, { color: colors.muted }]}>/100</Text></View>
    </View>
  );
}

function MissionTitle({ children, compact = false, color = "#050505" }: { children: string; compact?: boolean; color?: string }) {
  const length = children.length;
  const fontSize = compact ? (length > 15 ? 14 : 16) : (length > 19 ? 18 : length > 13 ? 21 : 23);
  return <Text numberOfLines={2} adjustsFontSizeToFit={false} style={[compact ? styles.swipeTitle : styles.recommendedTitle, { color, fontSize, lineHeight: compact ? fontSize + 4 : fontSize + 6 }]}>{children}</Text>;
}

export default function Index() {
  const router = useRouter();
  const { colors, mode } = useTheme();
  const { width } = useWindowDimensions();
  const [activeMission, setActiveMission] = useState(0);
  const missionCardWidth = Math.min(width - 40, 320);
  const mission = missionCards[activeMission];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <AppHeader />
        <Text style={[styles.greeting, { color: colors.muted }]}>오늘 우리 동네에서</Text>
        <Text style={[styles.heroTitle, { color: colors.text }]}>가볍게 바꿔볼까요?</Text>

        <View style={[styles.recommendedCard, { backgroundColor: colors.greenSoft }]}>
          <View style={styles.cardEyebrowRow}><Text style={styles.cardEyebrow}>추천 미션 · {mission.distance}</Text><Text style={styles.pointsText}>★ {mission.points}</Text></View>
          <MissionTitle>{mission.shortTitle}</MissionTitle>
          <Text style={styles.recommendedMeta}>{mission.type} · {mission.time} · temp_username</Text>
          <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={() => router.push("/mission")}><Text style={styles.primaryButtonText}>미션 살펴보기</Text><Ionicons name="arrow-forward" size={18} color="#17310b" /></Pressable>
        </View>

        <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.text }]}>다른 미션</Text><Text style={[styles.sectionHint, { color: colors.muted }]}>옆으로 넘겨보세요</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={missionCardWidth + 12} decelerationRate="fast" contentContainerStyle={styles.missionRail} onMomentumScrollEnd={(event) => setActiveMission(Math.round(event.nativeEvent.contentOffset.x / (missionCardWidth + 12)) % missionCards.length)}>
          {missionCards.map((item) => <View key={item.shortTitle} style={[styles.swipeCard, { width: missionCardWidth, backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.swipeImage, { backgroundColor: colors.greenSoft }]}><Ionicons name="leaf-outline" size={28} color={colors.green} /></View><View style={styles.swipeCopy}><Text style={[styles.swipeType, { color: colors.greenInk }]}>{item.type}</Text><MissionTitle compact color={colors.text}>{item.shortTitle}</MissionTitle><Text style={[styles.swipeMeta, { color: colors.muted }]}>{item.distance} · 약 {item.time}</Text></View><Text style={[styles.swipePointsText, { color: colors.orange }]}>{item.points}</Text></View>)}
        </ScrollView>
        <View style={styles.dots}>{missionCards.map((item, index) => <View key={item.shortTitle} style={[styles.dot, { backgroundColor: colors.border }, index === activeMission && { backgroundColor: colors.green, width: 16 }]} />)}</View>

        <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.progressHeader}><View><Text style={[styles.progressEyebrow, { color: colors.muted }]}>COMMUNITY XP</Text><Text style={[styles.progressHeading, { color: colors.text }]}>이번 주 동네 기여도</Text></View><View style={[styles.rankBadge, { backgroundColor: colors.goldSurface, borderColor: colors.goldBorder }]}><Ionicons name="medal-outline" size={15} color={colors.gold} /><Text style={[styles.rankBadgeText, { color: colors.gold }]}>GOLD</Text></View></View>
          <View style={styles.progressBody}><ProgressRing colors={colors} /><View style={styles.progressCopy}><Text style={[styles.progressTitle, { color: colors.text }]}>조금만 더 하면 다음 배지예요</Text><Text style={[styles.progressDescription, { color: colors.muted }]}>이번 주 미션 3개를 완료했어요.</Text><View style={styles.progressStats}><View style={[styles.progressStat, { backgroundColor: colors.surfaceRaised }]}><Text style={[styles.progressStatValue, { color: colors.greenInk }]}>+240</Text><Text style={[styles.progressStatLabel, { color: colors.muted }]}>이번 주 XP</Text></View><View style={[styles.progressStat, { backgroundColor: colors.surfaceRaised }]}><Text style={[styles.progressStatValue, { color: colors.greenInk }]}>3개</Text><Text style={[styles.progressStatLabel, { color: colors.muted }]}>완료 미션</Text></View></View></View></View>
        </View>

        <View style={[styles.surfaceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.sectionCardHeader}><View style={styles.sectionHeadingRow}><Ionicons name="business-outline" size={19} color={colors.green} /><Text style={[styles.surfaceTitle, { color: colors.text }]}>우리 동네 현황</Text></View><Text style={[styles.period, { color: colors.muted }]}>이번 주</Text></View><View style={[styles.metricGrid, { borderBottomColor: colors.border, borderTopColor: colors.border }]}>{neighborhoodMetrics.map((metric, index) => <View key={metric.label} style={[styles.metric, { borderRightColor: colors.border }, index === 3 && styles.metricLast]}><Ionicons name={metric.icon} size={21} color={colors[metric.color]} /><Text style={[styles.metricLabel, { color: colors.muted }]}>{metric.label}</Text><Text style={[styles.metricValue, { color: colors.text }]}>{metric.value}</Text></View>)}</View><Pressable style={styles.cardLinkRow} onPress={() => router.push("/community")}><Text style={[styles.cardLink, { color: colors.greenInk }]}>동네 현황 더 보기</Text><Ionicons name="chevron-forward" size={16} color={colors.greenInk} /></Pressable></View>

        <View style={[styles.surfaceCard, styles.dailyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.dailyImage, { backgroundColor: colors.greenSoft }]}><Ionicons name="timer-outline" size={26} color={colors.green} /></View><View style={styles.dailyCopy}><Text style={[styles.dailyKicker, { color: colors.muted }]}>오늘의 3분 미션</Text><Text style={[styles.dailyTitle, { color: colors.text }]}>공원 안내판 상태 확인하기</Text><Text style={[styles.dailyMeta, { color: colors.greenInk }]}>180m · 약 2분</Text></View><Pressable onPress={() => router.push("/mission")} style={[styles.startButton, { backgroundColor: colors.green }]}><Text style={styles.startButtonText}>시작하기</Text></Pressable></View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 148, paddingHorizontal: 20, paddingTop: 26 },
  greeting: { fontFamily: "WantedSansR", fontSize: 13, marginTop: 6 },
  heroTitle: { fontFamily: "WantedSansB", fontSize: 27, letterSpacing: -1, marginBottom: 15, marginTop: 4 },
  recommendedCard: { borderRadius: 20, minHeight: 174, padding: 16 },
  cardEyebrowRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  cardEyebrow: { color: "#2c461c", fontFamily: "WantedSansB", fontSize: 13 },
  pointsText: { color: "#24310e", fontFamily: "WantedSansB", fontSize: 14 },
  recommendedTitle: { color: "#050505", fontFamily: "WantedSansB", letterSpacing: -1, marginTop: 14 },
  recommendedMeta: { color: "#4a603c", fontFamily: "WantedSansR", fontSize: 12, marginTop: 5 },
  primaryButton: { alignItems: "center", alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.72)", borderRadius: 999, flexDirection: "row", gap: 6, marginTop: 14, paddingHorizontal: 15, paddingVertical: 8 },
  primaryButtonText: { color: "#17310b", fontFamily: "WantedSansB", fontSize: 12 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.98 }] },
  sectionHeader: { alignItems: "baseline", flexDirection: "row", justifyContent: "space-between", marginTop: 22 },
  sectionTitle: { fontFamily: "WantedSansB", fontSize: 20 },
  sectionHint: { fontFamily: "WantedSansR", fontSize: 11 },
  missionRail: { gap: 12, paddingTop: 10 },
  swipeCard: { borderRadius: 18, borderWidth: 1, flexDirection: "row", minHeight: 112, overflow: "hidden", padding: 10 },
  swipeImage: { alignItems: "center", borderRadius: 12, height: 90, justifyContent: "center", width: 90 },
  swipeCopy: { flex: 1, justifyContent: "center", marginLeft: 12 },
  swipeType: { fontFamily: "WantedSansB", fontSize: 10, marginBottom: 4 },
  swipeTitle: { fontFamily: "WantedSansB" },
  swipeMeta: { fontFamily: "WantedSansR", fontSize: 11, marginTop: 5 },
  swipePointsText: { alignSelf: "center", fontFamily: "WantedSansB", fontSize: 12, marginRight: 3 },
  dots: { alignItems: "center", flexDirection: "row", gap: 5, justifyContent: "center", marginTop: 8 },
  dot: { borderRadius: 4, height: 5, width: 5 },
  progressCard: { borderRadius: 18, borderWidth: 1, marginTop: 18, padding: 14 },
  progressHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  progressEyebrow: { fontFamily: "WantedSansR", fontSize: 10, letterSpacing: 1 },
  progressHeading: { fontFamily: "WantedSansB", fontSize: 18, marginTop: 2 },
  rankBadge: { alignItems: "center", borderRadius: 999, borderWidth: 1, flexDirection: "row", gap: 5, paddingHorizontal: 9, paddingVertical: 6 },
  rankBadgeText: { fontFamily: "WantedSansB", fontSize: 10 },
  progressBody: { alignItems: "center", flexDirection: "row", marginTop: 12 },
  progressRingWrap: { alignItems: "center", height: 104, justifyContent: "center", width: 104 },
  progressRingText: { alignItems: "center", position: "absolute" },
  progressValue: { fontFamily: "WantedSansB", fontSize: 28, lineHeight: 30 },
  progressTotal: { fontFamily: "WantedSansR", fontSize: 10 },
  progressCopy: { flex: 1, marginLeft: 14 },
  progressTitle: { fontFamily: "WantedSansB", fontSize: 14, lineHeight: 19 },
  progressDescription: { fontFamily: "WantedSansR", fontSize: 11, lineHeight: 16, marginTop: 4 },
  progressStats: { flexDirection: "row", gap: 10, marginTop: 9 },
  progressStat: { borderRadius: 10, minWidth: 72, paddingHorizontal: 8, paddingVertical: 6 },
  progressStatValue: { fontFamily: "WantedSansB", fontSize: 14 },
  progressStatLabel: { fontFamily: "WantedSansR", fontSize: 9, marginTop: 1 },
  surfaceCard: { borderRadius: 16, borderWidth: 1, marginTop: 14, padding: 12 },
  sectionCardHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  sectionHeadingRow: { alignItems: "center", flexDirection: "row", gap: 8 },
  surfaceTitle: { fontFamily: "WantedSansB", fontSize: 15 },
  period: { fontFamily: "WantedSansR", fontSize: 10 },
  metricGrid: { borderBottomWidth: 1, borderTopWidth: 1, flexDirection: "row", marginTop: 8, paddingVertical: 7 },
  metric: { alignItems: "center", borderRightWidth: 1, flex: 1, minHeight: 65, paddingHorizontal: 2 },
  metricLast: { borderRightWidth: 0 },
  metricLabel: { fontFamily: "WantedSansR", fontSize: 9, marginTop: 5, textAlign: "center" },
  metricValue: { fontFamily: "WantedSansB", fontSize: 14, marginTop: 3, textAlign: "center" },
  cardLinkRow: { alignItems: "center", flexDirection: "row", gap: 2, justifyContent: "flex-end", marginTop: 8 },
  cardLink: { fontFamily: "WantedSansB", fontSize: 12 },
  dailyCard: { alignItems: "center", flexDirection: "row", minHeight: 86 },
  dailyImage: { alignItems: "center", borderRadius: 50, height: 56, justifyContent: "center", width: 56 },
  dailyCopy: { flex: 1, marginLeft: 12 },
  dailyKicker: { fontFamily: "WantedSansR", fontSize: 10, marginBottom: 2 },
  dailyTitle: { fontFamily: "WantedSansB", fontSize: 12, lineHeight: 17 },
  dailyMeta: { fontFamily: "WantedSansR", fontSize: 11, marginTop: 2 },
  startButton: { alignItems: "center", borderRadius: 16, justifyContent: "center", minWidth: 74, paddingHorizontal: 9, paddingVertical: 7 },
  startButtonText: { color: "#14220c", fontFamily: "WantedSansB", fontSize: 12 },
});
