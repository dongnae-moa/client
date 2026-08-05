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
