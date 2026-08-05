import { apiRequest } from "./client";
import type { CurrentUser, RewardItem, RewardRedemption, RewardType } from "./types";
import { demoApplyProfileDecoration, demoGetMyRewards, demoGetRewards, demoRedeemReward, shouldUseDemoRewards } from "./demoRewards";

export async function getRewards(type?: RewardType) {
  const query = type ? `?category=${type}` : "";
  try {
    return await apiRequest<RewardItem[]>(`/v1/rewards${query}`, {}, { handleUnauthorized: false });
  } catch (error) {
    if (!shouldUseDemoRewards(error)) throw error;
    const items = await demoGetRewards();
    return type ? items.filter((item) => item.type === type) : items;
  }
}

// 포인트 잔액은 별도 엔드포인트를 쓰지 않는다. /v1/users/me의 point가 유일한 출처다.

export async function redeemReward(rewardId: number, idempotencyKey: string) {
  try {
    return await apiRequest<RewardRedemption>(`/v1/rewards/${rewardId}/redeem`, {
      method: "POST",
      body: JSON.stringify({ idempotencyKey }),
    }, { handleUnauthorized: false });
  } catch (error) {
    if (!shouldUseDemoRewards(error)) throw error;
    return demoRedeemReward(rewardId, idempotencyKey);
  }
}

export async function getMyRewards() {
  try {
    return await apiRequest<RewardRedemption[]>("/v1/users/me/rewards", {}, { handleUnauthorized: false });
  } catch (error) {
    if (!shouldUseDemoRewards(error)) throw error;
    return demoGetMyRewards();
  }
}

export async function applyProfileDecoration(redemptionId: number, currentUser: CurrentUser) {
  try {
    return await apiRequest<CurrentUser>("/v1/users/me/profile-decoration", {
      method: "PATCH",
      body: JSON.stringify({ redemptionId }),
    }, { handleUnauthorized: false });
  } catch (error) {
    if (!shouldUseDemoRewards(error)) throw error;
    return demoApplyProfileDecoration(redemptionId, currentUser);
  }
}
