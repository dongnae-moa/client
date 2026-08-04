import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import AppHeader from "../components/AppHeader";
import { ScreenSurface, SurfaceCard } from "../components/ScreenSurface";
import { useTheme } from "../theme/ThemeContext";

const categories = ["전체", "공공질서", "접근성", "시설 확인", "환경"];
const difficulties = ["전체", "쉬움", "보통", "어려움"];
const sortOptions = [
  { id: "distance", label: "가까운 순" },
  { id: "points", label: "포인트 많은 순" },
  { id: "time", label: "짧은 시간 순" },
  { id: "difficulty", label: "쉬운 순" },
] as const;
const DISTANCE_ANY = 1050;
const TIME_ANY = 31;
const POINTS_ANY = 51;
const missions = [
  { id: "bike", title: "인도를 막고 있는 공유자전거를 지정 구역으로 이동", category: "공공질서", distance: 20, minutes: 3, points: 20, difficulty: "쉬움", icon: "bicycle-outline" as const },
  { id: "access", title: "점자블록 위 이동 가능한 방해물 정리", category: "접근성", distance: 80, minutes: 3, points: 25, difficulty: "쉬움", icon: "accessibility-outline" as const },
  { id: "facility", title: "공원 운동기구 파손 여부 확인", category: "시설 확인", distance: 120, minutes: 4, points: 15, difficulty: "어려움", icon: "construct-outline" as const },
  { id: "bench", title: "벤치 주변 가벼운 쓰레기 정리", category: "환경", distance: 160, minutes: 5, points: 20, difficulty: "쉬움", icon: "leaf-outline" as const },
];

type RangeSliderProps = {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  valueText: string;
  onChange: (value: number) => void;
};

function RangeSlider({ label, min, max, step, value, valueText, onChange }: RangeSliderProps) {
  const { colors } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const progress = useSharedValue((value - min) / (max - min));

  useEffect(() => {
    progress.value = (value - min) / (max - min);
  }, [max, min, progress, value]);

  const updateFromX = (x: number) => {
    if (trackWidth <= 0) return;
    const nextProgress = Math.max(0, Math.min(1, x / trackWidth));
    const rawValue = min + nextProgress * (max - min);
    const nextValue = Math.max(min, Math.min(max, Math.round(rawValue / step) * step));
    progress.value = (nextValue - min) / (max - min);
    onChange(nextValue);
  };

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .runOnJS(true)
      .activeOffsetX([-4, 4])
      .failOffsetY([-12, 12])
      .onBegin((event) => updateFromX(event.x))
      .onUpdate((event) => updateFromX(event.x));
    const tap = Gesture.Tap().runOnJS(true).maxDuration(260).onEnd((event, success) => {
      if (success) updateFromX(event.x);
    });
    return Gesture.Race(pan, tap);
  }, [max, min, onChange, step, trackWidth]);

  const fillStyle = useAnimatedStyle(() => ({ width: progress.value * trackWidth }));
  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: progress.value * Math.max(0, trackWidth - 20) }] }));

  const adjust = (direction: number) => onChange(Math.max(min, Math.min(max, value + direction * step)));

  return (
    <View style={styles.sliderGroup}>
      <View style={styles.sliderHeader}>
        <Text style={[styles.sliderLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.sliderValue, { color: colors.green }]}>{valueText}</Text>
      </View>
      <GestureDetector gesture={gesture}>
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={label}
          accessibilityValue={{ min, max, now: value, text: valueText }}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={(event) => adjust(event.nativeEvent.actionName === "increment" ? 1 : -1)}
          onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
          style={styles.sliderTouchArea}
        >
          <View style={[styles.sliderTrack, { backgroundColor: colors.surfaceRaised }]}>
            <Animated.View style={[styles.sliderFill, { backgroundColor: colors.green }, fillStyle]} />
            <Animated.View style={[styles.sliderThumb, { backgroundColor: colors.text, borderColor: colors.background }, thumbStyle]} />
          </View>
        </View>
      </GestureDetector>
    </View>
  );
}

function ChoiceGroup({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.choiceGroup}>
      <Text style={[styles.choiceLabel, { color: colors.text }]}>{label}</Text>
      <View style={styles.chips}>
        {options.map((option) => {
          const selected = value === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option)}
              style={({ pressed }) => [styles.chip, { backgroundColor: selected ? colors.green : colors.surfaceRaised, borderColor: selected ? colors.green : colors.border }, pressed && styles.pressed]}
            >
              <Text style={[styles.chipText, { color: selected ? "#17310b" : colors.muted }]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function MissionScreen() {
  const { colors } = useTheme();
  const [distance, setDistance] = useState(500);
  const [minutes, setMinutes] = useState(10);
  const [points, setPoints] = useState(10);
  const [category, setCategory] = useState("전체");
  const [difficulty, setDifficulty] = useState("전체");
  const [filterOpen, setFilterOpen] = useState(true);
  const [sortMode, setSortMode] = useState<(typeof sortOptions)[number]["id"]>("distance");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedMission, setSelectedMission] = useState<string | null>(null);

  const visibleMissions = useMemo(() => {
    const difficultyRank = { "쉬움": 0, "보통": 1, "어려움": 2 } as const;
    return missions.filter((mission) => (
      (distance === DISTANCE_ANY || mission.distance <= distance)
      && (minutes === TIME_ANY || mission.minutes <= minutes)
      && (points === POINTS_ANY || mission.points >= points)
      && (category === "전체" || mission.category === category)
      && (difficulty === "전체" || mission.difficulty === difficulty)
    )).sort((a, b) => {
      if (sortMode === "points") return b.points - a.points;
      if (sortMode === "time") return a.minutes - b.minutes;
      if (sortMode === "difficulty") return difficultyRank[a.difficulty as keyof typeof difficultyRank] - difficultyRank[b.difficulty as keyof typeof difficultyRank];
      return a.distance - b.distance;
    });
  }, [category, difficulty, distance, minutes, points, sortMode]);

  return (
    <ScreenSurface keyboardShouldPersistTaps="handled">
      <AppHeader title="미션" />
      <View style={styles.intro}>
        <Text style={[styles.title, { color: colors.text }]}>내 주변 미션</Text>
        <Text style={[styles.description, { color: colors.muted }]}>거리와 조건을 조정해 지금 참여하기 좋은 미션만 모아봐요.</Text>
      </View>

      <SurfaceCard style={styles.filterCard}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: filterOpen }} onPress={() => setFilterOpen((current) => !current)} style={({ pressed }) => [styles.filterHeader, pressed && styles.pressed]}>
          <View style={[styles.filterIcon, { backgroundColor: colors.greenSoft }]}><Ionicons name="options-outline" size={20} color="#17310b" /></View>
          <View style={styles.filterCopy}>
            <Text style={[styles.filterTitle, { color: colors.text }]}>미션 필터</Text>
            <Text style={[styles.filterSummary, { color: colors.muted }]}>{distance === DISTANCE_ANY ? "거리 상관없음" : `${distance}m 이내`} · {minutes === TIME_ANY ? "시간 상관없음" : `${minutes}분 이내`} · {points === POINTS_ANY ? "포인트 상관없음" : `${points}P 이상`}</Text>
          </View>
          <Text style={[styles.resultCount, { color: colors.green }]}>{visibleMissions.length}개</Text>
          <Ionicons name={filterOpen ? "chevron-up" : "chevron-down"} size={18} color={colors.muted} />
        </Pressable>

        {filterOpen ? <View>
          <ChoiceGroup label="카테고리" options={categories} value={category} onChange={setCategory} />
          <ChoiceGroup label="난이도" options={difficulties} value={difficulty} onChange={setDifficulty} />
          <RangeSlider label="최대 거리" min={50} max={DISTANCE_ANY} step={50} value={distance} valueText={distance === DISTANCE_ANY ? "상관없음" : `${distance}m`} onChange={setDistance} />
          <RangeSlider label="최대 시간" min={1} max={TIME_ANY} step={1} value={minutes} valueText={minutes === TIME_ANY ? "상관없음" : `${minutes}분`} onChange={setMinutes} />
          <RangeSlider label="최소 포인트" min={1} max={POINTS_ANY} step={1} value={points} valueText={points === POINTS_ANY ? "상관없음" : `${points}P`} onChange={setPoints} />
        </View> : null}
      </SurfaceCard>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>조건에 맞는 미션</Text>
        <View style={[styles.viewToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {([{ id: "list", label: "목록", icon: "list-outline" }, { id: "map", label: "지도", icon: "map-outline" }] as const).map((option) => {
            const selected = viewMode === option.id;
            return <Pressable key={option.id} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setViewMode(option.id)} style={[styles.viewOption, selected && { backgroundColor: colors.green }]}><Ionicons name={option.icon} size={14} color={selected ? "#17310b" : colors.muted} /><Text style={[styles.viewOptionText, { color: selected ? "#17310b" : colors.muted }]}>{option.label}</Text></Pressable>;
          })}
        </View>
      </View>

      {viewMode === "list" ? <View style={styles.sortRow}>
        {sortOptions.map((option) => {
          const selected = sortMode === option.id;
          return <Pressable key={option.id} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setSortMode(option.id)} style={[styles.sortChip, { backgroundColor: selected ? colors.greenSoft : colors.surface, borderColor: selected ? colors.green : colors.border }]}><Text style={[styles.sortChipText, { color: selected ? "#17310b" : colors.muted }]}>{option.label}</Text></Pressable>;
        })}
      </View> : null}

      {viewMode === "map" ? (
        <SurfaceCard style={styles.mapPlaceholder}>
          <View style={[styles.mapPlaceholderIcon, { backgroundColor: colors.greenSoft }]}><Ionicons name="map-outline" size={27} color="#17310b" /></View>
          <Text style={[styles.mapPlaceholderTitle, { color: colors.text }]}>지도 보기를 준비하고 있어요</Text>
          <Text style={[styles.mapPlaceholderCopy, { color: colors.muted }]}>현재 필터에 맞는 미션 {visibleMissions.length}개의 위치를 지도에서 확인할 수 있게 연결될 예정이에요.</Text>
          <View style={[styles.gestureHint, { backgroundColor: colors.surfaceRaised }]}><Ionicons name="hand-left-outline" size={17} color={colors.green} /><Text style={[styles.gestureHintText, { color: colors.muted }]}>지도에서는 두 손가락 확대를 우선하고, 세로 스크롤은 화면 이동에 사용해요.</Text></View>
        </SurfaceCard>
      ) : visibleMissions.length > 0 ? visibleMissions.map((mission) => {
        const selected = selectedMission === mission.id;
        const titleSize = mission.title.length > 25 ? 15 : mission.title.length > 18 ? 16 : 18;
        return (
          <Pressable key={mission.id} onPress={() => setSelectedMission(mission.id)} style={({ pressed }) => pressed && styles.pressed}>
            <SurfaceCard style={[styles.missionCard, selected && { borderColor: colors.green }]}>
              <View style={[styles.missionIcon, { backgroundColor: colors.greenSoft }]}><Ionicons name={mission.icon} size={23} color="#17310b" /></View>
              <View style={styles.missionCopy}>
                <View style={styles.missionTopline}>
                  <Text style={[styles.missionCategory, { color: colors.green }]}>{mission.category} · {mission.difficulty}</Text>
                  <Text style={[styles.missionPoints, { color: colors.orange }]}>★ {mission.points}P</Text>
                </View>
                <Text numberOfLines={2} style={[styles.missionTitle, { color: colors.text, fontSize: titleSize, lineHeight: titleSize + 5 }]}>{mission.title}</Text>
                <Text style={[styles.missionMeta, { color: colors.muted }]}>{mission.distance}m · 약 {mission.minutes}분</Text>
              </View>
              <View style={[styles.selectButton, { backgroundColor: selected ? colors.green : colors.surfaceRaised }]}>
                <Ionicons name={selected ? "checkmark" : "arrow-forward"} size={17} color={selected ? "#17310b" : colors.text} />
              </View>
            </SurfaceCard>
          </Pressable>
        );
      }) : (
        <SurfaceCard style={styles.emptyCard}>
          <Ionicons name="search-outline" size={24} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>조건에 맞는 미션이 없어요</Text>
          <Text style={[styles.emptyCopy, { color: colors.muted }]}>거리나 시간을 조금 늘려보세요.</Text>
        </SurfaceCard>
      )}

      <View style={styles.rewardStrip}>
        <Ionicons name="gift-outline" size={17} color={colors.green} />
        <Text style={[styles.rewardText, { color: colors.muted }]}>완료 포인트는 기프티콘·프로필 장식·근처 가게 할인에 사용할 수 있어요.</Text>
      </View>
    </ScreenSurface>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: 17, marginTop: 4 },
  title: { fontFamily: "WantedSansB", fontSize: 23, letterSpacing: -0.7 },
  description: { fontFamily: "WantedSansR", fontSize: 12, lineHeight: 18, marginTop: 6 },
  filterCard: { padding: 15 },
  filterHeader: { alignItems: "center", flexDirection: "row" },
  filterIcon: { alignItems: "center", borderRadius: 13, height: 42, justifyContent: "center", width: 42 },
  filterCopy: { flex: 1, marginLeft: 11 },
  filterTitle: { fontFamily: "WantedSansB", fontSize: 16 },
  filterSummary: { fontFamily: "WantedSansR", fontSize: 10, marginTop: 3 },
  resultCount: { fontFamily: "WantedSansB", fontSize: 13, marginRight: 7 },
  choiceGroup: { marginTop: 17 },
  choiceLabel: { fontFamily: "WantedSansB", fontSize: 12, marginBottom: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  chipText: { fontFamily: "WantedSansB", fontSize: 10 },
  sliderGroup: { marginTop: 18 },
  sliderHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  sliderLabel: { fontFamily: "WantedSansB", fontSize: 12 },
  sliderValue: { fontFamily: "WantedSansB", fontSize: 12 },
  sliderTouchArea: { height: 30, justifyContent: "center", marginTop: 3 },
  sliderTrack: { borderRadius: 999, height: 5, overflow: "visible" },
  sliderFill: { borderRadius: 999, height: 5 },
  sliderThumb: { borderRadius: 999, borderWidth: 3, height: 20, left: 0, position: "absolute", top: -7.5, width: 20 },
  sectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 2, marginTop: 24 },
  sectionTitle: { fontFamily: "WantedSansB", fontSize: 19 },
  viewToggle: { borderRadius: 999, borderWidth: 1, flexDirection: "row", padding: 3 },
  viewOption: { alignItems: "center", borderRadius: 999, flexDirection: "row", gap: 4, paddingHorizontal: 9, paddingVertical: 6 },
  viewOptionText: { fontFamily: "WantedSansB", fontSize: 9 },
  sortRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 2, marginTop: 10 },
  sortChip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 7 },
  sortChipText: { fontFamily: "WantedSansB", fontSize: 9 },
  missionCard: { alignItems: "center", flexDirection: "row", marginTop: 10, minHeight: 106, padding: 13 },
  missionIcon: { alignItems: "center", borderRadius: 15, height: 52, justifyContent: "center", width: 52 },
  missionCopy: { flex: 1, marginLeft: 12, minWidth: 0 },
  missionTopline: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  missionCategory: { fontFamily: "WantedSansB", fontSize: 10 },
  missionPoints: { fontFamily: "WantedSansB", fontSize: 11 },
  missionTitle: { fontFamily: "WantedSansB", letterSpacing: -0.4, marginTop: 5 },
  missionMeta: { fontFamily: "WantedSansR", fontSize: 10, marginTop: 5 },
  selectButton: { alignItems: "center", borderRadius: 999, height: 34, justifyContent: "center", marginLeft: 8, width: 34 },
  emptyCard: { alignItems: "center", marginTop: 10, paddingVertical: 28 },
  emptyTitle: { fontFamily: "WantedSansB", fontSize: 14, marginTop: 10 },
  emptyCopy: { fontFamily: "WantedSansR", fontSize: 11, marginTop: 4 },
  mapPlaceholder: { alignItems: "center", marginTop: 12, paddingHorizontal: 24, paddingVertical: 28 },
  mapPlaceholderIcon: { alignItems: "center", borderRadius: 17, height: 58, justifyContent: "center", width: 58 },
  mapPlaceholderTitle: { fontFamily: "WantedSansB", fontSize: 16, marginTop: 13 },
  mapPlaceholderCopy: { fontFamily: "WantedSansR", fontSize: 11, lineHeight: 17, marginTop: 6, textAlign: "center" },
  gestureHint: { alignItems: "center", borderRadius: 13, flexDirection: "row", gap: 7, marginTop: 15, paddingHorizontal: 11, paddingVertical: 10 },
  gestureHintText: { flex: 1, fontFamily: "WantedSansR", fontSize: 9, lineHeight: 14 },
  rewardStrip: { alignItems: "center", flexDirection: "row", gap: 7, marginTop: 15, paddingHorizontal: 3 },
  rewardText: { flex: 1, fontFamily: "WantedSansR", fontSize: 10, lineHeight: 15 },
  pressed: { opacity: 0.72 },
});
