import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

const LOCATION_PERMISSION_REQUESTED_KEY =
  "dongnaemoa.location-permission-requested.v1";

let foregroundPermissionRequest: Promise<Location.LocationPermissionResponse> | null =
  null;

/**
 * 위치 권한 요청을 앱 설치 후 한 번으로 제한한다.
 * 홈·미션 화면이 동시에 마운트돼도 같은 요청 Promise를 공유한다.
 */
export async function getForegroundLocationPermission(
  requestIfUndetermined = true,
) {
  const existing = await Location.getForegroundPermissionsAsync();
  if (existing.granted) {
    await AsyncStorage.setItem(LOCATION_PERMISSION_REQUESTED_KEY, "done");
    return existing;
  }
  if (existing.status !== "undetermined" || !requestIfUndetermined) {
    return existing;
  }

  const requestedBefore = await AsyncStorage.getItem(
    LOCATION_PERMISSION_REQUESTED_KEY,
  );
  if (requestedBefore === "done") return existing;
  if (foregroundPermissionRequest) return foregroundPermissionRequest;

  foregroundPermissionRequest = (async () => {
    // 시스템 팝업을 띄우기 직전에 기록해 다른 화면의 중복 요청을 차단한다.
    await AsyncStorage.setItem(LOCATION_PERMISSION_REQUESTED_KEY, "done");
    return Location.requestForegroundPermissionsAsync();
  })().finally(() => {
    foregroundPermissionRequest = null;
  });

  return foregroundPermissionRequest;
}
