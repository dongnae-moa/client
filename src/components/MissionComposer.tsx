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
import { useTheme } from "../theme/ThemeContext";

export type MissionDraft = {
  title: string;
  description: string;
  photoUri: string | null;
};

type MissionComposerProps = {
  visible: boolean;
  /** 등록 기준이 되는 동네 이름. 아직 정해지지 않았으면 비워둔다. */
  neighborhoodName?: string | null;
  onClose: () => void;
  onSubmit: (draft: MissionDraft) => void;
};

/**
 * 미션 만들기 컴포저.
 *
 * 커뮤니티 글쓰기(community.tsx의 ComposerModal)와 같은 모달 방식이라 홈·미션 탭 어디서
 * 열어도 흐름이 같다. 서버에 미션 생성 API가 아직 없어서 `onSubmit`은 초안을 넘겨줄 뿐이고,
 * 실제 업로드는 API가 준비되면 그 자리에 붙이면 된다.
 *
 * 예상 시간·포인트·난이도·체크포인트는 서버에서 AI가 채우는 값이라(`src/data/missions.ts`의
 * Mission 타입 참고) 여기서 입력받지 않는다.
 */
export default function MissionComposer({
  visible,
  neighborhoodName,
  onClose,
  onSubmit,
}: MissionComposerProps) {
  const { colors } = useTheme();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const canSubmit = title.trim().length > 0 && description.trim().length > 0;

  const reset = () => {
    setTitle("");
    setDescription("");
    setPhotoUri(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      photoUri,
    });
    reset();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={close}
    >
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
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
              accessibilityState={{ disabled: !canSubmit }}
              disabled={!canSubmit}
              onPress={submit}
              hitSlop={8}
            >
              <Text
                style={[
                  styles.publish,
                  { color: canSubmit ? colors.green : colors.faint },
                ]}
              >
                등록
              </Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.body}
          >
            <Text style={[styles.label, { color: colors.text }]}>현장 사진</Text>
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
                  <Ionicons name="camera-outline" size={22} color={colors.green} />
                </View>
                <Text style={[styles.photoHint, { color: colors.muted }]}>
                  현장 사진을 올리면 이웃이 상황을 더 빨리 알아봐요
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

            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={15} color={colors.greenInk} />
              <Text style={[styles.metaText, { color: colors.greenInk }]}>
                {neighborhoodName
                  ? `${neighborhoodName} 기준으로 등록돼요`
                  : "현재 위치를 기준으로 등록돼요"}
              </Text>
            </View>

            <View
              style={[
                styles.aiNote,
                { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
              ]}
            >
              <Ionicons name="sparkles-outline" size={16} color={colors.purple} />
              <Text style={[styles.aiNoteText, { color: colors.muted }]}>
                예상 소요 시간과 포인트, 난이도, 체크 포인트는 등록한 뒤 AI가 정리해줘요.
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
  metaText: { fontFamily: "WantedSansB", fontSize: 11 },
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
