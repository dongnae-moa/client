import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";

export type OnboardingVisualKind = "nearby" | "verify" | "rewards" | "impact";

export function OnboardingVisual({ kind }: { kind: OnboardingVisualKind }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.frame, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.appTop, { borderBottomColor: colors.border }]}>
        <View style={[styles.appDot, { backgroundColor: colors.green }]} />
        <Text style={[styles.appTitle, { color: colors.text }]}>동네모아</Text>
        <Ionicons name="ellipsis-horizontal" size={15} color={colors.muted} />
      </View>
      {kind === "nearby" ? <NearbyVisual /> : null}
      {kind === "verify" ? <VerifyVisual /> : null}
      {kind === "rewards" ? <RewardsVisual /> : null}
      {kind === "impact" ? <ImpactVisual /> : null}
    </View>
  );
}

function Chip({ icon, label, active = false }: { icon?: keyof typeof Ionicons.glyphMap; label: string; active?: boolean }) {
  const { colors } = useTheme();
  return <View style={[styles.chip, { backgroundColor: active ? colors.green : colors.surfaceRaised, borderColor: active ? colors.green : colors.border }]}>{icon ? <Ionicons name={icon} size={10} color={active ? "#17310b" : colors.muted} /> : null}<Text style={[styles.chipText, { color: active ? "#17310b" : colors.muted }]}>{label}</Text></View>;
}

function NearbyVisual() {
  const { colors } = useTheme();
  return <View style={styles.scene}>
    <View style={styles.chipRow}><Chip label="500m" active /><Chip label="환경" /><Chip icon="options-outline" label="필터" /></View>
    <View style={[styles.map, { backgroundColor: colors.surfaceRaised }]}>
      <View style={[styles.road, styles.roadA, { backgroundColor: colors.border }]} /><View style={[styles.road, styles.roadB, { backgroundColor: colors.border }]} /><View style={[styles.road, styles.roadC, { backgroundColor: colors.border }]} />
      <View style={[styles.block, styles.blockA, { backgroundColor: colors.surface }]} /><View style={[styles.block, styles.blockB, { backgroundColor: colors.surface }]} /><View style={[styles.block, styles.blockC, { backgroundColor: colors.surface }]} />
      <View style={[styles.pin, styles.pinA, { backgroundColor: colors.purple }]}><Ionicons name="leaf" size={12} color="#fff" /></View>
      <View style={[styles.pin, styles.pinB, { backgroundColor: colors.green }]}><Ionicons name="bicycle" size={13} color="#17310b" /></View>
      <View style={[styles.pin, styles.pinC, { backgroundColor: colors.orange }]}><Ionicons name="alert" size={12} color="#2b1b00" /></View>
      <View style={[styles.myLocation, { borderColor: colors.green }]}><View style={[styles.myLocationCore, { backgroundColor: colors.green }]} /></View>
    </View>
    <View style={[styles.miniMission, { backgroundColor: colors.background, borderColor: colors.border }]}><View style={[styles.miniMissionIcon, { backgroundColor: colors.greenSoft }]}><Ionicons name="bicycle" size={17} color={colors.green} /></View><View style={styles.flex}><Text style={[styles.miniLabel, { color: colors.green }]}>가장 가까운 미션</Text><Text style={[styles.miniTitle, { color: colors.text }]}>공유자전거 이동하기</Text><Text style={[styles.miniMeta, { color: colors.muted }]}>20m · 약 3분 · 20P</Text></View><Ionicons name="arrow-forward-circle" size={24} color={colors.green} /></View>
  </View>;
}

function VerifyVisual() {
  const { colors } = useTheme();
  return <View style={styles.scene}>
    <View style={styles.sceneHeading}><View><Text style={[styles.miniLabel, { color: colors.green }]}>미션 인증</Text><Text style={[styles.sceneTitle, { color: colors.text }]}>사진으로 변화를 남겨요</Text></View><View style={[styles.stepPill, { backgroundColor: colors.greenSoft }]}><Text style={[styles.stepPillText, { color: colors.green }]}>2/3</Text></View></View>
    <View style={[styles.photoCard, { borderColor: colors.border }]}><Image source={require("@/assets/images/omg.png")} style={styles.photo} contentFit="cover" /><View style={[styles.photoLabel, { backgroundColor: colors.background }]}><Ionicons name="camera" size={12} color={colors.green} /><Text style={[styles.photoLabelText, { color: colors.text }]}>현장 사진</Text></View><View style={[styles.shutter, { backgroundColor: colors.green }]}><Ionicons name="checkmark" size={17} color="#17310b" /></View></View>
    <View style={[styles.reviewCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}><View style={styles.reviewAvatars}>{["person", "person", "person"].map((icon, index) => <View key={index} style={[styles.reviewer, { backgroundColor: index === 1 ? colors.purple : colors.greenSoft, borderColor: colors.surfaceRaised }]}><Ionicons name={icon as "person"} size={11} color={index === 1 ? "#fff" : colors.green} /></View>)}</View><View style={styles.flex}><Text style={[styles.miniTitle, { color: colors.text }]}>이웃 검토 완료</Text><Text style={[styles.miniMeta, { color: colors.muted }]}>사진을 확인한 이웃 3명</Text></View><Ionicons name="shield-checkmark" size={22} color={colors.green} /></View>
  </View>;
}

function RewardsVisual() {
  const { colors } = useTheme();
  const rewards = [
    { icon: "gift-outline" as const, label: "기프티콘", color: colors.orange },
    { icon: "storefront-outline" as const, label: "동네 할인", color: colors.purple },
    { icon: "leaf-outline" as const, label: "프로필 장식", color: colors.green },
  ];
  return <View style={styles.scene}>
    <View style={[styles.balancePreview, { backgroundColor: colors.greenSoft }]}><View><Text style={[styles.balanceLabel, { color: colors.muted }]}>사용 가능한 포인트</Text><Text style={[styles.balanceValue, { color: colors.text }]}>1,250 <Text style={{ color: colors.green, fontSize: 12 }}>P</Text></Text></View><View style={[styles.balanceGift, { backgroundColor: colors.green }]}><Ionicons name="sparkles" size={19} color="#17310b" /></View></View>
    <Text style={[styles.rewardsHeading, { color: colors.text }]}>원하는 혜택을 골라요</Text>
    <View style={styles.rewardRow}>{rewards.map((reward) => <View key={reward.label} style={[styles.rewardMini, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}><View style={[styles.rewardMiniIcon, { backgroundColor: reward.color + "22" }]}><Ionicons name={reward.icon} size={20} color={reward.color} /></View><Text style={[styles.rewardMiniLabel, { color: colors.text }]}>{reward.label}</Text></View>)}</View>
    <View style={[styles.savedBenefit, { backgroundColor: colors.background, borderColor: colors.border }]}><Ionicons name="checkmark-circle" size={21} color={colors.green} /><View style={styles.flex}><Text style={[styles.miniTitle, { color: colors.text }]}>내 혜택에 저장</Text><Text style={[styles.miniMeta, { color: colors.muted }]}>직접 쓰거나 선물할 수 있어요</Text></View><Ionicons name="paper-plane-outline" size={18} color={colors.purple} /></View>
  </View>;
}

function ImpactVisual() {
  const { colors } = useTheme();
  return <View style={styles.scene}>
    <View style={styles.sceneHeading}><View><Text style={[styles.miniLabel, { color: colors.green }]}>COMMUNITY XP</Text><Text style={[styles.sceneTitle, { color: colors.text }]}>우리 동네가 함께 성장해요</Text></View><View style={[styles.rankMini, { backgroundColor: colors.surfaceRaised }]}><Ionicons name="medal" size={13} color={colors.orange} /><Text style={[styles.rankMiniText, { color: colors.text }]}>Gold</Text></View></View>
    <View style={[styles.xpCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}><View style={styles.xpTop}><Text style={[styles.xpValue, { color: colors.text }]}>73<Text style={[styles.xpTotal, { color: colors.muted }]}> /100</Text></Text><Text style={[styles.xpHint, { color: colors.green }]}>다음 배지까지 27 XP</Text></View><View style={[styles.xpTrack, { backgroundColor: colors.border }]}><View style={[styles.xpFill, { backgroundColor: colors.green }]} /></View><View style={styles.contributionRow}>{[{ icon: "checkmark-circle", value: "3", label: "완료" }, { icon: "people", value: "12", label: "이웃" }, { icon: "time", value: "40m", label: "참여" }].map((item) => <View key={item.label} style={styles.contribution}><Ionicons name={item.icon as "time"} size={15} color={colors.purple} /><Text style={[styles.contributionValue, { color: colors.text }]}>{item.value}</Text><Text style={[styles.contributionLabel, { color: colors.muted }]}>{item.label}</Text></View>)}</View></View>
    <View style={styles.badgeRow}>{[{ icon: "leaf", label: "환경 지킴이" }, { icon: "camera", label: "기록자" }, { icon: "people", label: "동네 영웅" }].map((badge, index) => <View key={badge.label} style={styles.badgeMini}><View style={[styles.badgeCircle, { backgroundColor: index === 1 ? colors.surfaceRaised : colors.greenSoft, borderColor: index === 2 ? colors.orange : colors.border }]}><Ionicons name={badge.icon as "leaf"} size={19} color={index === 2 ? colors.orange : colors.green} /></View><Text style={[styles.badgeMiniText, { color: colors.muted }]}>{badge.label}</Text></View>)}</View>
  </View>;
}

const styles = StyleSheet.create({
  frame: { borderRadius: 28, borderWidth: 1, height: 270, overflow: "hidden" },
  appTop: { alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", height: 42, paddingHorizontal: 16 },
  appDot: { borderRadius: 99, height: 8, marginRight: 7, width: 8 },
  appTitle: { flex: 1, fontFamily: "WantedSansB", fontSize: 10 },
  scene: { flex: 1, padding: 14 },
  chipRow: { flexDirection: "row", gap: 6 },
  chip: { alignItems: "center", borderRadius: 99, borderWidth: 1, flexDirection: "row", gap: 4, paddingHorizontal: 9, paddingVertical: 5 },
  chipText: { fontFamily: "WantedSansB", fontSize: 7 },
  map: { borderRadius: 16, flex: 1, marginTop: 9, overflow: "hidden" },
  road: { height: 3, opacity: 0.8, position: "absolute", width: 230 },
  roadA: { left: -20, top: 42, transform: [{ rotate: "10deg" }] },
  roadB: { left: 70, top: 78, transform: [{ rotate: "-38deg" }] },
  roadC: { left: 100, top: 38, transform: [{ rotate: "82deg" }] },
  block: { borderRadius: 5, height: 28, opacity: 0.78, position: "absolute", width: 46 },
  blockA: { left: 20, top: 15 },
  blockB: { right: 26, top: 18 },
  blockC: { left: 102, top: 62 },
  pin: { alignItems: "center", borderRadius: 999, height: 26, justifyContent: "center", position: "absolute", width: 26 },
  pinA: { left: 48, top: 60 },
  pinB: { left: 145, top: 27 },
  pinC: { right: 35, top: 72 },
  myLocation: { alignItems: "center", borderRadius: 999, borderWidth: 2, bottom: 14, height: 22, justifyContent: "center", left: 100, position: "absolute", width: 22 },
  myLocationCore: { borderRadius: 999, height: 8, width: 8 },
  miniMission: { alignItems: "center", borderRadius: 14, borderWidth: 1, bottom: 7, flexDirection: "row", left: 23, padding: 9, position: "absolute", right: 23 },
  miniMissionIcon: { alignItems: "center", borderRadius: 10, height: 36, justifyContent: "center", width: 36 },
  flex: { flex: 1, marginLeft: 9 },
  miniLabel: { fontFamily: "WantedSansB", fontSize: 7 },
  miniTitle: { fontFamily: "WantedSansB", fontSize: 9, marginTop: 2 },
  miniMeta: { fontFamily: "WantedSansR", fontSize: 7, marginTop: 2 },
  sceneHeading: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  sceneTitle: { fontFamily: "WantedSansB", fontSize: 12, marginTop: 3 },
  stepPill: { borderRadius: 99, paddingHorizontal: 9, paddingVertical: 5 },
  stepPillText: { fontFamily: "WantedSansB", fontSize: 8 },
  photoCard: { borderRadius: 16, borderWidth: 1, height: 119, marginTop: 10, overflow: "hidden" },
  photo: { height: "100%", width: "100%" },
  photoLabel: { alignItems: "center", borderRadius: 99, flexDirection: "row", gap: 4, left: 8, paddingHorizontal: 8, paddingVertical: 5, position: "absolute", top: 8 },
  photoLabelText: { fontFamily: "WantedSansB", fontSize: 7 },
  shutter: { alignItems: "center", borderRadius: 999, bottom: 8, height: 30, justifyContent: "center", position: "absolute", right: 9, width: 30 },
  reviewCard: { alignItems: "center", borderRadius: 14, borderWidth: 1, flexDirection: "row", marginTop: 9, minHeight: 48, paddingHorizontal: 10 },
  reviewAvatars: { flexDirection: "row", width: 56 },
  reviewer: { alignItems: "center", borderRadius: 99, borderWidth: 2, height: 25, justifyContent: "center", marginRight: -7, width: 25 },
  balancePreview: { alignItems: "center", borderRadius: 16, flexDirection: "row", justifyContent: "space-between", padding: 13 },
  balanceLabel: { fontFamily: "WantedSansR", fontSize: 7 },
  balanceValue: { fontFamily: "WantedSansB", fontSize: 20, marginTop: 3 },
  balanceGift: { alignItems: "center", borderRadius: 999, height: 38, justifyContent: "center", width: 38 },
  rewardsHeading: { fontFamily: "WantedSansB", fontSize: 10, marginTop: 11 },
  rewardRow: { flexDirection: "row", gap: 7, marginTop: 8 },
  rewardMini: { alignItems: "center", borderRadius: 13, borderWidth: 1, flex: 1, paddingVertical: 9 },
  rewardMiniIcon: { alignItems: "center", borderRadius: 10, height: 32, justifyContent: "center", width: 32 },
  rewardMiniLabel: { fontFamily: "WantedSansB", fontSize: 7, marginTop: 5 },
  savedBenefit: { alignItems: "center", borderRadius: 13, borderWidth: 1, flexDirection: "row", marginTop: 8, padding: 9 },
  rankMini: { alignItems: "center", borderRadius: 99, flexDirection: "row", gap: 4, paddingHorizontal: 8, paddingVertical: 5 },
  rankMiniText: { fontFamily: "WantedSansB", fontSize: 7 },
  xpCard: { borderRadius: 16, borderWidth: 1, marginTop: 12, padding: 12 },
  xpTop: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between" },
  xpValue: { fontFamily: "WantedSansB", fontSize: 19 },
  xpTotal: { fontSize: 8 },
  xpHint: { fontFamily: "WantedSansB", fontSize: 7 },
  xpTrack: { borderRadius: 99, height: 7, marginTop: 9, overflow: "hidden" },
  xpFill: { borderRadius: 99, height: "100%", width: "73%" },
  contributionRow: { flexDirection: "row", marginTop: 12 },
  contribution: { alignItems: "center", flex: 1 },
  contributionValue: { fontFamily: "WantedSansB", fontSize: 10, marginTop: 3 },
  contributionLabel: { fontFamily: "WantedSansR", fontSize: 7, marginTop: 1 },
  badgeRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 12 },
  badgeMini: { alignItems: "center", flex: 1 },
  badgeCircle: { alignItems: "center", borderRadius: 999, borderWidth: 1, height: 38, justifyContent: "center", width: 38 },
  badgeMiniText: { fontFamily: "WantedSansR", fontSize: 6, marginTop: 4 },
});
