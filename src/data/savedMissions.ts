import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "dongnaemoa.saved-missions.v1";
const DEFAULT_IDS = ["2", "5", "7"];

export async function getSavedMissionIds() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_IDS;
  try {
    const ids = JSON.parse(raw) as unknown;
    return Array.isArray(ids) && ids.every((id) => typeof id === "string")
      ? ids
      : DEFAULT_IDS;
  } catch {
    return DEFAULT_IDS;
  }
}

export async function setMissionSaved(id: string, saved: boolean) {
  const ids = await getSavedMissionIds();
  const next = saved
    ? Array.from(new Set([...ids, id]))
    : ids.filter((item) => item !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export async function toggleMissionSaved(id: string) {
  const ids = await getSavedMissionIds();
  return setMissionSaved(id, !ids.includes(id));
}
