import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter, type Href } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../auth/AuthContext";
import { OnboardingVisual, type OnboardingVisualKind } from "../components/OnboardingVisual";
import { useTheme } from "../theme/ThemeContext";

const slides = [
  { id: "nearby" as OnboardingVisualKind, title: "가까운 미션 빠르게 찾기", description: "지도와 필터로 미션을 찾아요." },
  { id: "verify" as OnboardingVisualKind, title: "참여하고 인증하기", description: "사진과 이웃 검토로 행동을 변화로 만들어요." },
  { id: "rewards" as OnboardingVisualKind, title: "참여할수록 커지는 혜택", description: "포인트를 모아 기프티콘·프로필 장식·근처 가게 할인에 사용해요." },
  { id: "impact" as OnboardingVisualKind, title: "우리 동네 성장 돕기", description: "배지·랭크·Community XP로 기여도를 확인해요." },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors, mode } = useTheme();
  const { width } = useWindowDimensions();
  const { completeOnboarding } = useAuth();
  const listRef = useRef<FlatList<(typeof slides)[number]>>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: 0, animated: false }));
    return () => cancelAnimationFrame(frame);
  }, []);

  const finish = async () => {
    await completeOnboarding();
    router.replace("/auth/login" as Href);
  };

  const next = () => {
    if (index === slides.length - 1) {
      void finish();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <View style={styles.header}>
        <Image source={mode === "dark" ? require("@/assets/images/logo-dark.png") : require("@/assets/images/로고임.png")} style={styles.logo} contentFit="contain" />
        <Pressable accessibilityRole="button" onPress={() => { void finish(); }} hitSlop={10}><Text style={[styles.skip, { color: colors.muted }]}>건너뛰기</Text></Pressable>
      </View>
      <FlatList
        ref={listRef}
        data={slides}
        initialScrollIndex={0}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, itemIndex) => ({ length: width, offset: width * itemIndex, index: itemIndex })}
        renderItem={({ item, index: slideIndex }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.visual}><OnboardingVisual kind={item.id} /></View>
            <Text style={[styles.kicker, { color: colors.green }]}>0{slideIndex + 1} · 동네모아</Text>
            <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.description, { color: colors.muted }]}>{item.description}</Text>
          </View>
        )}
      />
      <View style={styles.bottom}>
        <View style={styles.dots}>{slides.map((slide, dotIndex) => <View key={slide.id} style={[styles.dot, { backgroundColor: dotIndex === index ? colors.green : colors.border }, dotIndex === index && styles.activeDot]} />)}</View>
        <Pressable onPress={next} style={({ pressed }) => [styles.button, { backgroundColor: colors.green }, pressed && styles.pressed]}>
          <Text style={styles.buttonText}>{index === slides.length - 1 ? "동네모아 시작하기" : "다음"}</Text>
          <Ionicons name="arrow-forward" size={19} color="#17310b" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 20 },
  logo: { height: 30, width: 112 },
  skip: { fontFamily: "WantedSansB", fontSize: 12 },
  slide: { justifyContent: "center", paddingHorizontal: 24 },
  visual: { height: 270, marginBottom: 38 },
  kicker: { fontFamily: "WantedSansB", fontSize: 12 },
  title: { fontFamily: "WantedSansB", fontSize: 29, letterSpacing: -1.2, lineHeight: 38, marginTop: 10 },
  description: { fontFamily: "WantedSansR", fontSize: 15, lineHeight: 24, marginTop: 12, maxWidth: 330 },
  bottom: { paddingBottom: 22, paddingHorizontal: 24 },
  dots: { flexDirection: "row", gap: 7, marginBottom: 20 },
  dot: { borderRadius: 99, height: 7, width: 7 },
  activeDot: { width: 24 },
  button: { alignItems: "center", borderRadius: 17, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 58 },
  buttonText: { color: "#17310b", fontFamily: "WantedSansB", fontSize: 15 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
