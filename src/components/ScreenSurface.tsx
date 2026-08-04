import { ScrollView, StyleSheet, View, type ScrollViewProps } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";

export function ScreenSurface({ children, scroll = true, ...props }: ScrollViewProps & { scroll?: boolean }) {
  const insets = useSafeAreaInsets();
  const { colors, mode } = useTheme();
  const content = <View style={[styles.content, { paddingBottom: insets.bottom + 118 }]}>{children}</View>;
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      {scroll ? <ScrollView {...props} showsVerticalScrollIndicator={false}>{content}</ScrollView> : content}
    </View>
  );
}

export function SurfaceCard({ children, style }: { children: React.ReactNode; style?: object }) {
  const { colors } = useTheme();
  return <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 28 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16 },
});
