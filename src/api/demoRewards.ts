import AsyncStorage from "@react-native-async-storage/async-storage";
import { ApiError } from "./client";
import type { CurrentUser, RewardItem, RewardRedemption } from "./types";

const CATALOG: RewardItem[] = [
  { id: 4, code: "LEAF_FRAME", type: "PROFILE_DECORATION", title: "나뭇잎 프로필 테두리", description: "동네를 푸르게 만든 참여를 프로필에서 보여주세요.", terms: "구매 후 마이페이지의 내 혜택에서 바로 적용할 수 있어요.", sponsorName: "동네모아", pointPrice: 200, remainingStock: null, monthlyLimit: 1000, status: "AVAILABLE", demoOnly: true, decorationKey: "leaf-frame" },
  { id: 3, code: "LOCAL_SIZEUP", type: "LOCAL_COUPON", title: "동네 가게 무료 사이즈업", description: "제휴 음료 매장에서 한 단계 큰 사이즈를 선택해요.", terms: "발표용 데모 혜택이며 실제 결제에는 적용되지 않아요.", sponsorName: "우리동네 카페연합", pointPrice: 220, remainingStock: 30, monthlyLimit: 160, status: "AVAILABLE", demoOnly: true, decorationKey: null },
  { id: 2, code: "LOCAL_CAFE_10", type: "LOCAL_COUPON", title: "동네 카페 10% 할인", description: "서초동 제휴 카페에서 사용할 수 있는 지역 상권 혜택이에요.", terms: "발표용 데모 혜택이며 실제 결제에는 적용되지 않아요.", sponsorName: "서초동네상권", pointPrice: 350, remainingStock: 24, monthlyLimit: 120, status: "AVAILABLE", demoOnly: true, decorationKey: null },
  { id: 5, code: "COMMUNITY_BADGE", type: "PROFILE_DECORATION", title: "Community Hero 한정 배지", description: "Community XP에 기여한 주민을 위한 한정 프로필 장식이에요.", terms: "구매 후 마이페이지의 내 혜택에서 바로 적용할 수 있어요.", sponsorName: "동네모아", pointPrice: 500, remainingStock: 12, monthlyLimit: 50, status: "AVAILABLE", demoOnly: true, decorationKey: "community-hero" },
  { id: 1, code: "CONVENIENCE_3000", type: "GIFTICON", title: "편의점 3천원 기프티콘", description: "미션으로 모은 포인트를 생활 속 작은 혜택으로 바꿔요.", terms: "발표용 데모 코드이며 실제 매장에서는 사용할 수 없어요.", sponsorName: "그린웨이브 CSR", pointPrice: 900, remainingStock: 8, monthlyLimit: 40, status: "AVAILABLE", demoOnly: true, decorationKey: null },
];

type DemoRewardState = {
  balance: number;
  decorationKey: string | null;
  idempotency: Record<string, number>;
  nextId: number;
  redemptions: RewardRedemption[];
  stock: Record<string, number>;
};

let ownerId = 0;

export function setDemoRewardOwner(userId: number | null) {
  ownerId = userId ?? 0;
}

function storageKey() {
  return `dongnaemoa.demo-rewards.v1.${ownerId}`;
}

function initialState(): DemoRewardState {
  return {
    balance: 1250,
    decorationKey: null,
    idempotency: {},
    nextId: 1,
    redemptions: [],
    stock: Object.fromEntries(CATALOG.filter((item) => item.remainingStock != null).map((item) => [String(item.id), item.remainingStock as number])),
  };
}

async function readState() {
  const raw = await AsyncStorage.getItem(storageKey());
  if (!raw) return initialState();
  try {
    return { ...initialState(), ...JSON.parse(raw) } as DemoRewardState;
  } catch {
    return initialState();
  }
}

async function writeState(state: DemoRewardState) {
  await AsyncStorage.setItem(storageKey(), JSON.stringify(state));
}

export function shouldUseDemoRewards(error: unknown) {
  return error instanceof TypeError || (error instanceof ApiError && [401, 403, 404, 405].includes(error.status));
}

export async function demoGetRewards() {
  const state = await readState();
  return CATALOG.map((item) => ({ ...item, remainingStock: item.remainingStock == null ? null : state.stock[String(item.id)] ?? item.remainingStock }));
}

export async function demoGetPointBalance() {
  return { balance: (await readState()).balance };
}

export async function demoRedeemReward(rewardId: number, idempotencyKey: string) {
  const state = await readState();
  const previousId = state.idempotency[idempotencyKey];
  if (previousId) return state.redemptions.find((item) => item.id === previousId) as RewardRedemption;
  const reward = CATALOG.find((item) => item.id === rewardId);
  if (!reward) throw new ApiError("혜택을 찾지 못했어요.", 404);
  const stock = reward.remainingStock == null ? null : state.stock[String(reward.id)] ?? reward.remainingStock;
  if (stock === 0) throw new ApiError("이미 품절된 혜택이에요.", 409);
  if (state.balance < reward.pointPrice) throw new ApiError("포인트가 부족해요.", 400);

  const redemption: RewardRedemption = {
    id: state.nextId,
    rewardItemId: reward.id,
    title: reward.title,
    type: reward.type,
    pointPrice: reward.pointPrice,
    redemptionCode: `GIFT-${reward.id}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    status: "ISSUED",
    issuedAt: new Date().toISOString(),
    demoOnly: true,
    decorationKey: reward.decorationKey,
  };
  state.balance -= reward.pointPrice;
  state.nextId += 1;
  state.redemptions.unshift(redemption);
  state.idempotency[idempotencyKey] = redemption.id;
  if (stock != null) state.stock[String(reward.id)] = stock - 1;
  await writeState(state);
  return redemption;
}

export async function demoGetMyRewards() {
  return (await readState()).redemptions;
}

export async function demoApplyProfileDecoration(redemptionId: number, currentUser: CurrentUser) {
  const state = await readState();
  const redemption = state.redemptions.find((item) => item.id === redemptionId && item.type === "PROFILE_DECORATION");
  if (!redemption?.decorationKey) throw new ApiError("적용할 프로필 장식을 찾지 못했어요.", 404);
  state.decorationKey = redemption.decorationKey;
  await writeState(state);
  return { ...currentUser, point: state.balance, profileDecorationKey: redemption.decorationKey };
}
