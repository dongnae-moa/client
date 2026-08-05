import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "../api/client";
import {
  approveParticipation,
  getQuestParticipations,
  rejectParticipation,
  type Participation,
  type ParticipationStatus,
} from "../api/participations";
import { getQuests } from "../api/quests";
import { useAuth } from "../auth/AuthContext";
import AppHeader from "../components/AppHeader";
import { ScreenSurface, SurfaceCard } from "../components/ScreenSurface";
import { isMissionCreatedByUser, type Mission } from "../data/missions";
import { useCurrentLocation } from "../hooks/useCurrentLocation";
import { useTheme } from "../theme/ThemeContext";

/** 참여 상태별 표시. 등록자 관점의 문구를 쓴다. */
const participationLabels: Record<ParticipationStatus, string> = {
  JOINED: "참여 중",
  SUBMITTED: "심사 대기",
  APPROVED: "승인함",
  REJECTED: "반려함",
};

/** 서버 오류를 사람이 읽을 문구로 바꾼다. 승인·반려는 403·404가 의미를 갖는다. */
function describeError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 403) return "내가 등록한 미션만 처리할 수 있어요.";
    if (error.status === 404) return "참여 정보를 찾을 수 없어요.";
    return `${error.message} (HTTP ${error.status})`;
  }
  return (error as Error)?.message ?? "처리하지 못했어요.";
}

/**
 * 내가 만든 미션과 거기 들어온 인증을 심사하는 화면.
 *
 * 본인이 만든 미션은 탐색 목록에서 제외되기 때문에(excludeMissionsCreatedByUser) 등록자가
 * 자기 미션을 볼 곳이 따로 필요하다. 목록은 동네 퀘스트 조회에서 작성자가 나인 것만 남겨 만든다.
 */
export default function MyMissionsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  // _layout.tsx가 lazy:false라 이 화면도 앱을 켜는 순간 마운트된다. 위치를 바로 켜면
  // 열어보지도 않은 화면이 GPS를 잡으므로, 실제로 화면이 열린 뒤에만 요청한다.
  const [activated, setActivated] = useState(false);
  const { origin } = useCurrentLocation(activated);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [participations, setParticipations] = useState<
    Record<string, Participation[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Participation | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const neighborhoodId = user?.neighborhoodId ?? null;
  const nickname = user?.nickname ?? null;

  const load = useCallback(async () => {
    if (neighborhoodId == null) {
      setMissions([]);
      setLoading(false);
      setLoadError("동네를 설정하면 내가 만든 미션을 볼 수 있어요.");
      return;
    }
    try {
      const all = await getQuests({
        neighborhoodId,
        latitude: origin.latitude,
        longitude: origin.longitude,
      });
      const mine = all.filter((mission) =>
        isMissionCreatedByUser(mission, nickname),
      );
      setMissions(mine);
      setLoadError(null);

      // 미션마다 참여 목록을 따로 받는다. 한 건이 실패해도 나머지는 보이게 둔다.
      const entries = await Promise.all(
        mine.map(async (mission) => {
          try {
            const items = await getQuestParticipations(Number(mission.id));
            return [mission.id, items ?? []] as const;
          } catch (requestError) {
            console.log(
              "[review] 참여 목록 조회 실패",
              mission.id,
              requestError,
            );
            return [mission.id, [] as Participation[]] as const;
          }
        }),
      );
      setParticipations(Object.fromEntries(entries));
    } catch (requestError) {
      console.log("[review] ✗ 내 미션 조회 실패", requestError);
      setMissions([]);
      setLoadError(describeError(requestError));
    } finally {
      setLoading(false);
    }
  }, [neighborhoodId, nickname, origin.latitude, origin.longitude]);

  useFocusEffect(
    useCallback(() => {
      setActivated(true);
      void load();
    }, [load]),
  );

  const approve = async (participation: Participation) => {
    setBusyId(participation.id);
    setActionError(null);
    try {
      await approveParticipation(participation.id);
      // 승인하면 포인트가 지급되고 퀘스트가 COMPLETED로 바뀌므로 전체를 다시 읽는다.
      await load();
    } catch (requestError) {
      console.log("[review] ✗ 승인 실패", requestError);
      setActionError(describeError(requestError));
    } finally {
      setBusyId(null);
    }
  };

  const confirmReject = async () => {
    if (!rejectTarget || rejectReason.trim().length === 0) return;
    setBusyId(rejectTarget.id);
    setActionError(null);
    try {
      await rejectParticipation(rejectTarget.id, rejectReason.trim());
      setRejectTarget(null);
      setRejectReason("");
      await load();
    } catch (requestError) {
      console.log("[review] ✗ 반려 실패", requestError);
      setActionError(describeError(requestError));
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = Object.values(participations)
    .flat()
    .filter((item) => item.status === "SUBMITTED").length;

  return (
    <ScreenSurface>
      <AppHeader title="내가 만든 미션" back />

      <View style={styles.summary}>
        <View style={styles.summaryCopy}>
          <Text style={[styles.title, { color: colors.text }]}>
            들어온 인증 확인하기
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {pendingCount > 0
              ? `심사를 기다리는 인증이 ${pendingCount}건 있어요.`
              : "심사를 기다리는 인증이 없어요."}
          </Text>
        </View>
        <View style={[styles.count, { backgroundColor: colors.greenSoft }]}>
          <Text style={[styles.countText, { color: colors.greenInk }]}>
            {pendingCount}
          </Text>
        </View>
      </View>

      {actionError ? (
        <SurfaceCard style={[styles.errorCard, { borderColor: colors.orange }]}>
          <Ionicons name="alert-circle-outline" size={17} color={colors.orange} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            {actionError}
          </Text>
        </SurfaceCard>
      ) : null}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.green} />
        </View>
      ) : loadError ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="다시 불러오기"
          onPress={() => {
            void load();
          }}
        >
          <SurfaceCard style={styles.empty}>
            <Ionicons
              name="alert-circle-outline"
              size={28}
              color={colors.orange}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              불러오지 못했어요
            </Text>
            <Text style={[styles.emptyBody, { color: colors.muted }]}>
              {loadError}
            </Text>
            <Text style={[styles.retry, { color: colors.greenInk }]}>
              눌러서 다시 시도
            </Text>
          </SurfaceCard>
        </Pressable>
      ) : missions.length === 0 ? (
        <SurfaceCard style={styles.empty}>
          <Ionicons name="clipboard-outline" size={28} color={colors.green} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            아직 만든 미션이 없어요
          </Text>
          <Text style={[styles.emptyBody, { color: colors.muted }]}>
            홈이나 미션 탭에서 우리 동네 미션을 만들어보세요.
          </Text>
        </SurfaceCard>
      ) : (
        missions.map((mission) => {
          const items = participations[mission.id] ?? [];
          return (
            <SurfaceCard key={mission.id} style={styles.missionCard}>
              <View style={styles.missionHeader}>
                <Image
                  source={mission.imageUrl}
                  style={[
                    styles.missionThumb,
                    { backgroundColor: colors.surfaceRaised },
                  ]}
                  contentFit="cover"
                  transition={160}
                />
                <View style={styles.missionCopy}>
                  <Text
                    numberOfLines={2}
                    style={[styles.missionTitle, { color: colors.text }]}
                  >
                    {mission.title}
                  </Text>
                  <Text style={[styles.missionMeta, { color: colors.muted }]}>
                    {mission.rewardPoint}P · 참여 {items.length}명
                  </Text>
                </View>
              </View>

              {items.length === 0 ? (
                <Text style={[styles.noProof, { color: colors.faint }]}>
                  아직 참여한 이웃이 없어요.
                </Text>
              ) : (
                items.map((item) => {
                  const waiting = item.status === "SUBMITTED";
                  const busy = busyId === item.id;
                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.proofRow,
                        { borderTopColor: colors.border },
                      ]}
                    >
                      <View style={styles.proofHeader}>
                        <Text
                          style={[
                            styles.proofStatus,
                            {
                              color: waiting
                                ? colors.orange
                                : item.status === "APPROVED"
                                  ? colors.greenInk
                                  : colors.muted,
                            },
                          ]}
                        >
                          {participationLabels[item.status]}
                        </Text>
                        <Text style={[styles.proofId, { color: colors.faint }]}>
                          참여 #{item.id}
                        </Text>
                      </View>

                      {item.proofImageUrl ? (
                        <Image
                          source={item.proofImageUrl}
                          style={[
                            styles.proofImage,
                            { backgroundColor: colors.surfaceRaised },
                          ]}
                          contentFit="cover"
                          transition={160}
                          accessibilityLabel="제출된 인증 사진"
                        />
                      ) : null}

                      {item.proofDescription ? (
                        <Text
                          style={[styles.proofText, { color: colors.muted }]}
                        >
                          {item.proofDescription}
                        </Text>
                      ) : null}

                      {item.status === "REJECTED" && item.rejectionReason ? (
                        <Text
                          style={[styles.proofText, { color: colors.orange }]}
                        >
                          반려 사유 · {item.rejectionReason}
                        </Text>
                      ) : null}

                      {waiting ? (
                        <View style={styles.actions}>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityState={{ busy }}
                            disabled={busy}
                            onPress={() => {
                              setRejectTarget(item);
                              setRejectReason("");
                            }}
                            style={({ pressed }) => [
                              styles.rejectButton,
                              { borderColor: colors.border },
                              pressed && styles.pressed,
                            ]}
                          >
                            <Text
                              style={[
                                styles.rejectText,
                                { color: colors.muted },
                              ]}
                            >
                              반려
                            </Text>
                          </Pressable>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityState={{ busy }}
                            disabled={busy}
                            onPress={() => {
                              void approve(item);
                            }}
                            style={({ pressed }) => [
                              styles.approveButton,
                              { backgroundColor: colors.green },
                              pressed && styles.pressed,
                            ]}
                          >
                            <Text style={styles.approveText}>
                              {busy ? "처리 중" : `승인하고 ${mission.rewardPoint}P 지급`}
                            </Text>
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                  );
                })
              )}
            </SurfaceCard>
          );
        })
      )}

      <RejectModal
        target={rejectTarget}
        reason={rejectReason}
        busy={busyId !== null}
        onChangeReason={setRejectReason}
        onClose={() => {
          if (busyId !== null) return;
          setRejectTarget(null);
          setRejectReason("");
        }}
        onConfirm={() => {
          void confirmReject();
        }}
      />
    </ScreenSurface>
  );
}

/** 반려 사유 입력. 서버가 사유를 필수로 받으므로 비어 있으면 보낼 수 없다. */
function RejectModal({
  target,
  reason,
  busy,
  onChangeReason,
  onClose,
  onConfirm,
}: {
  target: Participation | null;
  reason: string;
  busy: boolean;
  onChangeReason: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { colors } = useTheme();
  if (!target) return null;
  const canSend = reason.trim().length > 0 && !busy;
  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <SafeAreaView
            edges={["bottom"]}
            style={[
              styles.sheet,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.handleWrap}>
              <View
                style={[styles.handle, { backgroundColor: colors.border }]}
              />
            </View>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              어떤 점이 부족했나요?
            </Text>
            <Text style={[styles.sheetBody, { color: colors.muted }]}>
              반려하면 포인트는 지급되지 않아요. 사유는 참여한 이웃에게 그대로
              전달돼요.
            </Text>
            <TextInput
              value={reason}
              onChangeText={onChangeReason}
              placeholder="예: 인증 사진이 퀘스트 내용과 맞지 않습니다."
              placeholderTextColor={colors.faint}
              multiline
              textAlignVertical="top"
              style={[
                styles.reasonInput,
                {
                  backgroundColor: colors.surfaceRaised,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />
            <View style={styles.sheetActions}>
              <Pressable
                accessibilityRole="button"
                onPress={onClose}
                style={({ pressed }) => [
                  styles.sheetCancel,
                  { borderColor: colors.border },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.sheetCancelText, { color: colors.muted }]}>
                  취소
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !canSend, busy }}
                disabled={!canSend}
                onPress={onConfirm}
                style={({ pressed }) => [
                  styles.sheetConfirm,
                  {
                    backgroundColor: canSend
                      ? colors.orange
                      : colors.surfaceRaised,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.sheetConfirmText,
                    { color: canSend ? "#2a1a00" : colors.faint },
                  ]}
                >
                  {busy ? "처리 중" : "반려하기"}
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  summary: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  summaryCopy: { flex: 1 },
  title: { fontFamily: "WantedSansB", fontSize: 19 },
  subtitle: { fontFamily: "WantedSansR", fontSize: 11, marginTop: 5 },
  count: {
    alignItems: "center",
    borderRadius: 999,
    height: 42,
    justifyContent: "center",
    minWidth: 42,
    paddingHorizontal: 12,
  },
  countText: { fontFamily: "WantedSansB", fontSize: 16 },
  loading: { paddingVertical: 40 },
  errorCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    paddingVertical: 12,
  },
  errorText: { flex: 1, fontFamily: "WantedSansB", fontSize: 11, lineHeight: 16 },
  empty: { alignItems: "center", paddingVertical: 30 },
  emptyTitle: { fontFamily: "WantedSansB", fontSize: 15, marginTop: 10 },
  emptyBody: {
    fontFamily: "WantedSansR",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
    textAlign: "center",
  },
  retry: { fontFamily: "WantedSansB", fontSize: 11, marginTop: 10 },
  missionCard: { marginTop: 12, padding: 14 },
  missionHeader: { flexDirection: "row" },
  missionThumb: { borderRadius: 14, height: 56, width: 56 },
  missionCopy: { flex: 1, marginLeft: 12 },
  missionTitle: { fontFamily: "WantedSansB", fontSize: 14, lineHeight: 19 },
  missionMeta: { fontFamily: "WantedSansR", fontSize: 10, marginTop: 5 },
  noProof: { fontFamily: "WantedSansR", fontSize: 11, marginTop: 12 },
  proofRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
    paddingTop: 12,
  },
  proofHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  proofStatus: { fontFamily: "WantedSansB", fontSize: 11 },
  proofId: { fontFamily: "WantedSansR", fontSize: 10 },
  proofImage: { borderRadius: 12, height: 150, marginTop: 9, width: "100%" },
  proofText: {
    fontFamily: "WantedSansR",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 8,
  },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
  rejectButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  rejectText: { fontFamily: "WantedSansB", fontSize: 12 },
  approveButton: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    justifyContent: "center",
    paddingVertical: 11,
  },
  approveText: { color: "#17310b", fontFamily: "WantedSansB", fontSize: 12 },
  backdrop: { backgroundColor: "rgba(0,0,0,0.45)", flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  handleWrap: { alignItems: "center", paddingBottom: 6, paddingTop: 9 },
  handle: { borderRadius: 999, height: 4, width: 38 },
  sheetTitle: { fontFamily: "WantedSansB", fontSize: 17, marginTop: 6 },
  sheetBody: {
    fontFamily: "WantedSansR",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 7,
  },
  reasonInput: {
    borderRadius: 14,
    borderWidth: 1,
    fontFamily: "WantedSansR",
    fontSize: 13,
    marginTop: 14,
    minHeight: 104,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  sheetActions: { flexDirection: "row", gap: 8, marginTop: 14 },
  sheetCancel: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sheetCancelText: { fontFamily: "WantedSansB", fontSize: 12 },
  sheetConfirm: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    justifyContent: "center",
    paddingVertical: 12,
  },
  sheetConfirmText: { fontFamily: "WantedSansB", fontSize: 13 },
  pressed: { opacity: 0.72 },
});
