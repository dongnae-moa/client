import type { MapStyleElement } from "react-native-maps";

/**
 * 라이트 모드 지도 스타일.
 *
 * 안드로이드의 구글 지도 기본 스타일은 앱 테마가 아니라 **시스템** 다크 모드를 따라간다.
 * (react-native-maps의 userInterfaceStyle prop은 타입 정의상 Android 지원이라고 적혀 있지만
 * 실제 안드로이드 네이티브 코드에는 구현이 없어 무시된다.)
 * 그래서 라이트 모드에서는 명시적인 스타일을 넘겨 시스템 다크 적용을 덮어쓴다.
 *
 * 색은 앱 라이트 팔레트(배경 #f3f5f1, greenSoft 계열)에 맞췄다.
 * 라이트용 Cloud Map ID를 만들어 넣으면 이 스타일 대신 그쪽이 적용된다.
 */
export const lightMapStyle: MapStyleElement[] = [
  { elementType: "geometry", stylers: [{ color: "#f5f7f3" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#4a534b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#d3dad1" }],
  },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry",
    stylers: [{ color: "#ecefe7" }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: "#e8f0dd" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6d776e" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#e2efd2" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#5d7a44" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e4e9df" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b746c" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#dbe1d6" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#e9ede4" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6d776e" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#d5e3ea" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7d94a0" }],
  },
];
