import { Ionicons } from "@expo/vector-icons";
import { type Href, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { ApiError } from "../api/client";
import { getQuests } from "../api/quests";
import {
  applyProfileDecoration,
  getMyRewards,
} from "../api/rewards";
import type { RewardRedemption } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import AppHeader from "../components/AppHeader";
import { ScreenSurface, SurfaceCard } from "../components/ScreenSurface";
import {
  DUMMY_ANCHOR,
  excludeMissionsCreatedByUser,
} from "../data/missions";
import { getSavedMissionIds } from "../data/savedMissions";
import { useTheme } from "../theme/ThemeContext";

const activityPeriods = [
  { id: "week", label: "이번 주", values: ["3개", "1건", "45 XP", "120 XP"] },
  {
    id: "month",
    label: "최근 4주",
    values: ["24개", "8건", "73 XP", "240 XP"],
  },
  {
    id: "quarter",
    label: "최근 3개월",
    values: ["61개", "19건", "184 XP", "720 XP"],
  },
] as const;

export default function MyScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, updateUser, refreshProfile } = useAuth();
  const [benefits, setBenefits] = useState<RewardRedemption[]>([]);
  const [benefitError, setBenefitError] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [activityPeriod, setActivityPeriod] = useState<
    (typeof activityPeriods)[number]
  >(activityPeriods[1]);
  const [savedMissionCount, setSavedMissionCount] = useState(0);

  const loadBenefits = useCallback(async () => {
    try {
      // 포인트는 refreshProfile이 /v1/users/me에서 받아 이미 반영한다.
      const [items] = await Promise.all([getMyRewards(), refreshProfile()]);
      setBenefits(items);
      setBenefitError(null);
    } catch (requestError) {
      setBenefitError(
        requestError instanceof ApiError
          ? requestError.message
          : "내 혜택을 불러오지 못했어요.",
      );
    }
  }, [refreshProfile, updateUser]);

  const loadSavedMissionCount = useCallback(async () => {
    if (user?.neighborhoodId == null) {
      setSavedMissionCount(0);
      return;
    }
    try {
      const [savedIds, missions] = await Promise.all([
        getSavedMissionIds(),
        getQuests({
          neighborhoodId: user.neighborhoodId,
          latitude: DUMMY_ANCHOR.latitude,
          longitude: DUMMY_ANCHOR.longitude,
        }),
      ]);
      setSavedMissionCount(
        excludeMissionsCreatedByUser(missions, user.nickname).filter((mission) =>
          savedIds.includes(mission.id),
        ).length,
      );
    } catch (requestError) {
      console.log("[my] ✗ 저장 미션 개수 조회 실패", requestError);
      setSavedMissionCount(0);
    }
  }, [user?.neighborhoodId, user?.nickname]);

  useFocusEffect(
    useCallback(() => {
      void loadBenefits();
      void loadSavedMissionCount();
    }, [loadBenefits, loadSavedMissionCount]),
  );

  const applyDecoration = async (benefit: RewardRedemption) => {
    if (!user) return;
    setApplyingId(benefit.id);
    try {
      const updated = await applyProfileDecoration(benefit.id, user);
      updateUser(updated);
      setBenefitError(null);
    } catch (requestError) {
      setBenefitError(
        requestError instanceof ApiError
          ? requestError.message
          : "프로필 장식을 적용하지 못했어요.",
      );
    } finally {
      setApplyingId(null);
    }
  };

  const shareBenefit = async (benefit: RewardRedemption) => {
    await Share.share({
      message: `동네모아에서 ${benefit.title} 혜택을 선물했어요.\n선물 코드: ${benefit.redemptionCode}\n※ 발표용 데모 혜택이에요.`,
    });
  };

  const stats = [
    {
      icon: "star-outline" as const,
      value: (user?.point ?? 0).toLocaleString(),
      label: "보유 포인트",
      color: colors.orange,
    },
    {
      icon: "checkmark-circle-outline" as const,
      value: "24",
      label: "미션 완료",
      color: colors.green,
    },
    {
      icon: "people-outline" as const,
      value: "12",
      label: "참여 일수",
      color: colors.purple,
    },
    {
      icon: "flame-outline" as const,
      value: "5",
      label: "연속 참여",
      color: colors.orange,
    },
  ];

  return (
    <ScreenSurface>
      <AppHeader title="마이페이지" settings />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="프로필 상세 보기"
        onPress={() => router.push("/profile" as Href)}
        style={({ pressed }) => [
          styles.profile,
          pressed && styles.profilePressed,
        ]}
      >
        <View
          style={[
            styles.avatarRing,
            user?.profileDecorationKey && {
              borderColor: colors.green,
              shadowColor: colors.green,
              shadowOpacity: 0.5,
              shadowRadius: 9,
            },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.greenSoft }]}>
            <Ionicons
              name={
                user?.profileDecorationKey === "community-hero"
                  ? "medal"
                  : "person"
              }
              size={28}
              color={colors.green}
            />
          </View>
          {user?.profileDecorationKey ? (
            <View
              style={[
                styles.decorationBadge,
                { backgroundColor: colors.green },
              ]}
            >
              <Ionicons name="leaf" size={11} color="#17310b" />
            </View>
          ) : null}
        </View>
        <View style={styles.profileCopy}>
          <Text style={[styles.username, { color: colors.text }]}>
            {user?.nickname ?? "동네 주민"}
          </Text>
          <Text style={[styles.location, { color: colors.muted }]}>
            {user?.neighborhoodName ?? "동네 설정 중"} 주민 · Gold
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={19} color={colors.muted} />
      </Pressable>

      <SurfaceCard style={styles.statsCard}>
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View
              key={stat.label}
              style={[
                styles.stat,
                index < 3 && {
                  borderRightColor: colors.border,
                  borderRightWidth: 1,
                },
              ]}
            >
              <Ionicons name={stat.icon} size={20} color={stat.color} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stat.value}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>
      </SurfaceCard>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          내 혜택
        </Text>
        {benefits.length > 0 ? (
          <View
            style={[styles.savedStatus, { backgroundColor: colors.greenSoft }]}
          >
            <Ionicons
              name="checkmark-circle"
              size={12}
              color={colors.greenInk}
            />
            <Text style={[styles.savedStatusText, { color: colors.greenInk }]}>
              {benefits.length}개 저장됨
            </Text>
          </View>
        ) : (
          <Pressable onPress={() => router.navigate("/store")}>
            <Text style={[styles.more, { color: colors.green }]}>
              상점 보기 ›
            </Text>
          </Pressable>
        )}
      </View>
      <SurfaceCard>
        {benefits.length === 0 ? (
          <View style={styles.emptyBenefits}>
            <Ionicons name="gift-outline" size={24} color={colors.green} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              아직 보관한 혜택이 없어요
            </Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              미션 포인트로 첫 혜택을 교환해보세요.
            </Text>
          </View>
        ) : (
          benefits.slice(0, 4).map((benefit, index) => (
            <View
              key={benefit.id}
              style={[
                styles.benefitRow,
                index < Math.min(benefits.length, 4) - 1 && {
                  borderBottomColor: colors.border,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                },
              ]}
            >
              <View
                style={[
                  styles.benefitIcon,
                  {
                    backgroundColor:
                      benefit.type === "PROFILE_DECORATION"
                        ? colors.greenSoft
                        : colors.surfaceRaised,
                  },
                ]}
              >
                <Ionicons
                  name={
                    benefit.type === "PROFILE_DECORATION"
                      ? "leaf-outline"
                      : benefit.type === "GIFTICON"
                        ? "gift-outline"
                        : "storefront-outline"
                  }
                  size={20}
                  color={
                    benefit.type === "PROFILE_DECORATION"
                      ? colors.green
                      : colors.purple
                  }
                />
              </View>
              <View style={styles.benefitCopy}>
                <Text style={[styles.benefitTitle, { color: colors.text }]}>
                  {benefit.title}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.benefitCode, { color: colors.muted }]}
                >
                  선물 코드 · {benefit.redemptionCode}
                </Text>
              </View>
              <View style={styles.benefitActions}>
                {benefit.type === "PROFILE_DECORATION" ? (
                  <Pressable
                    disabled={
                      applyingId === benefit.id ||
                      user?.profileDecorationKey === benefit.decorationKey
                    }
                    onPress={() => {
                      void applyDecoration(benefit);
                    }}
                    style={[
                      styles.applyButton,
                      {
                        backgroundColor:
                          user?.profileDecorationKey === benefit.decorationKey
                            ? colors.surfaceRaised
                            : colors.green,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.applyText,
                        {
                          color:
                            user?.profileDecorationKey === benefit.decorationKey
                              ? colors.muted
                              : "#17310b",
                        },
                      ]}
                    >
                      {user?.profileDecorationKey === benefit.decorationKey
                        ? "적용 중"
                        : applyingId === benefit.id
                          ? "적용 중"
                          : "적용"}
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable
                  accessibilityLabel={`${benefit.title} 선물 코드 보내기`}
                  onPress={() => {
                    void shareBenefit(benefit);
                  }}
                  style={[
                    styles.shareButton,
                    { backgroundColor: colors.surfaceRaised },
                  ]}
                >
                  <Ionicons
                    name="paper-plane-outline"
                    size={15}
                    color={colors.purple}
                  />
                </Pressable>
              </View>
            </View>
          ))
        )}
        {benefitError ? (
          <Text
            accessibilityRole="alert"
            style={[styles.benefitError, { color: colors.orange }]}
          >
            {benefitError}
          </Text>
        ) : null}
      </SurfaceCard>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>배지</Text>
        <Text style={[styles.more, { color: colors.green }]}>더보기 ›</Text>
      </View>
      <SurfaceCard>
        <View style={styles.badges}>
          {["첫 미션", "환경 지킴이", "기록자"].map((badge, index) => (
            <View key={badge} style={styles.badge}>
              <View
                style={[
                  styles.badgeIcon,
                  {
                    backgroundColor:
                      index === 1 ? colors.greenSoft : colors.surfaceRaised,
                  },
                ]}
              >
                <Ionicons
                  name={
                    index === 0 ? "location" : index === 1 ? "leaf" : "camera"
                  }
                  size={24}
                  color={index === 1 ? colors.green : colors.orange}
                />
              </View>
              <Text style={[styles.badgeText, { color: colors.text }]}>
                {badge}
              </Text>
              <Text style={[styles.badgeDate, { color: colors.muted }]}>
                2026.07.{20 + index * 4}
              </Text>
            </View>
          ))}
        </View>
      </SurfaceCard>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          활동 요약
        </Text>
        <Text style={[styles.periodLabel, { color: colors.muted }]}>
          {activityPeriod.label}
        </Text>
      </View>
      <View style={styles.periodChips}>
        {activityPeriods.map((period) => {
          const active = period.id === activityPeriod.id;
          return (
            <Pressable
              key={period.id}
              onPress={() => setActivityPeriod(period)}
              style={[
                styles.periodChip,
                {
                  backgroundColor: active ? colors.green : colors.surface,
                  borderColor: active ? colors.green : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.periodChipText,
                  { color: active ? "#17310b" : colors.text },
                ]}
              >
                {period.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <SurfaceCard>
        <View style={styles.activityRows}>
          {[
            "미션 완료",
            "동네 제보",
            "Community XP 기여",
            "Personal XP 획득",
          ].map((label, index) => (
            <View key={label} style={styles.activityRow}>
              <View style={styles.activityLabel}>
                <Ionicons
                  name={
                    index === 0
                      ? "checkmark-circle-outline"
                      : index === 1
                        ? "megaphone-outline"
                        : index === 2
                          ? "people-outline"
                          : "person-circle-outline"
                  }
                  size={18}
                  color={index === 3 ? colors.purple : colors.green}
                />
                <Text style={[styles.activityText, { color: colors.text }]}>
                  {label}
                </Text>
              </View>
              <Text
                style={[
                  styles.activityValue,
                  { color: index === 3 ? colors.purple : colors.text },
                ]}
              >
                {activityPeriod.values[index]}
              </Text>
            </View>
          ))}
        </View>
      </SurfaceCard>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          내가 저장한 미션
        </Text>
        <Pressable onPress={() => router.push("/saved-missions" as Href)}>
          <Text style={[styles.more, { color: colors.green }]}>
            별도 화면에서 보기 ›
          </Text>
        </Pressable>
      </View>
      <Pressable
        onPress={() => router.push("/saved-missions" as Href)}
        style={({ pressed }) => pressed && styles.profilePressed}
      >
        <SurfaceCard style={styles.savedMissionCard}>
          <View
            style={[styles.savedIcon, { backgroundColor: colors.greenSoft }]}
          >
            <Ionicons name="bookmark" size={20} color={colors.greenInk} />
          </View>
          <View style={styles.savedCopy}>
            <Text style={[styles.savedTitle, { color: colors.text }]}>
              저장한 미션 {savedMissionCount}개
            </Text>
            <Text style={[styles.savedMeta, { color: colors.muted }]}>
              {savedMissionCount > 0
                ? "별도 목록에서 확인하고 관리해요."
                : "미션 목록에서 북마크를 눌러보세요."}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </SurfaceCard>
      </Pressable>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          내가 만든 미션
        </Text>
        <Pressable onPress={() => router.push("/my-missions" as Href)}>
          <Text style={[styles.more, { color: colors.green }]}>
            인증 심사하기 ›
          </Text>
        </Pressable>
      </View>
      <Pressable
        onPress={() => router.push("/my-missions" as Href)}
        style={({ pressed }) => pressed && styles.profilePressed}
      >
        <SurfaceCard style={styles.savedMissionCard}>
          <View
            style={[styles.savedIcon, { backgroundColor: colors.greenSoft }]}
          >
            <Ionicons name="clipboard" size={20} color={colors.greenInk} />
          </View>
          <View style={styles.savedCopy}>
            <Text style={[styles.savedTitle, { color: colors.text }]}>
              들어온 인증 확인하기
            </Text>
            <Text style={[styles.savedMeta, { color: colors.muted }]}>
              내가 올린 미션의 인증을 승인하거나 반려해요.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </SurfaceCard>
      </Pressable>
    </ScreenSurface>
  );
}

const styles = StyleSheet.create({
  profile: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  profilePressed: { opacity: 0.72 },
  avatarRing: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: 999,
    borderWidth: 3,
    height: 68,
    justifyContent: "center",
    width: 68,
  },
  avatar: {
    alignItems: "center",
    borderRadius: 999,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  decorationBadge: {
    alignItems: "center",
    borderRadius: 999,
    bottom: -1,
    height: 22,
    justifyContent: "center",
    position: "absolute",
    right: -2,
    width: 22,
  },
  profileCopy: { flex: 1, marginLeft: 11 },
  username: { fontFamily: "WantedSansB", fontSize: 17 },
  location: { fontFamily: "WantedSansR", fontSize: 11, marginTop: 4 },
  statsCard: { padding: 12 },
  statsGrid: { flexDirection: "row" },
  stat: { alignItems: "center", flex: 1, minHeight: 74, paddingHorizontal: 2 },
  statValue: { fontFamily: "WantedSansB", fontSize: 16, marginTop: 8 },
  statLabel: {
    fontFamily: "WantedSansR",
    fontSize: 9,
    marginTop: 3,
    textAlign: "center",
  },
  sectionHeader: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 22,
    paddingHorizontal: 2,
    marginBottom: 8,
  },
  sectionTitle: { fontFamily: "WantedSansB", fontSize: 18 },
  more: { fontFamily: "WantedSansB", fontSize: 11 },
  savedStatus: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  savedStatusText: { fontFamily: "WantedSansB", fontSize: 8 },
  emptyBenefits: { alignItems: "center", paddingVertical: 10 },
  emptyTitle: { fontFamily: "WantedSansB", fontSize: 12, marginTop: 8 },
  emptyText: { fontFamily: "WantedSansR", fontSize: 9, marginTop: 4 },
  benefitRow: { alignItems: "center", flexDirection: "row", minHeight: 66 },
  benefitIcon: {
    alignItems: "center",
    borderRadius: 13,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  benefitCopy: { flex: 1, marginLeft: 10 },
  benefitTitle: { fontFamily: "WantedSansB", fontSize: 11 },
  benefitCode: { fontFamily: "WantedSansR", fontSize: 8, marginTop: 4 },
  benefitActions: { alignItems: "center", flexDirection: "row", gap: 6 },
  applyButton: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  applyText: { fontFamily: "WantedSansB", fontSize: 9 },
  shareButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 31,
    justifyContent: "center",
    width: 31,
  },
  benefitError: {
    fontFamily: "WantedSansR",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 9,
  },
  badges: { flexDirection: "row", justifyContent: "space-between" },
  badge: { alignItems: "center", flex: 1 },
  badgeIcon: {
    alignItems: "center",
    borderRadius: 999,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  badgeText: { fontFamily: "WantedSansB", fontSize: 10, marginTop: 8 },
  badgeDate: { fontFamily: "WantedSansR", fontSize: 8, marginTop: 3 },
  activityRows: { gap: 16 },
  activityRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  activityLabel: { alignItems: "center", flexDirection: "row", gap: 8 },
  activityText: { fontFamily: "WantedSansR", fontSize: 13 },
  activityValue: { fontFamily: "WantedSansB", fontSize: 13 },
  periodLabel: { fontFamily: "WantedSansR", fontSize: 10 },
  periodChips: { flexDirection: "row", gap: 7, marginBottom: 9, marginTop: 10 },
  periodChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  periodChipText: { fontFamily: "WantedSansB", fontSize: 9 },
  savedMissionCard: { alignItems: "center", flexDirection: "row" },
  savedIcon: {
    alignItems: "center",
    borderRadius: 13,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  savedCopy: { flex: 1, marginLeft: 10 },
  savedTitle: { fontFamily: "WantedSansB", fontSize: 14 },
  savedMeta: { fontFamily: "WantedSansR", fontSize: 11, marginTop: 5 },
});
