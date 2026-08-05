import { File } from "expo-file-system";
import { apiRequest } from "./client";

export type ParticipationStatus =
  | "JOINED"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED";

export type Participation = {
  id: number;
  questId: number;
  participantId: number;
  status: ParticipationStatus;
  proofImageUrl?: string | null;
  proofDescription?: string | null;
  rejectionReason?: string | null;
};

export type SubmitProofRequest = {
  proofDescription?: string;
};

/**
 * 퀘스트에 들어온 참여·제출 목록. 등록자가 심사할 때 쓴다.
 *
 * 참여 시작이 `POST /v1/quests/{questId}/participations`라 같은 컬렉션의 GET으로 뒀다.
 * 명세를 따로 받지 못해 추정한 경로이므로, 서버가 다르면 이 함수의 경로만 고치면 된다.
 */
export function getQuestParticipations(questId: number) {
  return apiRequest<Participation[]>(
    `/v1/quests/${questId}/participations`,
    {},
    { handleUnauthorized: false },
  );
}

/**
 * 제출된 인증을 승인한다. 서버가 참여자에게 rewardPoint를 즉시 지급하고
 * 퀘스트 상태를 COMPLETED로 바꾼다. 등록자 본인이 아니면 403이 온다.
 *
 * 응답 본문에는 쓸 만한 data가 없어서 결과를 읽지 않는다.
 */
export function approveParticipation(participationId: number) {
  return apiRequest<void>(`/v1/participations/${participationId}/approve`, {
    method: "POST",
  });
}

/** 제출된 인증을 사유와 함께 반려한다. 포인트는 지급되지 않는다. */
export function rejectParticipation(
  participationId: number,
  rejectionReason: string,
) {
  return apiRequest<void>(`/v1/participations/${participationId}/reject`, {
    method: "POST",
    body: JSON.stringify({ rejectionReason }),
  });
}

/** 로그인 사용자가 퀘스트 참여를 시작하고 제출에 필요한 participationId를 받는다. */
export function joinQuest(questId: number) {
  return apiRequest<Participation>(`/v1/quests/${questId}/participations`, {
    method: "POST",
  });
}

/**
 * 참여 완료 인증을 multipart/form-data로 제출한다.
 *
 * Expo fetch는 일반적인 React Native의 `{ uri, name, type }` 객체를 FormData 파일로
 * 처리하지 못하므로 퀘스트 등록과 동일하게 expo-file-system의 File을 사용한다.
 */
export async function submitParticipationProof(
  participationId: number,
  request: SubmitProofRequest,
  imageUri?: string | null,
) {
  const form = new FormData();
  const requestPart = new Blob([JSON.stringify(request)], {
    type: "application/json",
  });
  form.append("request", requestPart);

  if (imageUri) {
    const imagePart = new File(imageUri);
    form.append("image", imagePart as unknown as Blob);
  }

  return apiRequest<Participation>(
    `/v1/participations/${participationId}/proof`,
    {
      method: "POST",
      body: form,
    },
  );
}
