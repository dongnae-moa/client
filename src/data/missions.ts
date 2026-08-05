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
  imageUrl: string | number;
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

/** 로그인한 사용자와 미션 작성자가 같은지 비교한다. */
export function isMissionCreatedByUser(
  mission: Pick<Mission, "authorNickname">,
  nickname?: string | null,
) {
  const currentNickname = nickname?.trim();
  return Boolean(
    currentNickname && mission.authorNickname.trim() === currentNickname,
  );
}

/** 본인이 만든 미션을 사용자에게 보여줄 목록에서 완전히 제외한다. */
export function excludeMissionsCreatedByUser(
  missions: readonly Mission[],
  nickname?: string | null,
) {
  return missions.filter(
    (mission) => !isMissionCreatedByUser(mission, nickname),
  );
}

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
    imageUrl: require("@/assets/images/missions/gcoo.png"),
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
    imageUrl: require("@/assets/images/missions/tactile-block.png"),
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
    imageUrl: require("@/assets/images/missions/exercise-equipment.png"),
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
    imageUrl: require("@/assets/images/missions/bench-trash.png"),
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
    title: "지도에 표시된 공중화장실 운영 여부 확인",
    imageUrl: require("@/assets/images/missions/public-restroom.png"),
    distanceMeters: 240,
    status: "COMPLETED",
    minutes: 3,
    rewardPoint: 15,
    difficulty: "쉬움",
    authorNickname: "출근길메모",
    neighborhood: { name: "효자동", ...JONGNO },
    bearing: 15,
    description:
      "지도에 등록된 공중화장실이 실제로 운영 중인지 확인해주세요. 출입 가능 여부와 운영 시간을 현장 사진으로 남겨요.",
    checkpoints: [
      "입구와 운영 안내문을 함께 촬영해요",
      "잠겨 있거나 공사 중인지 확인해요",
      "운영 시간이 보이면 사진에 담아요",
    ],
  },
  {
    id: "6",
    title: "가로등 점등 여부 확인",
    imageUrl: require("@/assets/images/missions/streetlight.png"),
    distanceMeters: 380,
    status: "RECRUITING",
    minutes: 3,
    rewardPoint: 15,
    difficulty: "쉬움",
    authorNickname: "청운동주민",
    neighborhood: { name: "청운동", ...JONGNO },
    bearing: 150,
    description:
      "야간 보행로의 가로등이 정상적으로 켜지는지 확인해주세요. 고장으로 보이는 가로등은 관리번호까지 기록해요.",
    checkpoints: [
      "해가 진 뒤 안전한 시간에 확인해요",
      "꺼진 가로등과 주변 밝기를 함께 촬영해요",
      "기둥의 관리번호를 기록해요",
    ],
  },
  {
    id: "7",
    title: "공원 안내판이 나뭇가지에 가려졌는지 확인",
    imageUrl: require("@/assets/images/missions/park-sign.png"),
    distanceMeters: 520,
    status: "IN_PROGRESS",
    minutes: 4,
    rewardPoint: 15,
    difficulty: "쉬움",
    authorNickname: "무장애길찾기",
    neighborhood: { name: "사직동", ...JONGNO },
    bearing: 240,
    description:
      "공원 안내판이 나뭇가지에 가려져 이용자가 내용을 읽기 어렵다는 제보예요. 가려진 정도를 사진으로 확인해주세요.",
    checkpoints: [
      "안내판 정면 전체를 촬영해요",
      "가려진 글자 범위를 확인해요",
      "직접 가지를 자르지 말고 상태만 제보해요",
    ],
  },
  {
    id: "8",
    title: "도로 파손·맨홀 이상 제보",
    imageUrl: require("@/assets/images/missions/road-damage.png"),
    distanceMeters: 760,
    status: "RECRUITING",
    minutes: 2,
    rewardPoint: 10,
    difficulty: "어려움",
    authorNickname: "3동입주민",
    neighborhood: { name: "평창동", ...JONGNO },
    bearing: 320,
    description:
      "도로 표면이 파이거나 맨홀 주변이 내려앉은 곳을 발견하면 안전한 위치에서 사진과 상태를 남겨주세요.",
    checkpoints: [
      "차도에 직접 들어가지 않아요",
      "파손 부위와 주변 위치가 함께 보이게 촬영해요",
      "차량 통행에 미치는 정도를 선택해요",
    ],
  },
  {
    id: "9",
    title: "신호등 고장 여부 현장 확인",
    imageUrl: require("@/assets/images/missions/traffic-light.png"),
    distanceMeters: 900,
    status: "RECRUITING",
    minutes: 3,
    rewardPoint: 10,
    difficulty: "보통",
    authorNickname: "야간산책",
    neighborhood: { name: "삼청동", ...JONGNO },
    bearing: 70,
    description:
      "보행 신호등이 동시에 켜지거나 깜빡인다는 제보가 있어요. 안전한 인도에서 작동 상태를 확인해주세요.",
    checkpoints: [
      "차도에 내려가지 않고 인도에서 확인해요",
      "신호 변화가 보이도록 사진이나 영상을 남겨요",
      "교차로 이름과 방향을 기록해요",
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

/** 이 거리보다 가까우면 미터 대신 "근처"로 보여준다. */
export const NEARBY_DISTANCE_METERS = 10;

/**
 * 거리 표시 문구. 서버가 소수점까지 주더라도 화면에는 반올림한 정수만 쓴다.
 *
 * 아주 가까울 때 "3m"처럼 적으면 오히려 위치가 정확한 것처럼 보이는데, GPS 오차가 그보다
 * 크기 때문에 "근처"로 눕힌다. 거리 필터는 반올림하지 않은 원래 값으로 계산한다.
 */
export function formatDistance(distanceMeters: number) {
  if (distanceMeters < NEARBY_DISTANCE_METERS) return "근처";
  return `${Math.round(distanceMeters)}m`;
}

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
