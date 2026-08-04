import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavBarHeight } from "../components/FloatingNavBar";
import MissionDetailSheet from "../components/MissionDetailSheet";
import MissionFilterPanel from "../components/MissionFilterPanel";
import MissionMap from "../components/MissionMap";
import {
  buildDummyMissions,
  countActiveFilters,
  DEFAULT_FILTERS,
  filterMissions,
  statusFilters,
  statusMeta,
  summarizeFilters,
  type MissionFilters,
} from "../data/missions";
import { useCurrentLocation } from "../hooks/useCurrentLocation";
import { useTheme } from "../theme/ThemeContext";

/** 구글 로고·내 위치 버튼이 네비바나 상세 시트에 딱 붙지 않도록 두는 여유 간격(dp). */
const MAP_CONTROL_GAP = 12;

export default function MissionScreen() {
  const insets = useSafeAreaInsets();
  const navBarHeight = useNavBarHeight();
  const { colors, mode } = useTheme();
  const { height: screenHeight } = useWindowDimensions();

  // 모든 탭이 앱 시작 시 함께 마운트되므로(_layout.tsx의 lazy: false),
  // 이 탭을 처음 열 때까지 위치 권한 요청과 네이티브 지도 생성을 미룬다.
  const [activated, setActivated] = useState(false);
  useFocusEffect(useCallback(() => setActivated(true), []));
  const { coords, origin, hasPermission, settled } =
    useCurrentLocation(activated);

  const [filters, setFilters] = useState<MissionFilters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [startedId, setStartedId] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState(0);
  const [barHeight, setBarHeight] = useState(0);
  const [chipsHeight, setChipsHeight] = useState(0);
  const [noticeHeight, setNoticeHeight] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(0);

  // 상단바에서 "항상 보이는" 부분의 높이. 펼쳐진 필터 패널은 지도 위에 겹치기만 하고
  // 여기에 넣지 않는다. 상·하 패딩 합이 화면 높이에 가까워지면 지도 카메라가 튄다.
  const noticeVisible = settled && !hasPermission;
  const topBarHeight =
    insets.top +
    6 +
    barHeight +
    chipsHeight +
    (noticeVisible ? noticeHeight : 0);

  // 서버 연동 전까지는 더미 목록을 쓴다. 현재 위치를 기준점으로 넘겨 어디서 앱을 켜도
  // 핀이 내 주변에 찍히게 한다. 실제 API를 붙이면 이 자리에 응답 데이터를 넣으면 된다.
  const allMissions = useMemo(() => buildDummyMissions(origin), [origin]);
  const missions = useMemo(
    () => filterMissions(allMissions, filters),
    [allMissions, filters],
  );
  const activeFilterCount = countActiveFilters(filters);
  const selectedMission =
    missions.find((mission) => mission.id === selectedId) ?? null;

  // 필터를 조이다가 열려 있던 미션이 목록에서 빠지면 상세도 닫는다.
  useEffect(() => {
    if (selectedId && !missions.some((mission) => mission.id === selectedId)) {
      setSelectedId(null);
    }
  }, [missions, selectedId]);

  const updateFilters = useCallback((patch: Partial<MissionFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  const selectMission = useCallback((id: string) => {
    setFilterOpen(false);
    setSelectedId(id);
  }, []);

  // 목록에서 지도로 돌아올 때는 선택해둔 핀을 다시 화면 중앙으로 맞춘다. 목록에 가려진
  // 동안에도 지도는 계속 살아 있어서, 카메라를 옮겨두지 않으면 엉뚱한 곳이 보인다.
  const toggleViewMode = useCallback(() => {
    if (viewMode === "map") {
      setViewMode("list");
      return;
    }
    setViewMode("map");
    setFocusRequest((current) => current + 1);
  }, [viewMode]);

  const sheetReserved = selectedMission ? sheetHeight + 8 : 0;
  // 지도 컨트롤과 카메라 중심이 상단바·네비바·상세 시트를 피하도록 패딩으로 알려준다.
  const mapBottomPadding = navBarHeight + sheetReserved + MAP_CONTROL_GAP;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />

      {activated && settled ? (
        <MissionMap
          missions={missions}
          origin={origin}
          userLocation={coords}
          hasPermission={hasPermission}
          selectedId={selectedId}
          visible={viewMode === "map"}
          focusRequest={focusRequest}
          onSelectMission={selectMission}
          onPressMap={() => {
            setSelectedId(null);
            setFilterOpen(false);
          }}
          topPadding={topBarHeight}
          bottomPadding={mapBottomPadding}
        />
      ) : (
        <View style={styles.loading}>
          {activated ? (
            <>
              <ActivityIndicator size="large" color={colors.green} />
              <Text style={[styles.loadingText, { color: colors.muted }]}>
                주변 미션을 불러오는 중이에요
              </Text>
            </>
          ) : null}
        </View>
      )}

      {viewMode === "list" ? (
        <ScrollView
          style={[styles.listLayer, { backgroundColor: colors.background }]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: navBarHeight + sheetReserved + 20,
            paddingHorizontal: 16,
            paddingTop: topBarHeight + 8,
          }}
        >
          {missions.length > 0 ? (
            missions.map((mission) => {
              const selected = selectedId === mission.id;
              const status = statusMeta[mission.status];
              const titleSize =
                mission.title.length > 25
                  ? 15
                  : mission.title.length > 18
                    ? 16
                    : 18;
              return (
                <Pressable
                  key={mission.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => selectMission(mission.id)}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <View
                    style={[
                      styles.missionCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: selected ? colors.green : colors.border,
                      },
                    ]}
                  >
                    <Image
                      source={mission.imageUrl}
                      style={[
                        styles.missionThumb,
                        { backgroundColor: colors.surfaceRaised },
                      ]}
                      contentFit="cover"
                      transition={180}
                      cachePolicy="memory-disk"
                      accessibilityLabel={`${mission.title} 현장 사진`}
                    />
                    <View style={styles.missionCopy}>
                      <View style={styles.missionTopline}>
                        <View style={styles.missionStatus}>
                          <Ionicons
                            name={status.icon}
                            size={12}
                            color={
                              status.tone === "orange"
                                ? colors.orange
                                : status.tone === "muted"
                                  ? colors.faint
                                  : colors.greenInk
                            }
                          />
                          <Text
                            style={[
                              styles.missionCategory,
                              { color: colors.greenInk },
                            ]}
                          >
                            {status.label} · {mission.difficulty}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.missionPoints,
                            { color: colors.orange },
                          ]}
                        >
                          ★ {mission.rewardPoint}P
                        </Text>
                      </View>
                      <Text
                        numberOfLines={2}
                        style={[
                          styles.missionTitle,
                          {
                            color: colors.text,
                            fontSize: titleSize,
                            lineHeight: titleSize + 5,
                          },
                        ]}
                      >
                        {mission.title}
                      </Text>
                      <Text
                        style={[styles.missionMeta, { color: colors.muted }]}
                      >
                        {mission.neighborhood.name} · {mission.distanceMeters}m
                        · 약 {mission.minutes}분
                      </Text>
                      <Text
                        style={[styles.missionAuthor, { color: colors.faint }]}
                      >
                        {mission.authorNickname}님이 올린 미션
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.selectButton,
                        {
                          backgroundColor: selected
                            ? colors.green
                            : colors.surfaceRaised,
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          startedId === mission.id
                            ? "walk-outline"
                            : selected
                              ? "checkmark"
                              : "arrow-forward"
                        }
                        size={17}
                        color={selected ? "#17310b" : colors.text}
                      />
                    </View>
                  </View>
                </Pressable>
              );
            })
          ) : (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons name="search-outline" size={24} color={colors.muted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                조건에 맞는 미션이 없어요
              </Text>
              <Text style={[styles.emptyCopy, { color: colors.muted }]}>
                거리나 시간을 조금 늘려보세요.
              </Text>
            </View>
          )}

          <View style={styles.rewardStrip}>
            <Ionicons name="gift-outline" size={17} color={colors.green} />
            <Text style={[styles.rewardText, { color: colors.muted }]}>
              완료 포인트는 기프티콘·프로필 장식·근처 가게 할인에 사용할 수
              있어요.
            </Text>
          </View>
        </ScrollView>
      ) : null}

      {/* 상단바: 필터 진입 · 결과 요약 · 목록/지도 전환 */}
      <View
        style={[styles.topBar, { paddingTop: insets.top + 6 }]}
        pointerEvents="box-none"
      >
        <View
          onLayout={(event) => setBarHeight(event.nativeEvent.layout.height)}
          style={[
            styles.bar,
            { backgroundColor: colors.navTint, borderColor: colors.navBorder },
          ]}
        >
          <BlurView
            intensity={72}
            tint={mode}
            style={styles.barBlur}
            pointerEvents="none"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="미션 필터"
            accessibilityState={{ expanded: filterOpen }}
            onPress={() => setFilterOpen((current) => !current)}
            style={({ pressed }) => [
              styles.filterButton,
              {
                backgroundColor:
                  filterOpen || activeFilterCount > 0
                    ? colors.green
                    : colors.surface,
                borderColor:
                  filterOpen || activeFilterCount > 0
                    ? colors.green
                    : colors.border,
              },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="options-outline"
              size={16}
              color={
                filterOpen || activeFilterCount > 0 ? "#17310b" : colors.text
              }
            />
            <Text
              style={[
                styles.filterButtonText,
                {
                  color:
                    filterOpen || activeFilterCount > 0
                      ? "#17310b"
                      : colors.text,
                },
              ]}
            >
              필터
            </Text>
            {activeFilterCount > 0 ? (
              <View style={styles.badge}>
                <Text style={[styles.badgeText, { color: colors.green }]}>
                  {activeFilterCount}
                </Text>
              </View>
            ) : null}
          </Pressable>

          <View style={styles.barCopy}>
            <Text style={[styles.barTitle, { color: colors.text }]}>
              내 주변 미션 {missions.length}개
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.barSummary, { color: colors.muted }]}
            >
              {summarizeFilters(filters)}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              viewMode === "map" ? "목록으로 보기" : "지도로 보기"
            }
            onPress={toggleViewMode}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name={viewMode === "map" ? "list-outline" : "map-outline"}
              size={18}
              color={colors.text}
            />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onLayout={(event) => setChipsHeight(event.nativeEvent.layout.height)}
          contentContainerStyle={styles.categoryRow}
        >
          {statusFilters.map(({ value, label }) => {
            const selected = filters.status === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => updateFilters({ status: value })}
                style={({ pressed }) => [
                  styles.categoryChip,
                  {
                    backgroundColor: selected ? colors.green : colors.surface,
                    borderColor: selected ? colors.green : colors.border,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: selected ? "#17310b" : colors.muted },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {filterOpen ? (
          <MissionFilterPanel
            filters={filters}
            onChange={updateFilters}
            onReset={() => setFilters(DEFAULT_FILTERS)}
            onClose={() => setFilterOpen(false)}
            resultCount={missions.length}
            maxHeight={screenHeight * 0.42}
          />
        ) : null}

        {noticeVisible ? (
          <View
            onLayout={(event) =>
              setNoticeHeight(event.nativeEvent.layout.height + 9)
            }
            style={[
              styles.notice,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={15}
              color={colors.orange}
            />
            <Text style={[styles.noticeText, { color: colors.muted }]}>
              위치 권한을 허용하면 실제 내 주변 미션 위치를 볼 수 있어요.
            </Text>
          </View>
        ) : null}
      </View>

      {/* 지도 모드에서 결과가 비었을 때 안내 */}
      {viewMode === "map" && settled && missions.length === 0 ? (
        <View
          style={[
            styles.mapEmpty,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              bottom: navBarHeight + 8,
            },
          ]}
        >
          <Ionicons name="search-outline" size={17} color={colors.muted} />
          <Text style={[styles.mapEmptyText, { color: colors.muted }]}>
            조건에 맞는 미션이 없어요. 필터를 조정해보세요.
          </Text>
        </View>
      ) : null}

      {selectedMission ? (
        <MissionDetailSheet
          mission={selectedMission}
          started={startedId === selectedMission.id}
          onToggleStart={() =>
            setStartedId((current) =>
              current === selectedMission.id ? null : selectedMission.id,
            )
          }
          onClose={() => setSelectedId(null)}
          onShowOnMap={
            viewMode === "list"
              ? () => {
                  setViewMode("map");
                  setFocusRequest((current) => current + 1);
                }
              : undefined
          }
          bottomOffset={navBarHeight - 4}
          maxBodyHeight={screenHeight * 0.34}
          onMeasure={setSheetHeight}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { alignItems: "center", flex: 1, gap: 12, justifyContent: "center" },
  loadingText: { fontFamily: "WantedSansR", fontSize: 12 },
  listLayer: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 10,
  },
  topBar: {
    left: 0,
    paddingHorizontal: 14,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 20,
  },
  bar: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 9,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 8,
  },
  barBlur: { bottom: 0, left: 0, position: "absolute", right: 0, top: 0 },
  filterButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  filterButtonText: { fontFamily: "WantedSansB", fontSize: 11 },
  badge: {
    alignItems: "center",
    backgroundColor: "#17310b",
    borderRadius: 999,
    height: 16,
    justifyContent: "center",
    minWidth: 16,
    paddingHorizontal: 3,
  },
  badgeText: { fontFamily: "WantedSansB", fontSize: 9 },
  barCopy: { flex: 1, minWidth: 0 },
  barTitle: { fontFamily: "WantedSansB", fontSize: 13 },
  barSummary: { fontFamily: "WantedSansR", fontSize: 9, marginTop: 2 },
  iconButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  categoryRow: { gap: 7, paddingRight: 4, paddingTop: 9 },
  categoryChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryChipText: { fontFamily: "WantedSansB", fontSize: 11 },
  notice: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    marginTop: 9,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  noticeText: {
    flex: 1,
    fontFamily: "WantedSansR",
    fontSize: 10,
    lineHeight: 15,
  },
  mapEmpty: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    left: 14,
    paddingHorizontal: 13,
    paddingVertical: 12,
    position: "absolute",
    right: 14,
    zIndex: 25,
  },
  mapEmptyText: { flex: 1, fontFamily: "WantedSansB", fontSize: 11 },
  missionCard: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 10,
    minHeight: 106,
    padding: 13,
  },
  missionThumb: { borderRadius: 15, height: 62, width: 62 },
  missionCopy: { flex: 1, marginLeft: 12, minWidth: 0 },
  missionTopline: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  missionStatus: { alignItems: "center", flexDirection: "row", gap: 3 },
  missionCategory: { fontFamily: "WantedSansB", fontSize: 10 },
  missionPoints: { fontFamily: "WantedSansB", fontSize: 11 },
  missionTitle: {
    fontFamily: "WantedSansB",
    letterSpacing: -0.4,
    marginTop: 5,
  },
  missionMeta: { fontFamily: "WantedSansR", fontSize: 10, marginTop: 5 },
  missionAuthor: { fontFamily: "WantedSansR", fontSize: 9, marginTop: 3 },
  selectButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    marginLeft: 8,
    width: 34,
  },
  emptyCard: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 10,
    paddingVertical: 28,
  },
  emptyTitle: { fontFamily: "WantedSansB", fontSize: 14, marginTop: 10 },
  emptyCopy: { fontFamily: "WantedSansR", fontSize: 11, marginTop: 4 },
  rewardStrip: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
    marginTop: 15,
    paddingHorizontal: 3,
  },
  rewardText: {
    flex: 1,
    fontFamily: "WantedSansR",
    fontSize: 10,
    lineHeight: 15,
  },
  pressed: { opacity: 0.72 },
});
