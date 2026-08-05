import type { MapStyleElement } from "react-native-maps";

/** Expo Go처럼 Cloud Map ID를 쓸 수 없는 환경에서 사용하는 앱 다크 지도 스타일. */
export const darkMapStyle: MapStyleElement[] = [
  { elementType: "geometry", stylers: [{ color: "#151815" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#aeb7ae" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#151815" }] },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#3c433c" }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: "#192019" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#1d231d" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#1c2b1c" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#2b302b" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#181c18" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3a4139" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#242924" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#15262d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#78909b" }],
  },
];
