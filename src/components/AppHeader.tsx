import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";

export default function AppHeader({ title, back = false, settings = false }: { title?: string; back?: boolean; settings?: boolean }) {
  const router = useRouter();
  const { mode, colors } = useTheme();
  return (
    <View style={styles.header}>
      {back ? <Pressable accessibilityLabel="뒤로 가기" onPress={() => router.back()} style={styles.iconButton}><Ionicons name="chevron-back" size={24} color={colors.text} /></Pressable> : <View style={styles.iconButton} />}
      {title ? <Text style={[styles.title, { color: colors.text }]}>{title}</Text> : <Image source={mode === "dark" ? require("@/assets/images/logo-dark.png") : require("@/assets/images/로고임.png")} style={styles.logo} contentFit="contain" />}
      {settings ? <Pressable accessibilityLabel="설정" onPress={() => router.push("/settings")} style={styles.iconButton}><Ionicons name="settings-outline" size={21} color={colors.text} /></Pressable> : <View style={styles.iconButton} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", flexDirection: "row", height: 60, justifyContent: "space-between", paddingHorizontal: 18 },
  iconButton: { alignItems: "center", height: 40, justifyContent: "center", width: 40 },
  title: { fontFamily: "WantedSansB", fontSize: 18 },
  logo: { height: 24, width: 92 },
});
