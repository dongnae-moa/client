import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { getQuests } from "../api/quests";
import { useAuth } from "../auth/AuthContext";
import AppHeader from "../components/AppHeader";
import { ScreenSurface, SurfaceCard } from "../components/ScreenSurface";
import type { Mission } from "../data/missions";
import { getSavedMissionIds, setMissionSaved } from "../data/savedMissions";
import { useCurrentLocation } from "../hooks/useCurrentLocation";
import { useTheme } from "../theme/ThemeContext";

export default function SavedMissionsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { origin } = useCurrentLocation(true);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  // 저장 목록은 id만 갖고 있어서, 카드에 보여줄 내용은 동네 퀘스트 목록에서 찾아온다.
  const [neighborhoodMissions, setNeighborhoodMissions] = useState<Mission[]>([]);
  const neighborhoodId = user?.neighborhoodId ?? null;
  useFocusEffect(useCallback(() => {
    void getSavedMissionIds().then(setSavedIds);
    if (neighborhoodId == null) return;
    void getQuests({ neighborhoodId, latitude: origin.latitude, longitude: origin.longitude })
      .then(setNeighborhoodMissions)
      .catch((requestError) => console.log("[saved] ✗ 목록 조회 실패", requestError));
  }, [neighborhoodId, origin.latitude, origin.longitude]));
  const missions = useMemo(() => neighborhoodMissions.filter((mission) => savedIds.includes(mission.id)), [neighborhoodMissions, savedIds]);

  const remove = async (id: string) => {
    setSavedIds(await setMissionSaved(id, false));
  };

  return <ScreenSurface>
    <AppHeader title="저장한 미션" back />
    <View style={styles.summary}><View><Text style={[styles.title, { color: colors.text }]}>나중에 할 미션</Text><Text style={[styles.subtitle, { color: colors.muted }]}>저장한 미션 {missions.length}개를 모아봤어요.</Text></View><View style={[styles.count, { backgroundColor: colors.greenSoft }]}><Text style={[styles.countText, { color: colors.greenInk }]}>{missions.length}</Text></View></View>
    {missions.length === 0 ? <SurfaceCard style={styles.empty}><Ionicons name="bookmark-outline" size={30} color={colors.green} /><Text style={[styles.emptyTitle, { color: colors.text }]}>저장한 미션이 없어요</Text><Text style={[styles.emptyBody, { color: colors.muted }]}>미션 목록에서 북마크를 눌러 여기에 모아보세요.</Text><Pressable onPress={() => router.navigate("/mission")} style={[styles.findButton, { backgroundColor: colors.green }]}><Text style={styles.findButtonText}>미션 둘러보기</Text></Pressable></SurfaceCard> : missions.map((mission) => <Pressable key={mission.id} onPress={() => router.navigate("/mission")} style={({ pressed }) => pressed && styles.pressed}><SurfaceCard style={styles.card}><Image source={mission.imageUrl} style={[styles.image, { backgroundColor: colors.surfaceRaised }]} contentFit="cover" /><View style={styles.copy}><View style={styles.topline}><Text style={[styles.category, { color: colors.greenInk }]}>{mission.neighborhood.name} · {mission.difficulty}</Text><Text style={[styles.points, { color: colors.orange }]}>★ {mission.rewardPoint}P</Text></View><Text numberOfLines={2} style={[styles.missionTitle, { color: colors.text }]}>{mission.title}</Text><Text style={[styles.meta, { color: colors.muted }]}>{mission.distanceMeters}m · 약 {mission.minutes}분</Text></View><Pressable accessibilityLabel={`${mission.title} 저장 해제`} onPress={(event) => { event.stopPropagation(); void remove(mission.id); }} style={[styles.bookmark, { backgroundColor: colors.greenSoft }]}><Ionicons name="bookmark" size={17} color={colors.greenInk} /></Pressable></SurfaceCard></Pressable>)}
  </ScreenSurface>;
}

const styles = StyleSheet.create({
  summary: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  title: { fontFamily: "WantedSansB", fontSize: 22 },
  subtitle: { fontFamily: "WantedSansR", fontSize: 10, marginTop: 4 },
  count: { alignItems: "center", borderRadius: 999, height: 42, justifyContent: "center", width: 42 },
  countText: { fontFamily: "WantedSansB", fontSize: 15 },
  card: { alignItems: "center", flexDirection: "row", marginBottom: 10, padding: 11 },
  image: { borderRadius: 13, height: 82, width: 82 },
  copy: { flex: 1, marginLeft: 11 },
  topline: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  category: { fontFamily: "WantedSansB", fontSize: 9 },
  points: { fontFamily: "WantedSansB", fontSize: 10 },
  missionTitle: { fontFamily: "WantedSansB", fontSize: 13, lineHeight: 18, marginTop: 6 },
  meta: { fontFamily: "WantedSansR", fontSize: 10, marginTop: 5 },
  bookmark: { alignItems: "center", borderRadius: 999, height: 34, justifyContent: "center", marginLeft: 7, width: 34 },
  empty: { alignItems: "center", marginTop: 20, paddingVertical: 30 },
  emptyTitle: { fontFamily: "WantedSansB", fontSize: 15, marginTop: 12 },
  emptyBody: { fontFamily: "WantedSansR", fontSize: 10, marginTop: 5, textAlign: "center" },
  findButton: { borderRadius: 999, marginTop: 16, paddingHorizontal: 16, paddingVertical: 10 },
  findButtonText: { color: "#17310b", fontFamily: "WantedSansB", fontSize: 11 },
  pressed: { opacity: 0.75 },
});
