import * as Location from "expo-location";
import { useEffect, useState } from "react";
import type { Coords } from "../utils/geo";

/** 위치 권한이 없거나 조회에 실패했을 때 기준으로 삼을 좌표(서울시청). */
export const FALLBACK_CENTER: Coords = {
  latitude: 37.5665,
  longitude: 126.978,
};

/**
 * 전경 위치 권한을 받고 현재 좌표를 구한다.
 *
 * 정확한 좌표는 수십 초가 걸릴 수 있어 캐시된 위치(getLastKnownPositionAsync)로 먼저
 * `settled`를 세워 지도를 띄우고, 정확한 좌표가 도착하면 `coords`를 갱신한다.
 *
 * @param enabled 화면이 실제로 열렸을 때만 true로 넘긴다. 탭이 앱 시작과 함께 모두
 *   마운트되므로(_layout.tsx의 lazy: false) 권한 팝업이 첫 실행에 바로 뜨는 걸 막는다.
 */
export function useCurrentLocation(enabled: boolean) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let isMounted = true;

    (async () => {
      try {
        const { granted } = await Location.requestForegroundPermissionsAsync();
        if (!isMounted) return;
        setHasPermission(granted);
        if (!granted) {
          setSettled(true);
          return;
        }

        const lastKnown = await Location.getLastKnownPositionAsync();
        if (!isMounted) return;
        if (lastKnown) {
          setCoords({
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
          });
        }
        setSettled(true);

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!isMounted) return;
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      } catch {
        // 위치를 못 구해도 기본 좌표로 지도는 보여준다.
        if (isMounted) setSettled(true);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [enabled]);

  return {
    /** 실제 사용자 위치. 아직 못 구했으면 null. */
    coords,
    /** 미션 좌표 계산 기준점. 위치를 못 구했으면 기본 좌표를 쓴다. */
    origin: coords ?? FALLBACK_CENTER,
    hasPermission,
    /** 권한 확인과 첫 좌표 조회가 끝나 지도를 띄울 수 있는 상태. */
    settled,
  };
}
