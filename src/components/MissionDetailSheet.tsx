import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { formatDistance, statusMeta, type Mission } from "../data/missions";
import { useTheme } from "../theme/ThemeContext";

type MissionDetailSheetProps = {
  mission: Mission;
  /** 진행 중으로 표시된 미션인지. */
  started: boolean;
  onToggleStart: () => void;
  onClose: () => void;
  /** 지도에서 위치 보기(목록 모드에서만 노출). */
  onShowOnMap?: () => void;
  /** 네비바 위로 띄울 높이. */
  bottomOffset: number;
  /** 지도를 너무 가리지 않도록 본문에 허용할 최대 높이. */
  maxBodyHeight: number;
  onMeasure: (height: number) => void;
};

/** 지도 핀 또는 목록 카드를 눌렀을 때 아래에서 올라오는 미션 상세. */
export default function MissionDetailSheet({
  mission,
  started,
  onToggleStart,
  onClose,
  onShowOnMap,
  bottomOffset,
  maxBodyHeight,
  onMeasure,
}: MissionDetailSheetProps) {
  const { colors } = useTheme();
  const titleSize = mission.title.length > 25 ? 17 : 19;
  const status = statusMeta[mission.status];
  const statusColor =
    status.tone === "orange"
      ? colors.orange
      : status.tone === "muted"
        ? colors.faint
        : colors.greenInk;

  return (
    <Animated.View
      entering={SlideInDown.duration(240)}
      exiting={SlideOutDown.duration(160)}
      onLayout={(event) => onMeasure(event.nativeEvent.layout.height)}
      style={[styles.sheet, { bottom: bottomOffset }]}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.grabber}>
          <View style={[styles.grabberBar, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.headerRow}>
          <View
            style={[styles.badge, { backgroundColor: colors.surfaceRaised }]}
          >
            <Ionicons name={status.icon} size={13} color={statusColor} />
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {status.label}
            </Text>
            <Text style={[styles.badgeDivider, { color: colors.faint }]}>·</Text>
            <Text style={[styles.badgeText, { color: colors.muted }]}>
              {mission.difficulty}
            </Text>
          </View>
          <Text style={[styles.points, { color: colors.orange }]}>
            ★ {mission.rewardPoint}P
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="상세 닫기"
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => [
              styles.closeButton,
              { backgroundColor: colors.surfaceRaised },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="close" size={16} color={colors.muted} />
          </Pressable>
        </View>

        <ScrollView
          style={{ maxHeight: maxBodyHeight }}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.body}
        >
          <Image
            source={mission.imageUrl}
            style={[styles.hero, { backgroundColor: colors.surfaceRaised }]}
            contentFit="cover"
            transition={180}
            cachePolicy="memory-disk"
            accessibilityLabel={`${mission.title} 현장 사진`}
          />
          <Text
            style={[
              styles.title,
              {
                color: colors.text,
                fontSize: titleSize,
                lineHeight: titleSize + 6,
              },
            ]}
          >
            {mission.title}
          </Text>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={colors.greenInk} />
            <Text style={[styles.metaText, { color: colors.greenInk }]}>
              {mission.neighborhood.sigungu} {mission.neighborhood.name}
            </Text>
            <Text style={[styles.metaDivider, { color: colors.faint }]}>·</Text>
            <Text style={[styles.metaText, { color: colors.muted }]}>
              {formatDistance(mission.distanceMeters)} · 약 {mission.minutes}분
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="person-circle-outline" size={14} color={colors.faint} />
            <Text style={[styles.authorText, { color: colors.muted }]}>
              {mission.authorNickname}님이 올린 미션
            </Text>
          </View>
          <Text style={[styles.summary, { color: colors.muted }]}>
            {mission.description}
          </Text>

          <Text style={[styles.checkTitle, { color: colors.text }]}>
            체크 포인트
          </Text>
          {mission.checkpoints.map((checkpoint) => (
            <View key={checkpoint} style={styles.checkRow}>
              <Ionicons
                name="checkmark-circle-outline"
                size={15}
                color={colors.green}
              />
              <Text style={[styles.checkText, { color: colors.muted }]}>
                {checkpoint}
              </Text>
            </View>
          ))}

          {started ? (
            <View
              style={[
                styles.startedBanner,
                {
                  backgroundColor: colors.greenSoft,
                  borderColor: colors.green,
                },
              ]}
            >
              <Ionicons name="walk-outline" size={15} color="#17310b" />
              <Text style={styles.startedText}>
                진행 중인 미션이에요. 현장에서 체크 포인트를 확인해보세요.
              </Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.actions}>
          {onShowOnMap ? (
            <Pressable
              accessibilityRole="button"
              onPress={onShowOnMap}
              style={({ pressed }) => [
                styles.secondaryButton,
                { borderColor: colors.border },
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="map-outline" size={15} color={colors.text} />
              <Text style={[styles.secondaryText, { color: colors.text }]}>
                지도에서 보기
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={onToggleStart}
            style={({ pressed }) => [
              styles.primaryButton,
              started
                ? { backgroundColor: colors.surfaceRaised }
                : { backgroundColor: colors.green },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.primaryText,
                { color: started ? colors.muted : "#17310b" },
              ]}
            >
              {started ? "진행 취소" : "미션 시작하기"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: { left: 14, position: "absolute", right: 14, zIndex: 30 },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    paddingBottom: 12,
    paddingHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 14,
  },
  grabber: { alignItems: "center", paddingBottom: 4, paddingTop: 8 },
  grabberBar: { borderRadius: 999, height: 4, width: 38 },
  headerRow: { alignItems: "center", flexDirection: "row", gap: 8 },
  badge: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  badgeText: { fontFamily: "WantedSansB", fontSize: 10 },
  badgeDivider: { fontFamily: "WantedSansR", fontSize: 10 },
  points: { flex: 1, fontFamily: "WantedSansB", fontSize: 12 },
  closeButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  body: { paddingBottom: 4, paddingTop: 10 },
  hero: { borderRadius: 14, height: 132, marginBottom: 11, width: "100%" },
  title: { fontFamily: "WantedSansB", letterSpacing: -0.5 },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    marginTop: 7,
  },
  metaText: { fontFamily: "WantedSansB", fontSize: 11 },
  metaDivider: { fontFamily: "WantedSansR", fontSize: 11 },
  authorText: { fontFamily: "WantedSansR", fontSize: 11 },
  summary: { fontFamily: "WantedSansR", fontSize: 12, lineHeight: 18, marginTop: 9 },
  checkTitle: { fontFamily: "WantedSansB", fontSize: 12, marginTop: 14 },
  checkRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 6,
    marginTop: 7,
  },
  checkText: { flex: 1, fontFamily: "WantedSansR", fontSize: 11, lineHeight: 16 },
  startedBanner: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    marginTop: 13,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  startedText: {
    color: "#17310b",
    flex: 1,
    fontFamily: "WantedSansB",
    fontSize: 10,
    lineHeight: 15,
  },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
  secondaryButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  secondaryText: { fontFamily: "WantedSansB", fontSize: 12 },
  primaryButton: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    justifyContent: "center",
    paddingVertical: 12,
  },
  primaryText: { fontFamily: "WantedSansB", fontSize: 13 },
  pressed: { opacity: 0.72 },
});
