export const categories = ["전체", "공공질서", "접근성", "시설 확인", "환경"];
export const difficulties = ["전체", "쉬움", "보통", "어려움"];
export const sortOptions = [
  { id: "distance", label: "가까운 순" },
  { id: "points", label: "포인트 많은 순" },
  { id: "time", label: "짧은 시간 순" },
  { id: "difficulty", label: "쉬운 순" },
] as const;

export type SortId = (typeof sortOptions)[number]["id"];

/** 슬라이더를 끝까지 올렸을 때의 값. 이 값이면 해당 조건을 걸지 않는다("상관없음"). */
export const DISTANCE_ANY = 1050;
export const TIME_ANY = 31;
export const POINTS_ANY = 51;

export const DEFAULT_FILTERS = {
  distance: 500,
  minutes: 10,
  points: 10,
  category: "전체",
  difficulty: "전체",
  sort: "distance" as SortId,
};

export type MissionFilters = typeof DEFAULT_FILTERS;

/**
 * 내 주변 미션 목데이터.
 *
 * 위치는 좌표가 아니라 `distance`(m) + `bearing`(북=0°, 시계방향)으로 두고, 화면에서 현재 위치를
 * 기준으로 좌표를 계산한다. 그래서 어디서 앱을 켜도 핀이 "내 주변"에 찍히고, 거리 필터 값과
 * 지도에 보이는 거리가 항상 일치한다.
 */
export const nearbyMissions = [
  {
    id: "bike",
    title: "인도를 막고 있는 공유자전거를 지정 구역으로 이동",
    place: "동네 골목 입구",
    category: "공공질서",
    distance: 20,
    minutes: 3,
    points: 20,
    difficulty: "쉬움",
    icon: "bicycle-outline",
    bearing: 35,
    summary:
      "보도 가운데 세워진 공유자전거 때문에 유모차와 휠체어가 지나가기 어려운 상태예요. 근처 지정 주차 구역으로 옮겨주세요.",
    checkpoints: [
      "옮기기 전 자전거가 놓인 상태를 사진으로 남겨요",
      "지정 구역 안쪽에 바퀴를 맞춰 세워요",
      "옮긴 뒤 보도 폭이 확보됐는지 확인해요",
    ],
  },
  {
    id: "access",
    title: "점자블록 위 이동 가능한 방해물 정리",
    place: "버스정류장 앞 보도",
    category: "접근성",
    distance: 80,
    minutes: 3,
    points: 25,
    difficulty: "쉬움",
    icon: "accessibility-outline",
    bearing: 110,
    summary:
      "점자블록 위에 입간판과 화분이 올라와 있어요. 혼자 들 수 있는 물건만 블록 밖으로 옮겨주세요.",
    checkpoints: [
      "혼자 들기 무거운 물건은 옮기지 말고 신고만 해요",
      "블록 양옆 60cm를 비워요",
      "정리 후 블록이 이어지는지 확인해요",
    ],
  },
  {
    id: "facility",
    title: "공원 운동기구 파손 여부 확인",
    place: "행복공원 운동시설",
    category: "시설 확인",
    distance: 120,
    minutes: 4,
    points: 15,
    difficulty: "어려움",
    icon: "construct-outline",
    bearing: 200,
    summary:
      "운동기구 손잡이와 고정 볼트가 헐거워졌다는 제보가 있어요. 직접 수리하지 말고 상태만 기록해주세요.",
    checkpoints: [
      "손잡이를 가볍게 흔들어 유격을 확인해요",
      "녹슬거나 갈라진 부분을 가까이서 촬영해요",
      "위험해 보이면 사용 자제 안내를 함께 남겨요",
    ],
  },
  {
    id: "bench",
    title: "벤치 주변 가벼운 쓰레기 정리",
    place: "하천 산책로 벤치",
    category: "환경",
    distance: 160,
    minutes: 5,
    points: 20,
    difficulty: "쉬움",
    icon: "leaf-outline",
    bearing: 285,
    summary:
      "벤치 아래에 캔과 종이컵이 모여 있어요. 장갑을 끼고 담을 수 있는 쓰레기만 정리해주세요.",
    checkpoints: [
      "날카로운 유리 조각은 직접 만지지 않아요",
      "캔·페트병은 분리해서 담아요",
      "정리 전후 사진을 남겨요",
    ],
  },
  {
    id: "sign",
    title: "공원 안내판 상태 확인하기",
    place: "행복공원 정문",
    category: "시설 확인",
    distance: 240,
    minutes: 2,
    points: 10,
    difficulty: "쉬움",
    icon: "reader-outline",
    bearing: 15,
    summary:
      "안내판 글씨가 지워졌는지, 야간에 보이는지 확인하는 3분 미션이에요. 지나가는 길에 가볍게 해보세요.",
    checkpoints: [
      "정면에서 안내판 전체를 촬영해요",
      "지워진 글씨나 낙서가 있으면 표시해요",
      "야간 조명이 함께 켜지는지 확인해요",
    ],
  },
  {
    id: "recycle",
    title: "분리배출 안내 스티커 훼손 확인",
    place: "빌라 앞 배출장",
    category: "환경",
    distance: 380,
    minutes: 6,
    points: 30,
    difficulty: "보통",
    icon: "trash-bin-outline",
    bearing: 150,
    summary:
      "배출장 안내 스티커가 떨어져 주민들이 요일을 헷갈리고 있어요. 남아 있는 스티커 상태를 기록해주세요.",
    checkpoints: [
      "요일 안내가 읽히는지 확인해요",
      "훼손된 스티커 위치를 사진에 담아요",
      "새 스티커가 필요한 개수를 적어요",
    ],
  },
  {
    id: "ramp",
    title: "경사로 손잡이 흔들림 확인",
    place: "주민센터 뒤편 경사로",
    category: "접근성",
    distance: 520,
    minutes: 7,
    points: 35,
    difficulty: "보통",
    icon: "trending-up-outline",
    bearing: 240,
    summary:
      "휠체어 이용자가 자주 쓰는 경사로예요. 손잡이가 흔들리거나 표면이 미끄럽지 않은지 살펴주세요.",
    checkpoints: [
      "손잡이를 양손으로 잡고 흔들림을 확인해요",
      "경사로 표면 파손·이물질을 확인해요",
      "비 올 때 미끄러운 구간을 메모해요",
    ],
  },
  {
    id: "fire",
    title: "소방차 전용구역 주차 여부 확인",
    place: "아파트 3동 앞",
    category: "공공질서",
    distance: 760,
    minutes: 8,
    points: 40,
    difficulty: "어려움",
    icon: "flame-outline",
    bearing: 320,
    summary:
      "전용구역에 상시 주차가 반복되고 있어요. 차주와 다투지 말고 구역 표시와 상황만 기록해주세요.",
    checkpoints: [
      "노면 표시가 지워졌는지 확인해요",
      "차량 번호는 촬영하지 않아요",
      "진입로 폭이 확보되는지 확인해요",
    ],
  },
  {
    id: "light",
    title: "어두운 보행로 가로등 점검",
    place: "학교 뒷길 보행로",
    category: "시설 확인",
    distance: 900,
    minutes: 9,
    points: 45,
    difficulty: "보통",
    icon: "bulb-outline",
    bearing: 70,
    summary:
      "야간에 꺼져 있는 가로등이 있다는 제보가 여러 번 들어왔어요. 해가 진 뒤에 확인하면 가장 정확해요.",
    checkpoints: [
      "꺼진 가로등의 관리번호를 확인해요",
      "구간 전체 밝기를 사진으로 남겨요",
      "인적이 드문 시간대는 피해요",
    ],
  },
] as const;

export type NearbyMission = (typeof nearbyMissions)[number];

const difficultyRank = { 쉬움: 0, 보통: 1, 어려움: 2 } as const;

/** 필터 기본값과 다른 항목 수. 상단바 필터 버튼의 배지에 쓴다. */
export function countActiveFilters(filters: MissionFilters) {
  let count = 0;
  if (filters.category !== DEFAULT_FILTERS.category) count += 1;
  if (filters.difficulty !== DEFAULT_FILTERS.difficulty) count += 1;
  if (filters.distance !== DEFAULT_FILTERS.distance) count += 1;
  if (filters.minutes !== DEFAULT_FILTERS.minutes) count += 1;
  if (filters.points !== DEFAULT_FILTERS.points) count += 1;
  return count;
}

export function filterMissions(filters: MissionFilters): NearbyMission[] {
  return nearbyMissions
    .filter(
      (mission) =>
        (filters.distance === DISTANCE_ANY ||
          mission.distance <= filters.distance) &&
        (filters.minutes === TIME_ANY || mission.minutes <= filters.minutes) &&
        (filters.points === POINTS_ANY || mission.points >= filters.points) &&
        (filters.category === "전체" || mission.category === filters.category) &&
        (filters.difficulty === "전체" ||
          mission.difficulty === filters.difficulty),
    )
    .sort((a, b) => {
      if (filters.sort === "points") return b.points - a.points;
      if (filters.sort === "time") return a.minutes - b.minutes;
      if (filters.sort === "difficulty")
        return difficultyRank[a.difficulty] - difficultyRank[b.difficulty];
      return a.distance - b.distance;
    });
}

/** 필터 요약 문구. 상단바에서 현재 조건을 한 줄로 보여준다. */
export function summarizeFilters(filters: MissionFilters) {
  return [
    filters.distance === DISTANCE_ANY
      ? "거리 상관없음"
      : `${filters.distance}m 이내`,
    filters.minutes === TIME_ANY ? "시간 상관없음" : `${filters.minutes}분 이내`,
    filters.points === POINTS_ANY
      ? "포인트 상관없음"
      : `${filters.points}P 이상`,
  ].join(" · ");
}
