# 동네모아 Dongnae-Moa

<p align="center">
  <img src="./assets/images/로고임.png" width="240" alt="동네모아 로고" />
</p>

> 주민이 발견한 동네 문제를 짧은 미션으로 바꾸고, 이웃이 함께 해결·인증하며 지역의 변화를 쌓는 주민 참여 플랫폼

GEEKS 2026 `지속가능한 도시와 공동체` · Team 12

## 왜 동네모아인가요?

동네 문제는 발견되어도 신고 이후의 진행 상황이 보이지 않거나, 한 사람이 해결하기에는 번거로운 경우가 많습니다. 동네모아는 문제를 누구나 참여할 수 있는 마이크로 미션으로 전환하고, 사진 인증과 등록자 검토를 거쳐 실제 행동으로 이어지게 합니다.

```text
문제 발견 → AI 미션 생성 → 주변 주민 참여 → 사진 인증 → 등록자 승인 → 포인트와 동네 기여
```

## 핵심 기능

### 실제 서버와 연결된 기능

- 4장 온보딩, 단계형 회원가입·로그인, GPS 기반 동네 설정
- 주변 미션 이미지·거리·난이도·시간·포인트 조회
- 거리·카테고리·시간·난이도·포인트 필터와 정렬
- 지도/리스트 보기 전환, 현재 위치와 미션 핀
- 사진을 포함한 미션 등록과 Groq AI 기반 시간·포인트·난이도·체크포인트 산정
- 미션 참여 후 사진·설명 인증 제출
- 미션 등록자의 인증 승인·반려와 승인 시 참여자 포인트 지급
- 본인이 만든 미션의 탐색 결과 제외, 저장 미션과 인증 심사 화면

### 발표용 데모 기능

- 기프티콘·동네 할인·프로필 장식 보상 상점
- 구매 확인, 내 혜택 보관함, 선물 코드 공유, 프로필 장식 적용
- 동네 소식·인증·이야기 피드, 글/사진 업로드, 좋아요·댓글·투표
- Community XP, Personal XP, 배지·랭크·활동 요약

> 보상 상점과 커뮤니티·XP 데이터는 현재 기기 로컬 데모입니다. 실제 포인트 차감·재고 트랜잭션과 서버 동기화는 후속 범위입니다.

## 데모 시나리오

1. 회원가입하고 현재 위치로 동네를 설정합니다.
2. 홈에서 추천 미션을 확인하거나 미션 탭에서 조건을 필터링합니다.
3. 현장 사진과 설명으로 새 미션을 등록하고 AI 산정 결과를 확인합니다.
4. 다른 계정으로 미션에 참여하고 완료 인증을 제출합니다.
5. 등록자 계정에서 인증을 승인합니다.
6. 참여자 포인트가 증가한 것을 확인하고 상점의 혜택 사용 흐름을 시연합니다.

## 기술 스택

- Expo 57 · React Native 0.86 · React 19 · TypeScript
- Expo Router
- React Native Reanimated · Gesture Handler · Blur · Glass Effect
- React Native Maps · Expo Go WebView 지도 fallback
- Expo Location · Image Picker · Secure Store · AsyncStorage
- Spring Boot API · PostgreSQL · JWT · Groq AI

## 프로젝트 구조

```text
src/
├── api/          # 인증·미션·참여·보상 API와 응답 타입
├── app/          # Expo Router 화면
├── auth/         # 세션 상태와 라우팅 phase
├── components/   # 지도·필터·미션 상세·인증·내비게이션
├── data/         # 발표 데이터와 기기 로컬 저장소
├── hooks/        # 위치 권한·좌표 조회
└── theme/        # 라이트/다크 디자인 토큰과 지도 스타일
```

백엔드 저장소: [dongnae-moa/server](https://github.com/dongnae-moa/server)

## 실행 방법

### 1. 요구 사항

- Node.js와 npm
- Android/iOS 실기기 또는 에뮬레이터
- 지도 네이티브 빌드를 사용할 경우 Google Maps API key

### 2. 환경 변수

프로젝트 루트에 `.env`를 만듭니다.

```dotenv
EXPO_PUBLIC_API_URL=http://165.140.22.60:8080
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
EXPO_PUBLIC_GOOGLE_MAP_ID_DARK=your_dark_map_id
EXPO_PUBLIC_GOOGLE_MAP_ID_LIGHT=your_light_map_id
```

`EXPO_PUBLIC_API_URL`을 생략하면 현재 배포 API 주소를 사용합니다. Expo Go에서는 별도 WebView 지도 fallback이 동작합니다.

### 3. 설치와 실행

```bash
npm install
npx expo start --go
```

네이티브 개발 빌드는 다음 명령을 사용합니다.

```bash
npm run android
# 또는
npm run ios
```

## 주요 API

| 흐름 | Method | Endpoint |
|---|---|---|
| 회원가입 | `POST` | `/v1/auth/signup` |
| 로그인 | `POST` | `/v1/auth/login` |
| 내 정보 | `GET` | `/v1/users/me` |
| 동네 설정 | `POST` | `/v1/neighborhoods/join` |
| 미션 등록·목록 | `POST` / `GET` | `/v1/quests` |
| 미션 참여 | `POST` | `/v1/quests/{questId}/participations` |
| 인증 제출 | `POST` | `/v1/participations/{participationId}/proof` |
| 인증 승인·반려 | `POST` | `/v1/participations/{participationId}/approve`, `/reject` |

## 현재 범위와 후속 과제

- 서버 refresh token·logout API와 클라이언트 세션 계약 통일
- 보상 상품·구매·재고·보관함의 서버 트랜잭션 구현
- 커뮤니티·XP·배지·랭킹·신고 서버화
- 참여 취소와 포인트 정책 확정
- PostgreSQL 기반 서버 테스트와 핵심 사용자 흐름 E2E 자동화

## 검증

```bash
npx tsc --noEmit
```

현재 `main` 기준 TypeScript 검사를 통과합니다. 백엔드 테스트는 별도 저장소에서 관리합니다.

## 팀

| 역할 | 이름 |
|---|---|
| 기획 | 민지호 |
| 백엔드 | 배재현 |
| 프론트엔드 | 신성은진 |
