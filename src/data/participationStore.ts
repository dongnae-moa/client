import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Participation } from "../api/participations";

const STORAGE_PREFIX = "dongnaemoa.participations.v1";

export type ParticipationByQuest = Record<string, Participation>;

function storageKey(userId: number) {
  return `${STORAGE_PREFIX}.${userId}`;
}

/** 서버에 참여 목록 조회 API가 없어, 받은 participationId를 계정별로 보존한다. */
export async function getStoredParticipations(
  userId: number,
): Promise<ParticipationByQuest> {
  const raw = await AsyncStorage.getItem(storageKey(userId));
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object"
      ? (parsed as ParticipationByQuest)
      : {};
  } catch {
    return {};
  }
}

export async function storeParticipation(
  userId: number,
  participation: Participation,
) {
  const current = await getStoredParticipations(userId);
  const next = {
    ...current,
    [String(participation.questId)]: participation,
  };
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(next));
  return next;
}
