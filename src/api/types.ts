export type ApiEnvelope<T> = {
  status?: string;
  code?: number;
  message?: string;
  data: T;
};

export type AuthSession = {
  accessToken: string;
  refreshToken?: string | null;
  tokenType: string;
  userId: number;
  nickname: string;
  neighborhoodId?: number | null;
  neighborhoodName?: string | null;
  point?: number;
  profileDecorationKey?: string | null;
};

export type CurrentUser = {
  userId: number;
  email: string;
  nickname: string;
  point: number;
  neighborhoodId: number | null;
  neighborhoodName: string | null;
  profileDecorationKey: string | null;
};

export type Neighborhood = {
  id: number;
  administrativeCode: string;
  name: string;
  sido: string;
  sigungu: string;
};

export type RewardType = "GIFTICON" | "LOCAL_COUPON" | "PROFILE_DECORATION";
export type RewardStatus = "AVAILABLE" | "SOLD_OUT" | "PAUSED";

export type RewardItem = {
  id: number;
  code: string;
  type: RewardType;
  title: string;
  description: string;
  terms: string;
  sponsorName: string;
  pointPrice: number;
  remainingStock: number | null;
  monthlyLimit: number;
  status: RewardStatus;
  demoOnly: boolean;
  decorationKey: string | null;
};

export type RewardRedemption = {
  id: number;
  rewardItemId: number;
  title: string;
  type: RewardType;
  pointPrice: number;
  redemptionCode: string;
  status: "ISSUED" | "USED" | "EXPIRED" | "CANCELED";
  issuedAt: string;
  demoOnly: boolean;
  decorationKey: string | null;
};
