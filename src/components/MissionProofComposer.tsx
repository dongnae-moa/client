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
import {
  submitParticipationProof,
  type Participation,
} from "../api/participations";
import type { Mission } from "../data/missions";
import { useTheme } from "../theme/ThemeContext";

type MissionProofComposerProps = {
  visible: boolean;
  mission: Mission | null;
  participation: Participation | null;
  onClose: () => void;
  onSubmitted: (participation: Participation) => void;
};

type PhotoActionProps = {
  icon: "camera-outline" | "images-outline";
  label: string;
  onPress: () => void;
};

function PhotoAction({ icon, label, onPress }: PhotoActionProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.photoAction,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.photoIcon, { backgroundColor: colors.greenSoft }]}>
        <Ionicons name={icon} size={21} color={colors.greenInk} />
      </View>
      <Text style={[styles.photoActionText, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

/** JOINED 상태의 미션에 사진·설명을 붙여 SUBMITTED로 전환하는 인증 모달. */
export default function MissionProofComposer({
  visible,
  mission,
  participation,
  onClose,
  onSubmitted,
}: MissionProofComposerProps) {
  const { colors } = useTheme();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSubmit =
    Boolean(photoUri || description.trim()) &&
    participation?.status === "JOINED" &&
    !submitting;

  const reset = () => {
    setPhotoUri(null);
    setDescription("");
    setError(null);
  };

  const close = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const usePickedAsset = (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled) return;
    setPhotoUri(result.assets[0].uri);
    setError(null);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError("완료 사진을 촬영하려면 카메라 권한이 필요해요.");
      return;
    }
    usePickedAsset(
      await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.82,
      }),
    );
  };

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("완료 사진을 선택하려면 사진 접근 권한이 필요해요.");
      return;
    }
    usePickedAsset(
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.82,
      }),
    );
  };

  const submit = async () => {
    if (!canSubmit || !participation) return;
    setSubmitting(true);
    setError(null);
    try {
      const submitted = await submitParticipationProof(
        participation.id,
        { proofDescription: description.trim() || undefined },
        photoUri,
      );
      reset();
      onSubmitted(submitted);
    } catch (requestError) {
      console.log("[proof] ✗ 인증 제출 실패", requestError);
      setError(
        requestError instanceof ApiError
          ? `${requestError.message} (HTTP ${requestError.status})`
          : `인증을 제출하지 못했어요: ${
              (requestError as Error)?.message ?? "알 수 없는 오류"
            }`,
      );
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
            <Pressable onPress={close} hitSlop={8}>
              <Text style={[styles.cancel, { color: colors.muted }]}>취소</Text>
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.text }]}>완료 인증</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.body}
          >
            <View
              style={[
                styles.missionSummary,
                { backgroundColor: colors.greenSoft },
              ]}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.greenInk} />
              <View style={styles.summaryCopy}>
                <Text style={[styles.summaryLabel, { color: colors.greenInk }]}>수행한 미션</Text>
                <Text
                  numberOfLines={2}
                  style={[styles.summaryTitle, { color: colors.text }]}
                >
                  {mission?.title ?? "미션"}
                </Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.label, { color: colors.text }]}>완료 사진</Text>
              <Text style={[styles.optional, { color: colors.muted }]}>선택</Text>
            </View>
            {photoUri ? (
              <View style={styles.photoWrap}>
                <Image
                  source={photoUri}
                  style={styles.photo}
                  contentFit="cover"
                  transition={160}
                />
                <Pressable
                  accessibilityLabel="완료 사진 지우기"
                  onPress={() => setPhotoUri(null)}
                  style={styles.removePhoto}
                >
                  <Ionicons name="close" size={17} color="#fff" />
                </Pressable>
              </View>
            ) : (
              <View style={styles.photoActions}>
                <PhotoAction
                  icon="camera-outline"
                  label="사진 촬영"
                  onPress={() => void takePhoto()}
                />
                <PhotoAction
                  icon="images-outline"
                  label="앨범에서 선택"
                  onPress={() => void pickPhoto()}
                />
              </View>
            )}

            <View style={[styles.sectionHeader, styles.descriptionHeader]}>
              <Text style={[styles.label, { color: colors.text }]}>인증 설명</Text>
              <Text style={[styles.optional, { color: colors.muted }]}>선택</Text>
            </View>
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={500}
              textAlignVertical="top"
              placeholder="무엇을 어떻게 완료했는지 적어주세요."
              placeholderTextColor={colors.faint}
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            />
            <View style={styles.inputMeta}>
              <Text style={[styles.hint, { color: colors.muted }]}>사진이나 설명 중 하나를 추가해주세요.</Text>
              <Text style={[styles.counter, { color: colors.faint }]}>{description.length}/500</Text>
            </View>

            {error ? (
              <View
                style={[
                  styles.error,
                  { backgroundColor: colors.surface, borderColor: colors.orange },
                ]}
              >
                <Ionicons name="alert-circle-outline" size={16} color={colors.orange} />
                <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSubmit, busy: submitting }}
              disabled={!canSubmit}
              onPress={() => void submit()}
              style={({ pressed }) => [
                styles.submitButton,
                {
                  backgroundColor: canSubmit
                    ? colors.green
                    : colors.surfaceRaised,
                },
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name={submitting ? "hourglass-outline" : "send-outline"}
                size={17}
                color={canSubmit ? "#17310b" : colors.faint}
              />
              <Text
                style={[
                  styles.submitText,
                  { color: canSubmit ? "#17310b" : colors.faint },
                ]}
              >
                {submitting ? "제출 중..." : "완료 인증 제출하기"}
              </Text>
            </Pressable>
            <Text style={[styles.reviewHint, { color: colors.muted }]}>제출 후 미션 등록자의 확인을 기다려요.</Text>
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
  cancel: { fontFamily: "WantedSansB", fontSize: 13 },
  headerTitle: { fontFamily: "WantedSansB", fontSize: 16 },
  headerSpacer: { width: 26 },
  body: { padding: 20, paddingBottom: 36 },
  missionSummary: {
    alignItems: "center",
    borderRadius: 16,
    flexDirection: "row",
    gap: 10,
    padding: 14,
  },
  summaryCopy: { flex: 1 },
  summaryLabel: { fontFamily: "WantedSansB", fontSize: 10 },
  summaryTitle: { fontFamily: "WantedSansB", fontSize: 14, lineHeight: 19, marginTop: 3 },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 9,
    marginTop: 22,
  },
  descriptionHeader: { marginTop: 24 },
  label: { fontFamily: "WantedSansB", fontSize: 14 },
  optional: { fontFamily: "WantedSansR", fontSize: 10 },
  photoActions: { flexDirection: "row", gap: 10 },
  photoAction: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 8,
    justifyContent: "center",
    minHeight: 110,
  },
  photoIcon: {
    alignItems: "center",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  photoActionText: { fontFamily: "WantedSansB", fontSize: 11 },
  photoWrap: { borderRadius: 18, height: 220, overflow: "hidden" },
  photo: { height: "100%", width: "100%" },
  removePhoto: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.66)",
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    position: "absolute",
    right: 10,
    top: 10,
    width: 32,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    fontFamily: "WantedSansR",
    fontSize: 13,
    lineHeight: 19,
    minHeight: 118,
    padding: 14,
  },
  inputMeta: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 7,
  },
  hint: { flex: 1, fontFamily: "WantedSansR", fontSize: 10 },
  counter: { fontFamily: "WantedSansR", fontSize: 10 },
  error: {
    alignItems: "flex-start",
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    marginTop: 16,
    padding: 11,
  },
  errorText: { flex: 1, fontFamily: "WantedSansR", fontSize: 11, lineHeight: 16 },
  submitButton: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    marginTop: 22,
    paddingVertical: 14,
  },
  submitText: { fontFamily: "WantedSansB", fontSize: 13 },
  reviewHint: {
    fontFamily: "WantedSansR",
    fontSize: 10,
    marginTop: 9,
    textAlign: "center",
  },
  pressed: { opacity: 0.75 },
});
