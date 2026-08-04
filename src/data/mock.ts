export const missionCards = [
  { title: "인도를 막고 있는 공유자전거를 지정 구역으로 이동", shortTitle: "공유자전거 이동하기", type: "공공질서", distance: "20m", time: "3분", points: "20P" },
  { title: "점자블록 위 이동 가능한 방해물 정리", shortTitle: "점자블록 방해물 정리", type: "접근성", distance: "80m", time: "3분", points: "25P" },
  { title: "공원 운동기구 파손 여부 확인", shortTitle: "운동기구 상태 확인", type: "시설 확인", distance: "120m", time: "4분", points: "15P" },
  { title: "벤치 주변 가벼운 쓰레기 정리", shortTitle: "벤치 주변 정리", type: "환경", distance: "160m", time: "5분", points: "20P" },
];

export const neighborhoodMetrics = [
  { icon: "checkmark-circle-outline" as const, label: "해결된 문제", value: "24건", color: "green" as const },
  { icon: "people-outline" as const, label: "참여 주민", value: "83명", color: "purple" as const },
  { icon: "time-outline" as const, label: "누적 참여시간", value: "6시간 40분", color: "blue" as const },
  { icon: "notifications-outline" as const, label: "아직 남은 문제", value: "12건", color: "orange" as const },
];
