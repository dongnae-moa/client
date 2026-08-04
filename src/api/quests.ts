import { File } from "expo-file-system";
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

/**
 * 미션을 만든다. `request`(JSON) + `image`(파일) 두 파트를 가진 multipart 요청이다.
 *
 * 파트 형식이 까다로운 이유가 있다. 이 앱의 `fetch`는 Expo가 설치한 WinterCG 구현이고,
 * multipart를 네이티브가 아니라 JS에서 직접 만든다(expo/src/winter/fetch/convertFormData.ts).
 * 그 변환기가 받아주는 값은 세 가지뿐이다.
 *
 *   1. 문자열                      → 파트 헤더에 content-type이 붙지 않는다
 *   2. `Blob` 인스턴스             → blob의 `type`이 파트 content-type이 된다
 *   3. `bytes()`를 가진 객체       → 같은 방식으로 `type`·`name`을 읽는다
 *
 * 그래서 흔히 쓰는 `{ uri, name, type }` 파일 파트나 `{ string, type }` 객체를 넣으면
 * "Unsupported FormDataPart implementation"으로 거절된다. RN 네이티브 업로드 경로라면
 * 동작하지만 Expo fetch는 그 경로를 타지 않는다.
 *
 * - `request`: 서버가 JSON으로 바인딩할 수 있게 content-type이 필요하므로 Blob으로 만든다.
 *   RN의 Blob은 문자열 파트만 받는다(ArrayBuffer·Uint8Array는 명시적으로 거부한다).
 * - `image`: 위 이유로 Blob을 직접 만들 수 없다(바이트 배열을 넣을 수 없다). expo-file-system의
 *   `File`이 `bytes()`·`name`·`type`을 모두 제공해서 3번 경로로 그대로 실려 간다. 파일 이름과
 *   MIME 타입은 File이 실제 파일에서 알아낸다.
 */
export async function createQuest(
  request: CreateQuestRequest,
  imageUri: string,
): Promise<unknown> {
  // DEBUG: 보낼 JSON과 사진 경로.
  console.log("[quest] 등록 시작", { request, imageUri });

  const form = new FormData();

  // DEBUG: JSON 파트. RN Blob이 문자열을 못 받으면 여기서 터진다.
  let jsonPart: Blob;
  try {
    jsonPart = new Blob([JSON.stringify(request)], {
      type: "application/json",
    });
    console.log("[quest] request 파트 생성", {
      size: jsonPart.size,
      type: jsonPart.type,
    });
  } catch (blobError) {
    console.log("[quest] ✗ request 파트(Blob) 생성 실패", blobError);
    throw blobError;
  }
  form.append("request", jsonPart);

  // DEBUG: 이미지 파트. expo-file-system 네이티브 모듈이 없으면(리빌드 안 했으면) 여기서 터진다.
  // 파일이 없거나 size가 0이면 서버가 받아도 빈 파일이 된다.
  let filePart: File;
  try {
    filePart = new File(imageUri);
    console.log("[quest] image 파트 생성", {
      uri: filePart.uri,
      exists: filePart.exists,
      size: filePart.size,
      type: filePart.type,
      name: filePart.name,
      hasBytes: typeof (filePart as { bytes?: unknown }).bytes === "function",
    });
  } catch (fileError) {
    console.log("[quest] ✗ image 파트(File) 생성 실패", fileError);
    throw fileError;
  }
  form.append("image", filePart as unknown as Blob);

  // DEBUG: 최종 파트 목록. Expo fetch는 문자열·Blob·bytes() 객체만 받으므로 종류를 확인한다.
  try {
    const parts = Array.from(
      (form as unknown as { entries: () => Iterable<[string, unknown]> }).entries(),
    ).map(([name, value]) => ({
      name,
      kind: typeof value === "string" ? "string" : (value as object)?.constructor?.name,
      isBlob: value instanceof Blob,
      hasBytes: typeof (value as { bytes?: unknown })?.bytes === "function",
    }));
    console.log("[quest] FormData 파트", parts);
  } catch (partsError) {
    console.log("[quest] 파트 목록을 읽지 못했어요", partsError);
  }

  try {
    const result = await apiRequest<unknown>(CREATE_QUEST_PATH, {
      method: "POST",
      body: form,
    });
    console.log("[quest] 등록 성공", result);
    return result;
  } catch (requestError) {
    console.log("[quest] ✗ 등록 실패", {
      name: (requestError as Error)?.name,
      message: (requestError as Error)?.message,
      status: (requestError as { status?: number })?.status,
    });
    throw requestError;
  }
}
