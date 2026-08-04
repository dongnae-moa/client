export type Coords = { latitude: number; longitude: number };

/** WGS84 적도 반지름(m). */
const EARTH_RADIUS_M = 6378137;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const toDegrees = (radians: number) => (radians * 180) / Math.PI;

/**
 * 기준점에서 방위각(북=0°, 시계방향)으로 distanceMeters 만큼 떨어진 좌표.
 *
 * 1km 이내에서는 정거방위도법 근사로도 오차가 1m 미만이라 구면 삼각법 대신 이 식을 쓴다.
 * 미션 목데이터가 "거리 + 방위"로만 정의돼 있어 사용자 위치가 바뀌면 핀도 함께 따라온다.
 */
export function destinationPoint(
  origin: Coords,
  distanceMeters: number,
  bearingDegrees: number,
): Coords {
  const bearing = toRadians(bearingDegrees);
  const northMeters = Math.cos(bearing) * distanceMeters;
  const eastMeters = Math.sin(bearing) * distanceMeters;
  const latitudeDelta = northMeters / EARTH_RADIUS_M;
  // 경도 1도의 실제 거리는 위도가 높아질수록 짧아지므로 cos(위도)로 나눈다.
  const longitudeDelta =
    eastMeters / (EARTH_RADIUS_M * Math.cos(toRadians(origin.latitude)));
  return {
    latitude: origin.latitude + toDegrees(latitudeDelta),
    longitude: origin.longitude + toDegrees(longitudeDelta),
  };
}
