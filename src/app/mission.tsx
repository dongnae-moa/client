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
import { ApiError } from "../api/client";
import {
  joinQuest,
  type Participation,
} from "../api/participations";
import { getQuests } from "../api/quests";
import { useAuth } from "../auth/AuthContext";
import { useNavBarHeight } from "../components/FloatingNavBar";
import MissionComposer from "../components/MissionComposer";
import MissionDetailSheet from "../components/MissionDetailSheet";
import MissionFilterPanel from "../components/MissionFilterPanel";
import MissionMap from "../components/MissionMap";
import MissionProofComposer from "../components/MissionProofComposer";
import {
  countActiveFilters,
  DEFAULT_FILTERS,
  excludeMissionsCreatedByUser,
  filterMissions,
  formatDistance,
  statusFilters,
  statusMeta,
  summarizeFilters,
  type Mission,
  type MissionFilters,
} from "../data/missions";
import { getSavedMissionIds, toggleMissionSaved } from "../data/savedMissions";
import {
  getStoredParticipations,
  storeParticipation,
  type ParticipationByQuest,
} from "../data/participationStore";
import { useCurrentLocation } from "../hooks/useCurrentLocation";
import { useTheme } from "../theme/ThemeContext";

/** 구글 로고·내 위치 버튼이 네비바나 상세 시트에 딱 붙지 않도록 두는 여유 간격(dp). */
const MAP_CONTROL_GAP = 12;

/** 미션 만들기 버튼 높이. 빈 결과 안내를 이 버튼 위로 올릴 때 쓴다. */
const CREATE_FAB_HEIGHT = 46;

export default function MissionScreen() {
  const insets = useSafeAreaInsets();
  const navBarHeight = useNavBarHeight();
  const { colors, mode } = useTheme();
  const { user } = useAuth();
  const { height: screenHeight } = useWindowDimensions();

  // 모든 탭이 앱 시작 시 함께 마운트되므로(_layout.tsx의 lazy: false),
  // 이 탭을 처음 열 때까지 위치 권한 요청과 네이티브 지도 생성을 미룬다.
  const [activated, setActivated] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  useFocusEffect(
    useCallback(() => {
      setActivated(true);
      void getSavedMissionIds().then(setSavedIds);
    }, []),
  );
  const { coords, origin, hasPermission, settled } =
    useCurrentLocation(activated);

  const [filters, setFilters] = useState<MissionFilters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [participations, setParticipations] =
    useState<ParticipationByQuest>({});
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [participationError, setParticipationError] = useState<string | null>(
    null,
  );
  const [proofOpen, setProofOpen] = useState(false);
  const [focusRequest, setFocusRequest] = useState(0);
  const [barHeight, setBarHeight] = useState(0);
  const [chipsHeight, setChipsHeight] = useState(0);
  const [noticeHeight, setNoticeHeight] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [composerOpen, setComposerOpen] = useState(false);
  const [createdNotice, setCreatedNotice] = useState<string | null>(null);

  // 등록 안내는 잠깐만 띄운다.
  useEffect(() => {
    if (!createdNotice) return;
    const timer = setTimeout(() => setCreatedNotice(null), 2600);
    return () => clearTimeout(timer);
  }, [createdNotice]);

  // 상단바에서 "항상 보이는" 부분의 높이. 펼쳐진 필터 패널은 지도 위에 겹치기만 하고
  // 여기에 넣지 않는다. 상·하 패딩 합이 화면 높이에 가까워지면 지도 카메라가 튄다.
  const noticeVisible = settled && !hasPermission;
  const topBarHeight =
    insets.top +
    6 +
    barHeight +
    chipsHeight +
    (noticeVisible ? noticeHeight : 0);

  const [allMissions, setAllMissions] = useState<Mission[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const neighborhoodId = user?.neighborhoodId ?? null;
  const userId = user?.userId ?? null;

  useFocusEffect(
    useCallback(() => {
      if (userId == null) {
        setParticipations({});
        return;
      }
      let active = true;
      void getStoredParticipations(userId).then((stored) => {
        if (active) setParticipations(stored);
      });
      return () => {
        active = false;
      };
    }, [userId]),
  );

  /**
   * 동네 퀘스트 목록을 서버에서 가져온다. 거리 계산과 가까운 순 정렬은 서버가 해준다.
   *
   * 위치를 못 구했으면 기준 좌표(origin)를 그대로 넘긴다. 거리 표시가 기준점에 따라 달라질 뿐
   * 목록 자체는 볼 수 있어야 하기 때문이다. 미션 등록과 달리 좌표가 정확하지 않아도
   * 서버 데이터가 망가지지 않는다.
   */
  const loadMissions = useCallback(async () => {
    if (neighborhoodId == null) {
      setAllMissions([]);
      setLoadError("동네를 먼저 설정하면 주변 미션을 볼 수 있어요.");
      return;
    }
    try {
      const items = await getQuests({
        neighborhoodId,
        latitude: origin.latitude,
        longitude: origin.longitude,
      });
      setAllMissions(items);
      setLoadError(null);
    } catch (requestError) {
      // DEBUG: 실패 원인을 콘솔에도 남긴다.
      console.log("[mission] ✗ 목록 조회 실패", requestError);
      setAllMissions([]);
      setLoadError(
        requestError instanceof ApiError
          ? `${requestError.message} (HTTP ${requestError.status})`
          : `미션을 불러오지 못했어요: ${
              (requestError as Error)?.message ?? "알 수 없는 오류"
            }`,
      );
    }
  }, [neighborhoodId, origin.latitude, origin.longitude]);

  // 탭을 열 때마다, 그리고 동네·기준 좌표가 바뀔 때마다 다시 불러온다.
  useFocusEffect(
    useCallback(() => {
      void loadMissions();
    }, [loadMissions]),
  );

  const missions = useMemo(
    () =>
      excludeMissionsCreatedByUser(
        filterMissions(allMissions, filters),
        user?.nickname,
      ),
    [allMissions, filters, user?.nickname],
  );
  const activeFilterCount = countActiveFilters(filters);
  const selectedMission =
    missions.find((mission) => mission.id === selectedId) ?? null;
  const selectedParticipation = selectedMission
    ? participations[selectedMission.id] ?? null
    : null;

  // 필터를 조이다가 열려 있던 미션이 목록에서 빠지면 상세도 닫는다.
  useEffect(() => {
    if (selectedId && !missions.some((mission) => mission.id === selectedId)) {
      setProofOpen(false);
      setParticipationError(null);
      setSelectedId(null);
    }
  }, [missions, selectedId]);

  const updateFilters = useCallback((patch: Partial<MissionFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  const selectMission = useCallback((id: string) => {
    setFilterOpen(false);
    setProofOpen(false);
    setParticipationError(null);
    setSelectedId(id);
  }, []);

  const toggleSaved = useCallback(async (id: string) => {
    setSavedIds(await toggleMissionSaved(id));
  }, []);

  const rememberParticipation = useCallback(
    (participation: Participation) => {
      setParticipations((current) => ({
        ...current,
        [String(participation.questId)]: participation,
      }));
      if (userId != null) {
        void storeParticipation(userId, participation).catch((storageError) =>
          console.log("[participation] ✗ 로컬 상태 저장 실패", storageError),
        );
      }
    },
    [userId],
  );

  const startMission = useCallback(
    async (mission: Mission) => {
      const questId = Number(mission.id);
      if (!Number.isSafeInteger(questId) || questId <= 0) {
        setParticipationError("미션 식별자가 올바르지 않아 시작할 수 없어요.");
        return;
      }
      setJoiningId(mission.id);
      setParticipationError(null);
      try {
        const participation = await joinQuest(questId);
        rememberParticipation(participation);
        setCreatedNotice(`"${mission.title}" 미션을 시작했어요.`);
      } catch (requestError) {
        console.log("[participation] ✗ 미션 시작 실패", requestError);
        setParticipationError(
          requestError instanceof ApiError
            ? `${requestError.message} (HTTP ${requestError.status})`
            : `미션을 시작하지 못했어요: ${
                (requestError as Error)?.message ?? "알 수 없는 오류"
              }`,
        );
      } finally {
        setJoiningId(null);
      }
    },
    [rememberParticipation],
  );

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
              const participation = participations[mission.id] ?? null;
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
                        <View style={styles.missionPointActions}>
                          <Text
                            style={[
                              styles.missionPoints,
                              { color: colors.orange },
                            ]}
                          >
                            ★ {mission.rewardPoint}P
                          </Text>
                          <Pressable
                            accessibilityLabel={`${mission.title} ${savedIds.includes(mission.id) ? "저장 해제" : "저장"}`}
                            onPress={(event) => {
                              event.stopPropagation();
                              void toggleSaved(mission.id);
                            }}
                            hitSlop={8}
                            style={[
                              styles.saveButton,
                              {
                                backgroundColor: savedIds.includes(mission.id)
                                  ? colors.greenSoft
                                  : colors.surfaceRaised,
                              },
                            ]}
                          >
                            <Ionicons
                              name={
                                savedIds.includes(mission.id)
                                  ? "bookmark"
                                  : "bookmark-outline"
                              }
                              size={14}
                              color={
                                savedIds.includes(mission.id)
                                  ? colors.greenInk
                                  : colors.muted
                              }
                            />
                          </Pressable>
                        </View>
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
                        {mission.neighborhood.name} ·{" "}
                        {formatDistance(mission.distanceMeters)} · 약{" "}
                        {mission.minutes}분
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
                            : participation
                              ? colors.greenSoft
                            : colors.surfaceRaised,
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          participation?.status === "JOINED"
                            ? "walk-outline"
                            : participation?.status === "SUBMITTED"
                              ? "time-outline"
                              : participation?.status === "APPROVED"
                                ? "checkmark-circle-outline"
                                : participation?.status === "REJECTED"
                                  ? "alert-circle-outline"
                            : selected
                              ? "checkmark"
                              : "arrow-forward"
                        }
                        size={17}
                        color={
                          selected
                            ? "#17310b"
                            : participation?.status === "REJECTED"
                              ? colors.orange
                              : participation
                                ? colors.greenInk
                                : colors.text
                        }
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

      {/* 미션 만들기: 지도를 가리지 않는 오른쪽 아래 플로팅 버튼.
          상세 시트가 열려 있을 때는 시트와 겹치지 않도록 숨긴다. */}
      {selectedMission ? null : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="미션 만들기"
          onPress={() => {
            setFilterOpen(false);
            setComposerOpen(true);
          }}
          style={({ pressed }) => [
            styles.createFab,
            {
              backgroundColor: colors.green,
              bottom: navBarHeight + MAP_CONTROL_GAP,
            },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="add" size={20} color="#17310b" />
          <Text style={styles.createFabText}>미션 만들기</Text>
        </Pressable>
      )}

      {/* 목록을 못 불러왔을 때. 눌러서 다시 시도한다. */}
      {loadError ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="미션 목록 다시 불러오기"
          onPress={() => {
            void loadMissions();
          }}
          style={({ pressed }) => [
            styles.createdToast,
            {
              backgroundColor: colors.surface,
              borderColor: colors.orange,
              bottom: navBarHeight + MAP_CONTROL_GAP + CREATE_FAB_HEIGHT + 8,
            },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="alert-circle-outline"
            size={17}
            color={colors.orange}
          />
          <Text style={[styles.createdToastText, { color: colors.text }]}>
            {loadError}
          </Text>
          <Ionicons name="refresh" size={15} color={colors.muted} />
        </Pressable>
      ) : null}

      {/* 지도 모드에서 결과가 비었을 때 안내 */}
      {viewMode === "map" && settled && !loadError && missions.length === 0 ? (
        <View
          style={[
            styles.mapEmpty,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              // 만들기 버튼 위로 올려 겹치지 않게 둔다.
              bottom: navBarHeight + MAP_CONTROL_GAP + CREATE_FAB_HEIGHT + 8,
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
          participation={selectedParticipation}
          joining={joiningId === selectedMission.id}
          actionError={participationError}
          onStart={() => void startMission(selectedMission)}
          onOpenProof={() => setProofOpen(true)}
          onClose={() => {
            setProofOpen(false);
            setParticipationError(null);
            setSelectedId(null);
          }}
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

      <MissionComposer
        visible={composerOpen}
        neighborhoodName={user?.neighborhoodName}
        onClose={() => setComposerOpen(false)}
        onCreated={(title) => {
          setComposerOpen(false);
          setCreatedNotice(`"${title}" 미션을 등록했어요.`);
          // 방금 만든 미션이 지도와 목록에 바로 보이도록 다시 불러온다.
          void loadMissions();
        }}
      />

      <MissionProofComposer
        visible={proofOpen}
        mission={selectedMission}
        participation={selectedParticipation}
        onClose={() => setProofOpen(false)}
        onSubmitted={(participation) => {
          rememberParticipation(participation);
          setProofOpen(false);
          setCreatedNotice("완료 인증을 제출했어요. 등록자의 검토를 기다려요.");
        }}
      />

      {createdNotice ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="안내 닫기"
          onPress={() => setCreatedNotice(null)}
          style={[
            styles.createdToast,
            {
              backgroundColor: colors.surface,
              borderColor: colors.green,
              bottom: navBarHeight + MAP_CONTROL_GAP,
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={17} color={colors.green} />
          <Text style={[styles.createdToastText, { color: colors.text }]}>
            {createdNotice}
          </Text>
        </Pressable>
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
  createFab: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 5,
    height: CREATE_FAB_HEIGHT,
    paddingHorizontal: 16,
    position: "absolute",
    right: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 26,
  },
  createFabText: { color: "#17310b", fontFamily: "WantedSansB", fontSize: 13 },
  createdToast: {
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
    zIndex: 40,
  },
  createdToastText: { flex: 1, fontFamily: "WantedSansB", fontSize: 11 },
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
  missionPointActions: { alignItems: "center", flexDirection: "row", gap: 6 },
  saveButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 27,
    justifyContent: "center",
    width: 27,
  },
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
