import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { ApiError } from "../api/client";
import { getQuests } from "../api/quests";
import { useAuth } from "../auth/AuthContext";
import AppHeader from "../components/AppHeader";
import MissionComposer from "../components/MissionComposer";
import {
  excludeMissionsCreatedByUser,
  formatDistance,
  type Mission,
} from "../data/missions";
import { neighborhoodMetrics } from "../data/mock";
import { useCurrentLocation } from "../hooks/useCurrentLocation";
import { useTheme } from "../theme/ThemeContext";

function ProgressRing({
  colors,
}: {
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const radius = 39;
  const circumference = 2 * Math.PI * radius;
  const progress = 73;
  return (
    <View
      style={styles.progressRingWrap}
      accessibilityLabel="이번 주 Community XP 진행도 73점"
    >
      <Svg width={104} height={104} viewBox="0 0 104 104">
        <Circle
          cx="52"
          cy="52"
          r={radius}
          stroke={colors.border}
          strokeWidth="10"
          fill="none"
        />
        <Circle
          cx="52"
          cy="52"
          r={radius}
          stroke={colors.green}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * 0.27}
          fill="none"
          transform="rotate(-90 52 52)"
        />
      </Svg>
      <View style={styles.progressRingText}>
        <Text style={[styles.progressValue, { color: colors.text }]}>73</Text>
        <Text style={[styles.progressTotal, { color: colors.muted }]}>
          /100
        </Text>
      </View>
    </View>
  );
}

function MissionTitle({
  children,
  compact = false,
  color = "#050505",
}: {
  children: string;
  compact?: boolean;
  color?: string;
}) {
  const length = children.length;
  const fontSize = compact
    ? length > 15
      ? 14
      : 16
    : length > 19
      ? 18
      : length > 13
        ? 21
        : 23;
  return (
    <Text
      numberOfLines={2}
      adjustsFontSizeToFit={false}
      style={[
        compact ? styles.swipeTitle : styles.recommendedTitle,
        { color, fontSize, lineHeight: compact ? fontSize + 4 : fontSize + 6 },
      ]}
    >
      {children}
    </Text>
  );
}

export default function Index() {
  const router = useRouter();
  const { colors, mode } = useTheme();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const [activeOtherMission, setActiveOtherMission] = useState(0);
  const [composerOpen, setComposerOpen] = useState(false);
  const [createdNotice, setCreatedNotice] = useState<string | null>(null);
  const missionCardWidth = Math.min(width - 40, 320);

  // 등록 안내는 잠깐만 띄운다.
  useEffect(() => {
    if (!createdNotice) return;
    const timer = setTimeout(() => setCreatedNotice(null), 2600);
    return () => clearTimeout(timer);
  }, [createdNotice]);

  // 미션 탭과 같은 목록 API를 쓴다. 서버가 현재 위치 기준으로 가까운 순으로 주기 때문에
  // 맨 앞이 그대로 "추천 미션"이 된다.
  const [activated, setActivated] = useState(false);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const neighborhoodId = user?.neighborhoodId ?? null;
  const { origin } = useCurrentLocation(activated);

  const loadMissions = useCallback(async () => {
    if (neighborhoodId == null) {
      setMissions([]);
      setLoadError("동네를 설정하면 주변 미션을 볼 수 있어요.");
      return;
    }
    try {
      setMissions(
        await getQuests({
          neighborhoodId,
          latitude: origin.latitude,
          longitude: origin.longitude,
        }),
      );
      setLoadError(null);
    } catch (requestError) {
      // DEBUG: 홈에서 실패했을 때도 원인을 남긴다.
      console.log("[home] ✗ 목록 조회 실패", requestError);
      setMissions([]);
      setLoadError(
        requestError instanceof ApiError
          ? `${requestError.message} (HTTP ${requestError.status})`
          : `미션을 불러오지 못했어요: ${
              (requestError as Error)?.message ?? "알 수 없는 오류"
            }`,
      );
    }
  }, [neighborhoodId, origin.latitude, origin.longitude]);

  useFocusEffect(
    useCallback(() => {
      setActivated(true);
      void loadMissions();
    }, [loadMissions]),
  );

  const visibleMissions = useMemo(
    () => excludeMissionsCreatedByUser(missions, user?.nickname),
    [missions, user?.nickname],
  );
  const recommendedMission = visibleMissions[0] ?? null;
  const otherMissions = visibleMissions.slice(1, 5);
  // 가장 짧게 끝나는 미션을 "오늘의 3분 미션" 자리에 둔다.
  const quickMission = useMemo(
    () =>
      visibleMissions.reduce<Mission | null>(
        (shortest, mission) =>
          !shortest || mission.minutes < shortest.minutes ? mission : shortest,
        null,
      ),
    [visibleMissions],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <AppHeader />
        <Text style={[styles.greeting, { color: colors.muted }]}>
          오늘 우리 동네에서
        </Text>
        <Text style={[styles.heroTitle, { color: colors.text }]}>
          가볍게 바꿔볼까요?
        </Text>

        {recommendedMission ? (
          <View
            style={[
              styles.recommendedCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.recommendedImageWrap}>
              <Image
                source={recommendedMission.imageUrl}
                style={styles.recommendedImage}
                contentFit="cover"
                transition={160}
              />
              <View style={styles.imageTopRow}>
                <View style={styles.photoBadge}>
                  <Ionicons name="navigate" size={13} color="#17310b" />
                  <Text style={styles.photoBadgeText}>
                    {formatDistance(recommendedMission.distanceMeters)}
                  </Text>
                </View>
                <View style={styles.pointBadge}>
                  <Ionicons name="star" size={13} color="#17310b" />
                  <Text style={styles.pointBadgeText}>
                    {recommendedMission.rewardPoint}P
                  </Text>
                </View>
              </View>
              <View style={styles.photoCaption}>
                <Ionicons name="camera-outline" size={12} color="#fff" />
                <Text style={styles.photoCaptionText}>현장 사진</Text>
              </View>
            </View>
            <View style={styles.recommendedCopy}>
              <View style={styles.cardEyebrowRow}>
                <Text style={[styles.cardEyebrow, { color: colors.green }]}>
                  가장 가까운 미션
                </Text>
                <Text style={[styles.recommendedType, { color: colors.muted }]}>
                  {recommendedMission.neighborhood.name}
                </Text>
              </View>
              <MissionTitle color={colors.text}>
                {recommendedMission.title}
              </MissionTitle>
              <Text style={[styles.recommendedMeta, { color: colors.muted }]}>
                약 {recommendedMission.minutes}분 ·{" "}
                {recommendedMission.difficulty} ·{" "}
                {recommendedMission.authorNickname}님 제안
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: colors.green },
                  pressed && styles.pressed,
                ]}
                onPress={() => router.push("/mission")}
              >
                <Text style={styles.primaryButtonText}>미션 살펴보기</Text>
                <Ionicons name="arrow-forward" size={18} color="#17310b" />
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              loadError ? "미션 다시 불러오기" : "미션 둘러보기"
            }
            onPress={() => {
              if (loadError) {
                void loadMissions();
              } else {
                router.push("/mission");
              }
            }}
            style={({ pressed }) => [
              styles.emptyHero,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.emptyHeroIcon,
                { backgroundColor: colors.greenSoft },
              ]}
            >
              <Ionicons
                name={loadError ? "alert-circle-outline" : "sparkles-outline"}
                size={26}
                color={loadError ? colors.orange : colors.green}
              />
            </View>
            <Text style={[styles.emptyHeroTitle, { color: colors.text }]}>
              {loadError
                ? "미션을 불러오지 못했어요"
                : "아직 등록된 미션이 없어요"}
            </Text>
            <Text style={[styles.emptyHeroBody, { color: colors.muted }]}>
              {loadError ?? "우리 동네에 첫 미션을 만들어보세요."}
            </Text>
            {loadError ? (
              <Text style={[styles.emptyHeroRetry, { color: colors.greenInk }]}>
                눌러서 다시 시도
              </Text>
            ) : null}
          </Pressable>
        )}

        {otherMissions.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                다른 미션
              </Text>
              <Text style={[styles.sectionHint, { color: colors.muted }]}>
                옆으로 넘겨보세요
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={missionCardWidth + 12}
              decelerationRate="fast"
              contentContainerStyle={styles.missionRail}
              onMomentumScrollEnd={(event) =>
                setActiveOtherMission(
                  Math.min(
                    otherMissions.length - 1,
                    Math.round(
                      event.nativeEvent.contentOffset.x /
                        (missionCardWidth + 12),
                    ),
                  ),
                )
              }
            >
              {otherMissions.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.swipeCard,
                    {
                      width: missionCardWidth,
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Image
                    source={item.imageUrl}
                    style={[
                      styles.swipeImage,
                      { backgroundColor: colors.greenSoft },
                    ]}
                    contentFit="cover"
                    transition={160}
                  />
                  <View style={styles.swipeCopy}>
                    <Text
                      style={[styles.swipeType, { color: colors.greenInk }]}
                    >
                      {item.neighborhood.name}
                    </Text>
                    <MissionTitle compact color={colors.text}>
                      {item.title}
                    </MissionTitle>
                    <Text style={[styles.swipeMeta, { color: colors.muted }]}>
                      {formatDistance(item.distanceMeters)} · 약 {item.minutes}
                      분
                    </Text>
                  </View>
                  <Text
                    style={[styles.swipePointsText, { color: colors.orange }]}
                  >
                    {item.rewardPoint}P
                  </Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.dots}>
              {otherMissions.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.dot,
                    { backgroundColor: colors.border },
                    index === activeOtherMission && {
                      backgroundColor: colors.green,
                      width: 16,
                    },
                  ]}
                />
              ))}
            </View>
          </>
        ) : null}

        {/* 홈은 카드가 이어지는 화면이라 만들기도 카드 형태로 둔다(미션 탭은 플로팅 버튼). */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="미션 만들기"
          onPress={() => setComposerOpen(true)}
          style={({ pressed }) => [
            styles.createCard,
            { backgroundColor: colors.surface, borderColor: colors.green },
            pressed && styles.pressed,
          ]}
        >
          <View
            style={[styles.createIcon, { backgroundColor: colors.greenSoft }]}
          >
            <Ionicons name="add" size={24} color={"#101010"} />
          </View>
          <View style={styles.createCopy}>
            <Text style={[styles.createTitle, { color: colors.text }]}>
              우리 동네 미션 만들기
            </Text>
            <Text style={[styles.createDetail, { color: colors.muted }]}>
              사진과 설명만 올리면 AI가 시간·포인트·체크 포인트를 정리해줘요.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>

        {createdNotice ? (
          <View
            style={[
              styles.createdNotice,
              { backgroundColor: colors.greenSoft },
            ]}
          >
            <Ionicons name="checkmark-circle" size={16} color="#17310b" />
            <Text style={styles.createdNoticeText}>{createdNotice}</Text>
          </View>
        ) : null}

        <View
          style={[
            styles.progressCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.progressHeader}>
            <View>
              <Text style={[styles.progressEyebrow, { color: colors.muted }]}>
                COMMUNITY XP · 동네 성장
              </Text>
              <Text style={[styles.progressHeading, { color: colors.text }]}>
                서초2동 레벨 7
              </Text>
            </View>
            <View
              style={[
                styles.communityBadge,
                { backgroundColor: colors.greenSoft },
              ]}
            >
              <Ionicons name="people" size={15} color={"#101010"} />
              <Text style={[styles.communityBadgeText, { color: "black" }]}>
                주민 공동
              </Text>
            </View>
          </View>
          <View style={styles.progressBody}>
            <ProgressRing colors={colors} />
            <View style={styles.progressCopy}>
              <Text style={[styles.progressTitle, { color: colors.text }]}>
                동네 레벨 8까지 27 XP
              </Text>
              <Text
                style={[styles.progressDescription, { color: colors.muted }]}
              >
                주민 83명의 활동이 함께 쌓여요.
              </Text>
              <View
                style={[
                  styles.personalXpCard,
                  { backgroundColor: colors.surfaceRaised },
                ]}
              >
                <View>
                  <Text
                    style={[styles.personalXpEyebrow, { color: colors.muted }]}
                  >
                    PERSONAL XP · 나의 성장
                  </Text>
                  <Text
                    style={[styles.personalXpTitle, { color: colors.text }]}
                  >
                    개인 레벨 12 · Gold
                  </Text>
                </View>
                <View style={styles.personalXpValue}>
                  <Text
                    style={[styles.personalXpNumber, { color: colors.purple }]}
                  >
                    240
                  </Text>
                  <Text
                    style={[styles.personalXpTotal, { color: colors.muted }]}
                  >
                    /300 XP
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.surfaceCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionCardHeader}>
            <View style={styles.sectionHeadingRow}>
              <Ionicons
                name="business-outline"
                size={19}
                color={colors.green}
              />
              <Text style={[styles.surfaceTitle, { color: colors.text }]}>
                우리 동네 현황
              </Text>
            </View>
            <Text style={[styles.period, { color: colors.muted }]}>
              이번 주
            </Text>
          </View>
          <View
            style={[
              styles.metricGrid,
              {
                borderBottomColor: colors.border,
                borderTopColor: colors.border,
              },
            ]}
          >
            {neighborhoodMetrics.map((metric, index) => (
              <View
                key={metric.label}
                style={[
                  styles.metric,
                  { borderRightColor: colors.border },
                  index === 3 && styles.metricLast,
                ]}
              >
                <Ionicons
                  name={metric.icon}
                  size={21}
                  color={colors[metric.color]}
                />
                <Text style={[styles.metricLabel, { color: colors.muted }]}>
                  {metric.label}
                </Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {metric.value}
                </Text>
              </View>
            ))}
          </View>
          <Pressable
            style={styles.cardLinkRow}
            onPress={() => router.push("/community")}
          >
            <Text style={[styles.cardLink, { color: colors.greenInk }]}>
              동네 현황 더 보기
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.greenInk}
            />
          </Pressable>
        </View>

        {quickMission ? (
          <View
            style={[
              styles.surfaceCard,
              styles.dailyCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View
              style={[styles.dailyImage, { backgroundColor: colors.greenSoft }]}
            >
              <Ionicons name="timer-outline" size={26} color={"#101010"} />
            </View>
            <View style={styles.dailyCopy}>
              <Text style={[styles.dailyKicker, { color: colors.muted }]}>
                가장 빨리 끝나는 미션
              </Text>
              <Text
                numberOfLines={2}
                style={[styles.dailyTitle, { color: colors.text }]}
              >
                {quickMission.title}
              </Text>
              <Text style={[styles.dailyMeta, { color: colors.greenInk }]}>
                {formatDistance(quickMission.distanceMeters)} · 약{" "}
                {quickMission.minutes}분
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/mission")}
              style={[styles.startButton, { backgroundColor: colors.green }]}
            >
              <Text style={styles.startButtonText}>시작하기</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <MissionComposer
        visible={composerOpen}
        neighborhoodName={user?.neighborhoodName}
        onClose={() => setComposerOpen(false)}
        onCreated={(title) => {
          setComposerOpen(false);
          setCreatedNotice(`"${title}" 미션을 등록했어요.`);
          // 방금 만든 미션이 홈 카드에도 바로 보이도록 다시 불러온다.
          void loadMissions();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 148, paddingHorizontal: 20, paddingTop: 26 },
  greeting: { fontFamily: "WantedSansR", fontSize: 13, marginTop: 6 },
  heroTitle: {
    fontFamily: "WantedSansB",
    fontSize: 27,
    letterSpacing: -1,
    marginBottom: 15,
    marginTop: 4,
  },
  recommendedCard: {
    borderRadius: 22,
    borderWidth: 1,
    minHeight: 300,
    overflow: "hidden",
  },
  recommendedImageWrap: { height: 138, position: "relative" },
  recommendedImage: { height: "100%", width: "100%" },
  imageTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    left: 12,
    position: "absolute",
    right: 12,
    top: 12,
  },
  photoBadge: {
    alignItems: "center",
    backgroundColor: "rgba(196,246,156,0.94)",
    borderRadius: 99,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  photoBadgeText: { color: "#17310b", fontFamily: "WantedSansB", fontSize: 9 },
  pointBadge: {
    alignItems: "center",
    backgroundColor: "rgba(255,211,106,0.95)",
    borderRadius: 99,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  pointBadgeText: { color: "#17310b", fontFamily: "WantedSansB", fontSize: 10 },
  photoCaption: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.62)",
    borderRadius: 99,
    bottom: 10,
    flexDirection: "row",
    gap: 4,
    left: 11,
    paddingHorizontal: 8,
    paddingVertical: 5,
    position: "absolute",
  },
  photoCaptionText: { color: "#fff", fontFamily: "WantedSansB", fontSize: 8 },
  recommendedCopy: { padding: 16 },
  cardEyebrowRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardEyebrow: { fontFamily: "WantedSansB", fontSize: 11 },
  recommendedType: { fontFamily: "WantedSansR", fontSize: 10 },
  recommendedTitle: {
    fontFamily: "WantedSansB",
    letterSpacing: -1,
    marginTop: 10,
  },
  recommendedMeta: { fontFamily: "WantedSansR", fontSize: 11, marginTop: 5 },
  primaryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    marginTop: 13,
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  emptyHero: {
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 30,
  },
  emptyHeroIcon: {
    alignItems: "center",
    borderRadius: 999,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  emptyHeroTitle: { fontFamily: "WantedSansB", fontSize: 16, marginTop: 12 },
  emptyHeroBody: {
    fontFamily: "WantedSansR",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
    textAlign: "center",
  },
  emptyHeroRetry: { fontFamily: "WantedSansB", fontSize: 11, marginTop: 10 },
  createCard: {
    alignItems: "center",
    borderRadius: 18,
    borderStyle: "dashed",
    borderWidth: 1.5,
    flexDirection: "row",
    marginTop: 16,
    padding: 14,
  },
  createIcon: {
    alignItems: "center",
    borderRadius: 14,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  createCopy: { flex: 1, marginLeft: 12 },
  createTitle: { fontFamily: "WantedSansB", fontSize: 15 },
  createDetail: {
    fontFamily: "WantedSansR",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },
  createdNotice: {
    alignItems: "center",
    borderRadius: 14,
    flexDirection: "row",
    gap: 7,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  createdNoticeText: {
    color: "#17310b",
    flex: 1,
    fontFamily: "WantedSansB",
    fontSize: 11,
  },
  primaryButtonText: {
    color: "#17310b",
    fontFamily: "WantedSansB",
    fontSize: 12,
  },
  pressed: { opacity: 0.76, transform: [{ scale: 0.98 }] },
  sectionHeader: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 22,
  },
  sectionTitle: { fontFamily: "WantedSansB", fontSize: 20 },
  sectionHint: { fontFamily: "WantedSansR", fontSize: 11 },
  missionRail: { gap: 12, paddingTop: 10 },
  swipeCard: {
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 112,
    overflow: "hidden",
    padding: 10,
  },
  swipeImage: {
    alignItems: "center",
    borderRadius: 12,
    height: 90,
    justifyContent: "center",
    width: 90,
  },
  swipeCopy: { flex: 1, justifyContent: "center", marginLeft: 12 },
  swipeType: { fontFamily: "WantedSansB", fontSize: 10, marginBottom: 4 },
  swipeTitle: { fontFamily: "WantedSansB" },
  swipeMeta: { fontFamily: "WantedSansR", fontSize: 11, marginTop: 5 },
  swipePointsText: {
    alignSelf: "center",
    fontFamily: "WantedSansB",
    fontSize: 12,
    marginRight: 3,
  },
  dots: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    marginTop: 8,
  },
  dot: { borderRadius: 4, height: 5, width: 5 },
  progressCard: {
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 18,
    padding: 14,
  },
  progressHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressEyebrow: {
    fontFamily: "WantedSansR",
    fontSize: 10,
    letterSpacing: 1,
  },
  progressHeading: { fontFamily: "WantedSansB", fontSize: 18, marginTop: 2 },
  communityBadge: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  communityBadgeText: { fontFamily: "WantedSansB", fontSize: 10 },
  progressBody: { alignItems: "center", flexDirection: "row", marginTop: 12 },
  progressRingWrap: {
    alignItems: "center",
    height: 104,
    justifyContent: "center",
    width: 104,
  },
  progressRingText: { alignItems: "center", position: "absolute" },
  progressValue: { fontFamily: "WantedSansB", fontSize: 28, lineHeight: 30 },
  progressTotal: { fontFamily: "WantedSansR", fontSize: 10 },
  progressCopy: { flex: 1, marginLeft: 14 },
  progressTitle: { fontFamily: "WantedSansB", fontSize: 14, lineHeight: 19 },
  progressDescription: {
    fontFamily: "WantedSansR",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  personalXpCard: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    padding: 9,
  },
  personalXpEyebrow: {
    fontFamily: "WantedSansR",
    fontSize: 8,
    letterSpacing: 0.4,
  },
  personalXpTitle: { fontFamily: "WantedSansB", fontSize: 11, marginTop: 3 },
  personalXpValue: { alignItems: "flex-end", marginLeft: 8 },
  personalXpNumber: { fontFamily: "WantedSansB", fontSize: 16 },
  personalXpTotal: { fontFamily: "WantedSansR", fontSize: 8 },
  surfaceCard: { borderRadius: 16, borderWidth: 1, marginTop: 14, padding: 12 },
  sectionCardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionHeadingRow: { alignItems: "center", flexDirection: "row", gap: 8 },
  surfaceTitle: { fontFamily: "WantedSansB", fontSize: 15 },
  period: { fontFamily: "WantedSansR", fontSize: 10 },
  metricGrid: {
    borderBottomWidth: 1,
    borderTopWidth: 1,
    flexDirection: "row",
    marginTop: 8,
    paddingVertical: 7,
  },
  metric: {
    alignItems: "center",
    borderRightWidth: 1,
    flex: 1,
    minHeight: 65,
    paddingHorizontal: 2,
  },
  metricLast: { borderRightWidth: 0 },
  metricLabel: {
    fontFamily: "WantedSansR",
    fontSize: 9,
    marginTop: 5,
    textAlign: "center",
  },
  metricValue: {
    fontFamily: "WantedSansB",
    fontSize: 14,
    marginTop: 3,
    textAlign: "center",
  },
  cardLinkRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
    justifyContent: "flex-end",
    marginTop: 8,
  },
  cardLink: { fontFamily: "WantedSansB", fontSize: 12 },
  dailyCard: { alignItems: "center", flexDirection: "row", minHeight: 86 },
  dailyImage: {
    alignItems: "center",
    borderRadius: 50,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  dailyCopy: { flex: 1, marginLeft: 12 },
  dailyKicker: { fontFamily: "WantedSansR", fontSize: 10, marginBottom: 2 },
  dailyTitle: { fontFamily: "WantedSansB", fontSize: 12, lineHeight: 17 },
  dailyMeta: { fontFamily: "WantedSansR", fontSize: 11, marginTop: 2 },
  startButton: {
    alignItems: "center",
    borderRadius: 16,
    justifyContent: "center",
    minWidth: 74,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  startButtonText: {
    color: "#14220c",
    fontFamily: "WantedSansB",
    fontSize: 12,
  },
});
