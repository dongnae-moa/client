import { apiRequest } from "./client";

/**
 * 퀘스트(미션) 생성 엔드포인트.
 *
 * 다른 API가 모두 `/v1/...` 아래에 있어 같은 규칙을 따랐다. 서버 경로가 다르면 여기만 고치면 된다.
 */
const CREATE_QUEST_PATH = "/v1/quests";

/** 서버의 CreateQuestRequest. 이 네 값이 JSON 파트로 들어간다. */
export type CreateQuestRequest = {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
};

/** 업로드할 현장 사진. ImagePicker가 준 값을 그대로 담는다. */
export type QuestImage = {
  uri: string;
  name: string;
  /** Android는 바이너리 파트에 content-type이 없으면 요청을 거부한다. */
  type: string;
};

/**
 * 미션을 만든다. `request`(JSON) + `image`(파일) 두 파트를 가진 multipart 요청이다.
 *
 * JSON 파트에 Content-Type을 붙이는 게 핵심이다. 서버가 `request` 파트를 객체로 변환하려면
 * 그 파트가 application/json이어야 하는데, RN의 FormData는 값 객체의 `type`을 그대로 파트
 * 헤더로 넣어주기 때문에(Libraries/Network/FormData.js의 getParts) 문자열 파트에도 붙일 수 있다.
 * 네이티브도 이를 그대로 사용한다(Android NetworkingModule은 파트 헤더의 content-type으로
 * RequestBody를 만들고, iOS는 파트의 `string`을 본문으로 쓴다).
 *
 * 타입 단언이 필요한 이유는 RN의 FormData 타입이 파일 파트(`uri` 필수)만 표현하고 있어서다.
 */
export async function createQuest(
  request: CreateQuestRequest,
  image: QuestImage,
): Promise<unknown> {
  const form = new FormData();
  form.append("request", {
    string: JSON.stringify(request),
    type: "application/json",
  } as unknown as Blob);
  form.append("image", {
    uri: image.uri,
    name: image.name,
    type: image.type,
  } as unknown as Blob);

  return apiRequest<unknown>(CREATE_QUEST_PATH, {
    method: "POST",
    body: form,
  });
}
