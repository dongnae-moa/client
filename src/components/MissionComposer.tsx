import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "../api/client";
import { createQuest } from "../api/quests";
import { useCurrentLocation } from "../hooks/useCurrentLocation";
import { useTheme } from "../theme/ThemeContext";

type MissionComposerProps = {
  visible: boolean;
  /** 등록 기준이 되는 동네 이름. 아직 정해지지 않았으면 비워둔다. */
  neighborhoodName?: string | null;
  onClose: () => void;
  /** 등록이 성공했을 때. 화면이 안내를 띄우거나 목록을 새로 불러오는 데 쓴다. */
  onCreated: (title: string) => void;
};

/**
 * 미션 만들기 컴포저.
 *
 * 커뮤니티 글쓰기(community.tsx의 ComposerModal)와 같은 모달 방식이라 홈·미션 탭 어디서
 * 열어도 흐름이 같다. 등록은 `POST /v1/quests` multipart 요청으로 바로 보낸다.
 *
 * 위치는 서버가 요구하는 값이라 실제 좌표만 쓴다. 권한이 없어 좌표를 못 구했으면 기본 좌표로
 * 대신 보내지 않고 등록을 막는다(엉뚱한 곳에 미션이 생기는 게 더 나쁘다).
 *
 * 예상 시간·포인트·난이도·체크포인트는 서버에서 AI가 채우는 값이라(`src/data/missions.ts`의
 * Mission 타입 참고) 여기서 입력받지 않는다.
 */
export default function MissionComposer({
  visible,
  neighborhoodName,
  onClose,
  onCreated,
}: MissionComposerProps) {
  const { colors } = useTheme();
  // 모달이 열려 있을 때만 위치를 잡는다. 홈 탭에서 미리 권한을 묻지 않게 하려는 것이다.
  const { coords, hasPermission, settled } = useCurrentLocation(visible);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    photoUri !== null &&
    coords !== null &&
    !submitting;

  const reset = () => {
    setTitle("");
    setDescription("");
    setPhotoUri(null);
    setError(null);
  };

  const close = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled) return;
    setPhotoUri(result.assets[0].uri);
  };

  const submit = async () => {
    if (!canSubmit || !photoUri || !coords) return;
    const createdTitle = title.trim();
    setSubmitting(true);
    setError(null);
    try {
      await createQuest(
        {
          title: createdTitle,
          description: description.trim(),
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
        photoUri,
      );
      reset();
      onCreated(createdTitle);
    } catch (requestError) {
      // DEBUG: 화면에 보이는 문구만으로는 원인을 알 수 없어 원본 에러를 그대로 남긴다.
      console.log("[composer] ✗ 등록 실패", requestError);
      const status = (requestError as { status?: number })?.status;
      setError(
        requestError instanceof ApiError
          ? `${requestError.message} (HTTP ${requestError.status})`
          : `미션을 등록하지 못했어요: ${
              (requestError as Error)?.message ?? "알 수 없는 오류"
            }${status ? ` (HTTP ${status})` : ""}`,
      );
      console.log(requestError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={close}
    >
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background }]}
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Pressable accessibilityRole="button" onPress={close} hitSlop={8}>
              <Text style={[styles.cancel, { color: colors.muted }]}>취소</Text>
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              미션 만들기
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSubmit, busy: submitting }}
              disabled={!canSubmit}
              onPress={() => {
                void submit();
              }}
              hitSlop={8}
            >
              <Text
                style={[
                  styles.publish,
                  { color: canSubmit ? colors.green : colors.faint },
                ]}
              >
                {submitting ? "등록 중" : "등록"}
              </Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.body}
          >
            <Text style={[styles.label, { color: colors.text }]}>
              현장 사진 <Text style={{ color: colors.orange }}>*</Text>
            </Text>
            {photoUri ? (
              <View style={styles.photoWrap}>
                <Image
                  source={photoUri}
                  style={styles.photo}
                  contentFit="cover"
                  transition={160}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="사진 지우기"
                  onPress={() => setPhotoUri(null)}
                  style={styles.photoRemove}
                >
                  <Ionicons name="close" size={16} color="#fff" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  void pickPhoto();
                }}
                style={({ pressed }) => [
                  styles.photoPicker,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.photoIcon,
                    { backgroundColor: colors.greenSoft },
                  ]}
                >
                  <Ionicons
                    name="camera-outline"
                    size={22}
                    color={colors.green}
                  />
                </View>
                <Text style={[styles.photoHint, { color: colors.muted }]}>
                  현장 사진은 필수예요. 상황이 보이는 사진을 한 장 올려주세요.
                </Text>
              </Pressable>
            )}

            <Text style={[styles.label, { color: colors.text }]}>제목</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="무엇을 부탁하고 싶은지 한 줄로 적어주세요"
              placeholderTextColor={colors.faint}
              maxLength={60}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />

            <Text style={[styles.label, { color: colors.text }]}>설명</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="어디가 어떤 상태인지, 무엇을 해주면 좋을지 알려주세요"
              placeholderTextColor={colors.faint}
              multiline
              textAlignVertical="top"
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />

            {/* 위치는 서버 필수값이라 상태를 그대로 보여준다. 못 구했으면 등록도 막힌다. */}
            <View style={styles.metaRow}>
              <Ionicons
                name={coords ? "location" : "location-outline"}
                size={15}
                color={coords ? colors.greenInk : colors.orange}
              />
              <Text
                style={[
                  styles.metaText,
                  { color: coords ? colors.greenInk : colors.orange },
                ]}
              >
                {coords
                  ? neighborhoodName
                    ? `${neighborhoodName} · 현재 위치로 등록돼요`
                    : "현재 위치로 등록돼요"
                  : !settled
                    ? "현재 위치를 확인하는 중이에요"
                    : hasPermission
                      ? "위치를 확인하지 못했어요. 잠시 후 다시 시도해주세요."
                      : "위치 권한을 허용해야 미션을 등록할 수 있어요."}
              </Text>
            </View>

            {error ? (
              <Text
                accessibilityRole="alert"
                style={[styles.error, { color: colors.orange }]}
              >
                {error}
              </Text>
            ) : null}

            <View
              style={[
                styles.aiNote,
                {
                  backgroundColor: colors.surfaceRaised,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="sparkles-outline"
                size={16}
                color={colors.purple}
              />
              <Text style={[styles.aiNoteText, { color: colors.muted }]}>
                예상 소요 시간과 포인트, 난이도, 체크 포인트는 등록한 뒤 AI가
                정리해줘요.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  cancel: { fontFamily: "WantedSansR", fontSize: 14 },
  headerTitle: { fontFamily: "WantedSansB", fontSize: 16 },
  publish: { fontFamily: "WantedSansB", fontSize: 14 },
  body: { paddingBottom: 32, paddingHorizontal: 18, paddingTop: 18 },
  label: {
    fontFamily: "WantedSansB",
    fontSize: 12,
    marginBottom: 8,
    marginTop: 18,
  },
  photoPicker: {
    alignItems: "center",
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 1.5,
    gap: 9,
    paddingHorizontal: 18,
    paddingVertical: 22,
  },
  photoIcon: {
    alignItems: "center",
    borderRadius: 999,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  photoHint: {
    fontFamily: "WantedSansR",
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
  photoWrap: { position: "relative" },
  photo: { borderRadius: 16, height: 168, width: "100%" },
  photoRemove: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.62)",
    borderRadius: 999,
    height: 30,
    justifyContent: "center",
    position: "absolute",
    right: 10,
    top: 10,
    width: 30,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    fontFamily: "WantedSansR",
    fontSize: 13,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  textArea: { minHeight: 116 },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    marginTop: 16,
  },
  metaText: {
    flex: 1,
    fontFamily: "WantedSansB",
    fontSize: 11,
    lineHeight: 16,
  },
  error: {
    fontFamily: "WantedSansB",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 10,
  },
  aiNote: {
    alignItems: "flex-start",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  aiNoteText: {
    flex: 1,
    fontFamily: "WantedSansR",
    fontSize: 11,
    lineHeight: 16,
  },
  pressed: { opacity: 0.72 },
});
