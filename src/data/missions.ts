import type { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { destinationPoint, type Coords } from "../utils/geo";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export const difficulties = ["전체", "쉬움", "보통", "어려움"] as const;
export type Difficulty = "쉬움" | "보통" | "어려움";

/** 서버가 내려주는 미션 진행 상태. */
export type MissionStatus = "RECRUITING" | "IN_PROGRESS" | "COMPLETED";

/** 상태별 표시 정보. 지도 핀·목록 카드·상세 시트가 같은 값을 쓴다. */
export const statusMeta: Record<
  MissionStatus,
  { label: string; icon: IoniconName; tone: "green" | "orange" | "muted" }
> = {
  RECRUITING: { label: "모집 중", icon: "megaphone-outline", tone: "green" },
  IN_PROGRESS: { label: "진행 중", icon: "walk-outline", tone: "orange" },
  COMPLETED: { label: "완료", icon: "checkmark-done-outline", tone: "muted" },
};

/** 상단바 상태 칩. value가 "전체"면 상태 조건을 걸지 않는다. */
export const statusFilters = [
  { value: "전체", label: "전체" },
  { value: "RECRUITING", label: statusMeta.RECRUITING.label },
  { value: "IN_PROGRESS", label: statusMeta.IN_PROGRESS.label },
  { value: "COMPLETED", label: statusMeta.COMPLETED.label },
] as const;

export type StatusFilter = (typeof statusFilters)[number]["value"];

/** 행정동 정보. 미션이 속한 동네를 보여줄 때 쓴다. */
export type Neighborhood = {
  name: string;
  sido: string;
  sigungu: string;
};

/**
 * 미션 하나. 서버 응답 스키마와 1:1로 맞춘 형태다.
 *
 * `minutes`·`rewardPoint`·`difficulty`·`checkpoints`는 서버에서 AI가 생성해 내려준다.
 * 위치는 `latitude`/`longitude`가 원본이고, `distanceMeters`는 서버가 요청 시점의
 * 사용자 위치를 기준으로 계산해준 값이다(목록 표시·거리 필터용).
 */
export type Mission = {
  id: string;
  title: string;
  imageUrl: string;
  distanceMeters: number;
  status: MissionStatus;
  minutes: number;
  rewardPoint: number;
  difficulty: Difficulty;
  authorNickname: string;
  neighborhood: Neighborhood;
  latitude: number;
  longitude: number;
  description: string;
  checkpoints: readonly string[];
};

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
  status: "전체" as StatusFilter,
  difficulty: "전체" as (typeof difficulties)[number],
  sort: "distance" as SortId,
};

export type MissionFilters = typeof DEFAULT_FILTERS;

/** 더미 미션이 놓이는 기준점(서울 종로구 청운동). */
export const DUMMY_ANCHOR: Coords = { latitude: 37.5876, longitude: 126.9686 };

const JONGNO = { sido: "서울특별시", sigungu: "종로구" } as const;

/**
 * 더미 미션 씨앗.
 *
 * 좌표를 직접 적는 대신 기준점에서의 `bearing`(북=0°, 시계방향)만 두고, 생성 시점에
 * `distanceMeters`와 함께 위경도로 변환한다. 이렇게 하면 좌표와 `distanceMeters`가 항상
 * 서로 맞아서 거리 필터 값과 지도에 보이는 거리가 어긋나지 않는다. `bearing`은 더미를
 * 만들 때만 쓰이고 `Mission`에는 남지 않는다.
 */
type MissionSeed = Omit<Mission, "latitude" | "longitude"> & {
  bearing: number;
};

const missionSeeds: readonly MissionSeed[] = [
  {
    id: "1",
    title: "인도를 막고 있는 공유자전거를 지정 구역으로 이동",
    imageUrl: "https://picsum.photos/seed/dongnae-bike/640/420",
    distanceMeters: 20,
    status: "RECRUITING",
    minutes: 3,
    rewardPoint: 20,
    difficulty: "쉬움",
    authorNickname: "골목산책러",
    neighborhood: { name: "청운동", ...JONGNO },
    bearing: 35,
    description:
      "보도 가운데 세워진 공유자전거 때문에 유모차와 휠체어가 지나가기 어려운 상태예요. 근처 지정 주차 구역으로 옮겨주세요.",
    checkpoints: [
      "옮기기 전 자전거가 놓인 상태를 사진으로 남겨요",
      "지정 구역 안쪽에 바퀴를 맞춰 세워요",
      "옮긴 뒤 보도 폭이 확보됐는지 확인해요",
    ],
  },
  {
    id: "2",
    title: "점자블록 위 이동 가능한 방해물 정리",
    imageUrl: "https://picsum.photos/seed/dongnae-access/640/420",
    distanceMeters: 80,
    status: "RECRUITING",
    minutes: 3,
    rewardPoint: 25,
    difficulty: "쉬움",
    authorNickname: "동네지킴이",
    neighborhood: { name: "청운동", ...JONGNO },
    bearing: 110,
    description:
      "점자블록 위에 입간판과 화분이 올라와 있어요. 혼자 들 수 있는 물건만 블록 밖으로 옮겨주세요.",
    checkpoints: [
      "혼자 들기 무거운 물건은 옮기지 말고 신고만 해요",
      "블록 양옆 60cm를 비워요",
      "정리 후 블록이 이어지는지 확인해요",
    ],
  },
  {
    id: "3",
    title: "공원 운동기구 파손 여부 확인",
    imageUrl: "https://picsum.photos/seed/dongnae-facility/640/420",
    distanceMeters: 120,
    status: "IN_PROGRESS",
    minutes: 4,
    rewardPoint: 15,
    difficulty: "어려움",
    authorNickname: "행복공원단골",
    neighborhood: { name: "효자동", ...JONGNO },
    bearing: 200,
    description:
      "운동기구 손잡이와 고정 볼트가 헐거워졌다는 제보가 있어요. 직접 수리하지 말고 상태만 기록해주세요.",
    checkpoints: [
      "손잡이를 가볍게 흔들어 유격을 확인해요",
      "녹슬거나 갈라진 부분을 가까이서 촬영해요",
      "위험해 보이면 사용 자제 안내를 함께 남겨요",
    ],
  },
  {
    id: "4",
    title: "벤치 주변 가벼운 쓰레기 정리",
    imageUrl: "https://picsum.photos/seed/dongnae-bench/640/420",
    distanceMeters: 160,
    status: "RECRUITING",
    minutes: 5,
    rewardPoint: 20,
    difficulty: "쉬움",
    authorNickname: "하천러너",
    neighborhood: { name: "부암동", ...JONGNO },
    bearing: 285,
    description:
      "벤치 아래에 캔과 종이컵이 모여 있어요. 장갑을 끼고 담을 수 있는 쓰레기만 정리해주세요.",
    checkpoints: [
      "날카로운 유리 조각은 직접 만지지 않아요",
      "캔·페트병은 분리해서 담아요",
      "정리 전후 사진을 남겨요",
    ],
  },
  {
    id: "5",
    title: "공원 안내판 상태 확인하기",
    imageUrl: "https://picsum.photos/seed/dongnae-sign/640/420",
    distanceMeters: 240,
    status: "COMPLETED",
    minutes: 2,
    rewardPoint: 10,
    difficulty: "쉬움",
    authorNickname: "출근길메모",
    neighborhood: { name: "효자동", ...JONGNO },
    bearing: 15,
    description:
      "안내판 글씨가 지워졌는지, 야간에 보이는지 확인하는 3분 미션이에요. 지나가는 길에 가볍게 해보세요.",
    checkpoints: [
      "정면에서 안내판 전체를 촬영해요",
      "지워진 글씨나 낙서가 있으면 표시해요",
      "야간 조명이 함께 켜지는지 확인해요",
    ],
  },
  {
    id: "6",
    title: "분리배출 안내 스티커 훼손 확인",
    imageUrl: "https://picsum.photos/seed/dongnae-recycle/640/420",
    distanceMeters: 380,
    status: "RECRUITING",
    minutes: 6,
    rewardPoint: 30,
    difficulty: "보통",
    authorNickname: "청운동주민",
    neighborhood: { name: "청운동", ...JONGNO },
    bearing: 150,
    description:
      "배출장 안내 스티커가 떨어져 주민들이 요일을 헷갈리고 있어요. 남아 있는 스티커 상태를 기록해주세요.",
    checkpoints: [
      "요일 안내가 읽히는지 확인해요",
      "훼손된 스티커 위치를 사진에 담아요",
      "새 스티커가 필요한 개수를 적어요",
    ],
  },
  {
    id: "7",
    title: "경사로 손잡이 흔들림 확인",
    imageUrl: "https://picsum.photos/seed/dongnae-ramp/640/420",
    distanceMeters: 520,
    status: "IN_PROGRESS",
    minutes: 7,
    rewardPoint: 35,
    difficulty: "보통",
    authorNickname: "무장애길찾기",
    neighborhood: { name: "사직동", ...JONGNO },
    bearing: 240,
    description:
      "휠체어 이용자가 자주 쓰는 경사로예요. 손잡이가 흔들리거나 표면이 미끄럽지 않은지 살펴주세요.",
    checkpoints: [
      "손잡이를 양손으로 잡고 흔들림을 확인해요",
      "경사로 표면 파손·이물질을 확인해요",
      "비 올 때 미끄러운 구간을 메모해요",
    ],
  },
  {
    id: "8",
    title: "소방차 전용구역 주차 여부 확인",
    imageUrl: "https://picsum.photos/seed/dongnae-fire/640/420",
    distanceMeters: 760,
    status: "RECRUITING",
    minutes: 8,
    rewardPoint: 40,
    difficulty: "어려움",
    authorNickname: "3동입주민",
    neighborhood: { name: "평창동", ...JONGNO },
    bearing: 320,
    description:
      "전용구역에 상시 주차가 반복되고 있어요. 차주와 다투지 말고 구역 표시와 상황만 기록해주세요.",
    checkpoints: [
      "노면 표시가 지워졌는지 확인해요",
      "차량 번호는 촬영하지 않아요",
      "진입로 폭이 확보되는지 확인해요",
    ],
  },
  {
    id: "9",
    title: "어두운 보행로 가로등 점검",
    imageUrl: "https://picsum.photos/seed/dongnae-light/640/420",
    distanceMeters: 900,
    status: "RECRUITING",
    minutes: 9,
    rewardPoint: 45,
    difficulty: "보통",
    authorNickname: "야간산책",
    neighborhood: { name: "삼청동", ...JONGNO },
    bearing: 70,
    description:
      "야간에 꺼져 있는 가로등이 있다는 제보가 여러 번 들어왔어요. 해가 진 뒤에 확인하면 가장 정확해요.",
    checkpoints: [
      "꺼진 가로등의 관리번호를 확인해요",
      "구간 전체 밝기를 사진으로 남겨요",
      "인적이 드문 시간대는 피해요",
    ],
  },
];

/**
 * 더미 미션 목록을 만든다. 서버 연동 전까지 이 함수가 미션 목록 API 자리를 대신한다.
 *
 * @param anchor 미션을 흩뿌릴 기준점. 기본값은 청운동이고, 화면에서 현재 위치를 넘기면
 *   어디서 앱을 켜도 핀이 내 주변에 찍혀 UI를 확인할 수 있다. 이때 `neighborhood`는
 *   씨앗에 적힌 종로구 값이 그대로 남으므로 실제 동네와 다를 수 있다.
 */
export function buildDummyMissions(anchor: Coords = DUMMY_ANCHOR): Mission[] {
  return missionSeeds.map(({ bearing, ...mission }) => ({
    ...mission,
    ...destinationPoint(anchor, mission.distanceMeters, bearing),
  }));
}

/** 청운동 기준 더미 목록. 위치가 필요 없는 화면에서 바로 쓸 수 있다. */
export const dummyMissions = buildDummyMissions();

const difficultyRank = { 쉬움: 0, 보통: 1, 어려움: 2 } as const;

/** 필터 기본값과 다른 항목 수. 상단바 필터 버튼의 배지에 쓴다. */
export function countActiveFilters(filters: MissionFilters) {
  let count = 0;
  if (filters.status !== DEFAULT_FILTERS.status) count += 1;
  if (filters.difficulty !== DEFAULT_FILTERS.difficulty) count += 1;
  if (filters.distance !== DEFAULT_FILTERS.distance) count += 1;
  if (filters.minutes !== DEFAULT_FILTERS.minutes) count += 1;
  if (filters.points !== DEFAULT_FILTERS.points) count += 1;
  return count;
}

export function filterMissions(
  missions: readonly Mission[],
  filters: MissionFilters,
): Mission[] {
  return missions
    .filter(
      (mission) =>
        (filters.distance === DISTANCE_ANY ||
          mission.distanceMeters <= filters.distance) &&
        (filters.minutes === TIME_ANY || mission.minutes <= filters.minutes) &&
        (filters.points === POINTS_ANY ||
          mission.rewardPoint >= filters.points) &&
        (filters.status === "전체" || mission.status === filters.status) &&
        (filters.difficulty === "전체" ||
          mission.difficulty === filters.difficulty),
    )
    .sort((a, b) => {
      if (filters.sort === "points") return b.rewardPoint - a.rewardPoint;
      if (filters.sort === "time") return a.minutes - b.minutes;
      if (filters.sort === "difficulty")
        return difficultyRank[a.difficulty] - difficultyRank[b.difficulty];
      return a.distanceMeters - b.distanceMeters;
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
