import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ApiError } from "../api/client";
import { getPointBalance, getRewards, redeemReward } from "../api/rewards";
import type { RewardItem, RewardRedemption, RewardType } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import AppHeader from "../components/AppHeader";
import { useTheme } from "../theme/ThemeContext";

type Category = { label: string; value?: RewardType };
const categories: Category[] = [
  { label: "전체" },
  { label: "기프티콘", value: "GIFTICON" },
  { label: "동네 혜택", value: "LOCAL_COUPON" },
  { label: "프로필 장식", value: "PROFILE_DECORATION" },
];

const rewardVisuals: Record<RewardType, { icon: keyof typeof Ionicons.glyphMap; tint: string }> = {
  GIFTICON: { icon: "gift-outline", tint: "#f1b64b" },
  LOCAL_COUPON: { icon: "storefront-outline", tint: "#8b72e8" },
  PROFILE_DECORATION: { icon: "leaf-outline", tint: "#77c84d" },
};

export default function StoreScreen() {
  const router = useRouter();
  const { colors, mode } = useTheme();
  const { refreshProfile, updateUser } = useAuth();
  const [category, setCategory] = useState<Category>(categories[0]);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [balance, setBalance] = useState(0);
  const [selected, setSelected] = useState<RewardItem | null>(null);
  const [receipt, setReceipt] = useState<RewardRedemption | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catalog, point] = await Promise.all([getRewards(), getPointBalance()]);
      setRewards(catalog);
      setBalance(point.balance);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "보상 상점을 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const visibleRewards = useMemo(() => category.value
    ? rewards.filter((reward) => reward.type === category.value)
    : rewards, [category.value, rewards]);

  const redeem = async () => {
    if (!selected) return;
    setRedeeming(true);
    setError(null);
    try {
      const idempotencyKey = `${selected.id}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const result = await redeemReward(selected.id, idempotencyKey);
      setReceipt(result);
      setSelected(null);
      const [, profile, point] = await Promise.all([load(), refreshProfile(), getPointBalance()]);
      updateUser({ ...profile, point: point.balance });
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "보상을 교환하지 못했어요.");
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader title="상점" />
        <View style={[styles.balanceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.balanceCopy}>
            <Text style={[styles.balanceLabel, { color: colors.muted }]}>사용 가능한 미션 포인트</Text>
            <Text style={[styles.balanceValue, { color: colors.text }]}>{balance.toLocaleString()} <Text style={[styles.balanceUnit, { color: colors.green }]}>P</Text></Text>
            <Text style={[styles.balanceHint, { color: colors.muted }]}>현금 환전 없이 원하는 혜택으로 바꿔요.</Text>
          </View>
          <View style={[styles.balanceIcon, { backgroundColor: colors.greenSoft }]}><Ionicons name="sparkles" size={26} color={colors.green} /></View>
        </View>

        <View style={styles.sectionHeader}>
          <View><Text style={[styles.sectionTitle, { color: colors.text }]}>동네 혜택 둘러보기</Text><Text style={[styles.sectionDescription, { color: colors.muted }]}>후원 예산과 재고 안에서만 교환할 수 있어요.</Text></View>
          <View style={[styles.demoBadge, { backgroundColor: colors.surfaceRaised }]}><Text style={[styles.demoBadgeText, { color: colors.muted }]}>발표 데모</Text></View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {categories.map((item) => {
            const active = item.label === category.label;
            return <Pressable key={item.label} onPress={() => setCategory(item)} style={[styles.chip, { backgroundColor: active ? colors.green : colors.surface, borderColor: active ? colors.green : colors.border }]}><Text style={[styles.chipText, { color: active ? "#17310b" : colors.text }]}>{item.label}</Text></Pressable>;
          })}
        </ScrollView>

        {loading ? <View style={styles.state}><ActivityIndicator color={colors.green} /><Text style={[styles.stateText, { color: colors.muted }]}>혜택을 준비하고 있어요</Text></View> : null}
        {!loading && error && rewards.length === 0 ? <View style={[styles.stateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Ionicons name="cloud-offline-outline" size={28} color={colors.orange} /><Text style={[styles.stateTitle, { color: colors.text }]}>상점을 불러오지 못했어요</Text><Text style={[styles.stateText, { color: colors.muted }]}>{error}</Text><Pressable onPress={() => { void load(); }} style={[styles.retryButton, { backgroundColor: colors.green }]}><Text style={styles.retryText}>다시 불러오기</Text></Pressable></View> : null}

        {!loading && visibleRewards.map((reward) => <RewardCard key={reward.id} reward={reward} balance={balance} onPress={() => { setError(null); setSelected(reward); }} />)}

        <View style={[styles.fundingCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
          <View style={[styles.fundingIcon, { backgroundColor: colors.greenSoft }]}><Ionicons name="business-outline" size={22} color={colors.green} /></View>
          <View style={styles.fundingCopy}><Text style={[styles.fundingTitle, { color: colors.text }]}>혜택은 어떻게 만들어지나요?</Text><Text style={[styles.fundingText, { color: colors.muted }]}>지자체 운영비와 기업 CSR 보상 예산, 동네 가게의 할인 혜택으로 포인트 사용처를 운영해요.</Text></View>
        </View>
      </ScrollView>

      <RewardDetail reward={selected} balance={balance} error={error} loading={redeeming} onClose={() => { if (!redeeming) { setSelected(null); setError(null); } }} onRedeem={() => { void redeem(); }} />
      <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} onGoInventory={() => { setReceipt(null); router.navigate("/my"); }} />
    </SafeAreaView>
  );
}

function RewardCard({ reward, balance, onPress }: { reward: RewardItem; balance: number; onPress: () => void }) {
  const { colors } = useTheme();
  const visual = rewardVisuals[reward.type];
  const soldOut = reward.status !== "AVAILABLE" || reward.remainingStock === 0;
  return (
    <Pressable disabled={soldOut} onPress={onPress} style={({ pressed }) => [styles.rewardCard, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed, soldOut && styles.soldOut]}>
      <View style={[styles.rewardIcon, { backgroundColor: visual.tint + "22" }]}><Ionicons name={visual.icon} size={26} color={visual.tint} /></View>
      <View style={styles.rewardCopy}>
        <View style={styles.rewardTop}><Text style={[styles.rewardType, { color: colors.green }]}>{typeLabel(reward.type)}</Text><Text style={[styles.rewardStock, { color: colors.muted }]}>{reward.remainingStock == null ? "상시 교환" : soldOut ? "품절" : `${reward.remainingStock}개 남음`}</Text></View>
        <Text numberOfLines={2} style={[styles.rewardTitle, { color: colors.text }]}>{reward.title}</Text>
        <Text numberOfLines={2} style={[styles.rewardDescription, { color: colors.muted }]}>{reward.description}</Text>
        <View style={styles.rewardBottom}><Text style={[styles.sponsor, { color: colors.muted }]}>{reward.sponsorName}</Text><Text style={[styles.rewardPrice, { color: balance >= reward.pointPrice ? colors.text : colors.orange }]}>{reward.pointPrice.toLocaleString()} P</Text></View>
      </View>
    </Pressable>
  );
}

function RewardDetail({ reward, balance, error, loading, onClose, onRedeem }: { reward: RewardItem | null; balance: number; error: string | null; loading: boolean; onClose: () => void; onRedeem: () => void }) {
  const { colors, mode } = useTheme();
  if (!reward) return null;
  const visual = rewardVisuals[reward.type];
  const insufficient = balance < reward.pointPrice;
  return (
    <Modal animationType="slide" transparent visible onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.modalBackdrop}><Pressable style={StyleSheet.absoluteFill} onPress={onClose} /><SafeAreaView edges={["bottom"]} style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.sheetHandleWrap}><View style={[styles.sheetHandle, { backgroundColor: colors.border }]} /></View>
        <View style={styles.sheetHeader}><View style={[styles.sheetIcon, { backgroundColor: visual.tint + "22" }]}><Ionicons name={visual.icon} size={30} color={visual.tint} /></View><Pressable accessibilityLabel="닫기" onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.surfaceRaised }]}><Ionicons name="close" size={20} color={colors.text} /></Pressable></View>
        <Text style={[styles.sheetType, { color: colors.green }]}>{typeLabel(reward.type)} · {reward.sponsorName}</Text>
        <Text style={[styles.sheetTitle, { color: colors.text }]}>{reward.title}</Text>
        <Text style={[styles.sheetDescription, { color: colors.muted }]}>{reward.description}</Text>
        <View style={[styles.termCard, { backgroundColor: colors.surfaceRaised }]}><Ionicons name="information-circle-outline" size={19} color={colors.green} /><Text style={[styles.termText, { color: colors.muted }]}>{reward.terms}{"\n"}교환하면 내 혜택에 저장되고, 이웃에게 보낼 선물 코드도 함께 발급돼요.</Text></View>
        <View style={styles.purchaseSummary}><View><Text style={[styles.summaryLabel, { color: colors.muted }]}>내 포인트</Text><Text style={[styles.summaryValue, { color: colors.text }]}>{balance.toLocaleString()} P</Text></View><Ionicons name="arrow-forward" size={18} color={colors.muted} /><View style={styles.summaryRight}><Text style={[styles.summaryLabel, { color: colors.muted }]}>교환 후</Text><Text style={[styles.summaryValue, { color: insufficient ? colors.orange : colors.green }]}>{Math.max(0, balance - reward.pointPrice).toLocaleString()} P</Text></View></View>
        {error ? <Text accessibilityRole="alert" style={[styles.sheetError, { color: colors.orange }]}>{error}</Text> : null}
        <Pressable disabled={loading || insufficient} onPress={onRedeem} style={[styles.purchaseButton, { backgroundColor: insufficient ? colors.surfaceRaised : colors.green }, (loading || insufficient) && styles.disabled]}><Text style={[styles.purchaseButtonText, { color: insufficient ? colors.muted : "#17310b" }]}>{loading ? "교환하고 있어요" : insufficient ? "포인트가 부족해요" : `${reward.pointPrice.toLocaleString()} P로 교환하기`}</Text></Pressable>
        <Text style={[styles.demoNotice, { color: colors.muted }]}>이 혜택은 발표용 데모이며 실제 금전적 효력이 없어요.</Text>
      </SafeAreaView></View>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
    </Modal>
  );
}

function ReceiptModal({ receipt, onClose, onGoInventory }: { receipt: RewardRedemption | null; onClose: () => void; onGoInventory: () => void }) {
  const { colors } = useTheme();
  if (!receipt) return null;
  const shareCode = async () => {
    await Share.share({ message: `동네모아에서 ${receipt.title} 혜택을 선물했어요.\n선물 코드: ${receipt.redemptionCode}\n※ 발표용 데모 혜택이에요.` });
  };
  return (
    <Modal animationType="fade" transparent visible onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.receiptBackdrop}><View style={[styles.receiptCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.successIcon, { backgroundColor: colors.greenSoft }]}><Ionicons name="gift" size={32} color={colors.green} /></View>
        <Text style={[styles.receiptTitle, { color: colors.text }]}>내 혜택에 보관했어요</Text>
        <Text style={[styles.receiptName, { color: colors.muted }]}>{receipt.title}</Text>
        <View style={[styles.inventoryNotice, { backgroundColor: colors.greenSoft }]}><Ionicons name="checkmark-circle" size={19} color={colors.green} /><Text style={[styles.inventoryNoticeText, { color: colors.text }]}>마이페이지 보관함에 저장 완료</Text></View>
        <View style={[styles.codeBox, { backgroundColor: colors.surfaceRaised }]}><View style={styles.codeLabelRow}><Ionicons name="paper-plane-outline" size={15} color={colors.purple} /><Text style={[styles.codeLabel, { color: colors.muted }]}>이웃에게 보낼 선물 코드</Text></View><Text selectable style={[styles.code, { color: colors.text }]}>{receipt.redemptionCode}</Text></View>
        <Text style={[styles.receiptNotice, { color: colors.muted }]}>직접 사용해도 되고, 선물 코드를 공유해 이웃에게 보낼 수도 있어요.</Text>
        <Pressable onPress={() => { void shareCode(); }} style={[styles.receiptButton, { backgroundColor: colors.green }]}><Ionicons name="share-social-outline" size={18} color="#17310b" /><Text style={styles.receiptButtonText}>선물 코드 보내기</Text></Pressable>
        <Pressable onPress={onGoInventory} style={[styles.inventoryButton, { borderColor: colors.border }]}><Text style={[styles.inventoryButtonText, { color: colors.text }]}>내 혜택에서 확인</Text></Pressable>
      </View></View>
    </Modal>
  );
}

function typeLabel(type: RewardType) {
  if (type === "GIFTICON") return "기프티콘";
  if (type === "LOCAL_COUPON") return "동네 혜택";
  return "프로필 장식";
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingBottom: 148, paddingHorizontal: 20, paddingTop: 26 },
  balanceCard: { alignItems: "center", borderRadius: 22, borderWidth: 1, flexDirection: "row", marginTop: 5, padding: 18 },
  balanceCopy: { flex: 1 },
  balanceLabel: { fontFamily: "WantedSansR", fontSize: 11 },
  balanceValue: { fontFamily: "WantedSansB", fontSize: 29, marginTop: 5 },
  balanceUnit: { fontSize: 15 },
  balanceHint: { fontFamily: "WantedSansR", fontSize: 10, marginTop: 5 },
  balanceIcon: { alignItems: "center", borderRadius: 999, height: 58, justifyContent: "center", width: 58 },
  sectionHeader: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between", marginTop: 25 },
  sectionTitle: { fontFamily: "WantedSansB", fontSize: 20 },
  sectionDescription: { fontFamily: "WantedSansR", fontSize: 10, marginTop: 5 },
  demoBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  demoBadgeText: { fontFamily: "WantedSansB", fontSize: 9 },
  chips: { gap: 8, paddingBottom: 5, paddingTop: 14 },
  chip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 8 },
  chipText: { fontFamily: "WantedSansB", fontSize: 10 },
  state: { alignItems: "center", gap: 10, justifyContent: "center", minHeight: 240 },
  stateText: { fontFamily: "WantedSansR", fontSize: 11, lineHeight: 17, textAlign: "center" },
  stateCard: { alignItems: "center", borderRadius: 20, borderWidth: 1, marginTop: 16, padding: 24 },
  stateTitle: { fontFamily: "WantedSansB", fontSize: 15, marginTop: 12 },
  retryButton: { borderRadius: 999, marginTop: 15, paddingHorizontal: 16, paddingVertical: 9 },
  retryText: { color: "#17310b", fontFamily: "WantedSansB", fontSize: 11 },
  rewardCard: { borderRadius: 19, borderWidth: 1, flexDirection: "row", marginTop: 11, padding: 13 },
  rewardIcon: { alignItems: "center", borderRadius: 16, height: 62, justifyContent: "center", width: 62 },
  rewardCopy: { flex: 1, marginLeft: 13 },
  rewardTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  rewardType: { fontFamily: "WantedSansB", fontSize: 9 },
  rewardStock: { fontFamily: "WantedSansR", fontSize: 9 },
  rewardTitle: { fontFamily: "WantedSansB", fontSize: 14, lineHeight: 19, marginTop: 5 },
  rewardDescription: { fontFamily: "WantedSansR", fontSize: 10, lineHeight: 15, marginTop: 4 },
  rewardBottom: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between", marginTop: 9 },
  sponsor: { flex: 1, fontFamily: "WantedSansR", fontSize: 9 },
  rewardPrice: { fontFamily: "WantedSansB", fontSize: 13 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  soldOut: { opacity: 0.48 },
  fundingCard: { alignItems: "flex-start", borderRadius: 18, borderWidth: 1, flexDirection: "row", marginTop: 18, padding: 15 },
  fundingIcon: { alignItems: "center", borderRadius: 14, height: 44, justifyContent: "center", width: 44 },
  fundingCopy: { flex: 1, marginLeft: 11 },
  fundingTitle: { fontFamily: "WantedSansB", fontSize: 12 },
  fundingText: { fontFamily: "WantedSansR", fontSize: 10, lineHeight: 16, marginTop: 5 },
  modalBackdrop: { backgroundColor: "rgba(0,0,0,0.52)", flex: 1, justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, paddingBottom: 18, paddingHorizontal: 22 },
  sheetHandleWrap: { alignItems: "center", height: 30, justifyContent: "center" },
  sheetHandle: { borderRadius: 99, height: 4, width: 40 },
  sheetHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  sheetIcon: { alignItems: "center", borderRadius: 18, height: 62, justifyContent: "center", width: 62 },
  closeButton: { alignItems: "center", borderRadius: 999, height: 38, justifyContent: "center", width: 38 },
  sheetType: { fontFamily: "WantedSansB", fontSize: 10, marginTop: 18 },
  sheetTitle: { fontFamily: "WantedSansB", fontSize: 23, letterSpacing: -0.8, lineHeight: 30, marginTop: 7 },
  sheetDescription: { fontFamily: "WantedSansR", fontSize: 12, lineHeight: 19, marginTop: 8 },
  termCard: { alignItems: "flex-start", borderRadius: 15, flexDirection: "row", gap: 9, marginTop: 17, padding: 13 },
  termText: { flex: 1, fontFamily: "WantedSansR", fontSize: 10, lineHeight: 16 },
  purchaseSummary: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 18, paddingHorizontal: 5 },
  summaryLabel: { fontFamily: "WantedSansR", fontSize: 9 },
  summaryValue: { fontFamily: "WantedSansB", fontSize: 16, marginTop: 4 },
  summaryRight: { alignItems: "flex-end" },
  sheetError: { fontFamily: "WantedSansR", fontSize: 10, marginTop: 13, textAlign: "center" },
  purchaseButton: { alignItems: "center", borderRadius: 16, justifyContent: "center", minHeight: 55, marginTop: 18 },
  purchaseButtonText: { fontFamily: "WantedSansB", fontSize: 14 },
  disabled: { opacity: 0.62 },
  demoNotice: { fontFamily: "WantedSansR", fontSize: 9, marginTop: 10, textAlign: "center" },
  receiptBackdrop: { alignItems: "center", backgroundColor: "rgba(0,0,0,0.62)", flex: 1, justifyContent: "center", padding: 24 },
  receiptCard: { alignItems: "center", borderRadius: 26, borderWidth: 1, padding: 24, width: "100%" },
  successIcon: { alignItems: "center", borderRadius: 999, height: 70, justifyContent: "center", width: 70 },
  receiptTitle: { fontFamily: "WantedSansB", fontSize: 21, marginTop: 17 },
  receiptName: { fontFamily: "WantedSansR", fontSize: 12, marginTop: 7, textAlign: "center" },
  inventoryNotice: { alignItems: "center", borderRadius: 13, flexDirection: "row", gap: 7, marginTop: 16, paddingHorizontal: 13, paddingVertical: 10, width: "100%" },
  inventoryNoticeText: { fontFamily: "WantedSansB", fontSize: 10 },
  codeBox: { alignItems: "center", borderRadius: 16, marginTop: 12, padding: 15, width: "100%" },
  codeLabelRow: { alignItems: "center", flexDirection: "row", gap: 5 },
  codeLabel: { fontFamily: "WantedSansR", fontSize: 9 },
  code: { fontFamily: "WantedSansB", fontSize: 18, letterSpacing: 1.4, marginTop: 6 },
  receiptNotice: { fontFamily: "WantedSansR", fontSize: 10, lineHeight: 16, marginTop: 13, textAlign: "center" },
  receiptButton: { alignItems: "center", borderRadius: 15, flexDirection: "row", gap: 7, justifyContent: "center", minHeight: 50, marginTop: 18, width: "100%" },
  receiptButtonText: { color: "#17310b", fontFamily: "WantedSansB", fontSize: 13 },
  inventoryButton: { alignItems: "center", borderRadius: 15, borderWidth: 1, justifyContent: "center", minHeight: 47, marginTop: 9, width: "100%" },
  inventoryButtonText: { fontFamily: "WantedSansB", fontSize: 12 },
});
