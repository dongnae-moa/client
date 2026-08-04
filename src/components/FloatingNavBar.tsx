import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { type Href, usePathname, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-worklets";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SPRING = { damping: 16, stiffness: 260, mass: 0.7 };
type TabItem = { label: string; path: Href; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap };
const TABS: TabItem[] = [
  { label: "홈", path: "/", icon: "home-outline", activeIcon: "home" },
  { label: "지도", path: "/map", icon: "map-outline", activeIcon: "map" },
  { label: "미션", path: "/mission", icon: "camera-outline", activeIcon: "camera" },
  { label: "마이", path: "/my", icon: "person-outline", activeIcon: "person" },
];

function GlassTabItem({ tab, focused, onPress }: { tab: TabItem; focused: boolean; onPress: () => void }) {
  const scale = useSharedValue(focused ? 1.08 : 1);
  useEffect(() => { scale.value = withSpring(focused ? 1.08 : 1, SPRING); }, [focused, scale]);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <View style={styles.itemSlot}>
      <Pressable accessibilityRole="tab" accessibilityLabel={tab.label} accessibilityState={{ selected: focused }} onPress={onPress} style={styles.itemPressable}>
        <Animated.View style={[styles.icon, iconStyle]}>
          <Ionicons name={focused ? tab.activeIcon : tab.icon} size={22} color={focused ? "#a7e66d" : "rgba(255,255,255,0.72)"} />
        </Animated.View>
        <Text style={[styles.label, { color: focused ? "#ffffff" : "rgba(255,255,255,0.68)" }]}>{tab.label}</Text>
      </Pressable>
    </View>
  );
}

function LensTabButton({ tab, focused, onPress }: { tab: TabItem; focused: boolean; onPress: () => void }) {
  const pressedScale = useSharedValue(1);
  const buttonStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressedScale.value }] }));
  return (
    <View style={styles.lensSlot}>
      <Pressable accessibilityRole="tab" accessibilityLabel="미션 카메라" accessibilityState={{ selected: focused }} onPress={onPress} onPressIn={() => { pressedScale.value = withSpring(0.94, SPRING); }} onPressOut={() => { pressedScale.value = withSpring(1, SPRING); }} style={styles.itemPressable}>
        <Animated.View style={[styles.lensButton, focused && styles.lensButtonFocused, buttonStyle]}>
          <View style={[styles.lensRing, focused && styles.lensRingFocused]} />
          <Ionicons name={focused ? tab.activeIcon : tab.icon} size={27} color={focused ? "#ffffff" : "#a7e66d"} />
          <Text style={styles.lensLabel}>{tab.label}</Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

export default function FloatingNavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [contentWidth, setContentWidth] = useState(0);
  const indicatorIndex = useSharedValue(0);
  const dragOffset = useSharedValue(0);
  const dragStart = useSharedValue(0);
  const focusedIndex = Math.max(0, TABS.findIndex((tab) => pathname === tab.path));

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  useEffect(() => { indicatorIndex.value = withSpring(focusedIndex, SPRING); }, [focusedIndex, indicatorIndex]);

  const selectTab = (index: number) => { const tab = TABS[index]; if (tab && index !== focusedIndex) router.replace(tab.path); };
  const indicatorStyle = useAnimatedStyle(() => {
    const inset = 4;
    const slotWidth = Math.max(0, (contentWidth - inset * 2) / TABS.length);
    const diameter = Math.min(56, Math.max(0, slotWidth));
    const x = inset + (indicatorIndex.value + dragOffset.value) * slotWidth + (slotWidth - diameter) / 2;
    return { width: diameter, transform: [{ translateX: Math.max(inset, x) }] };
  }, [contentWidth]);
  const dragGesture = useMemo(() => Gesture.Pan()
    .activeOffsetX([-8, 8])
    .failOffsetY([-12, 12])
    .onStart(() => { dragStart.value = indicatorIndex.value; dragOffset.value = 0; })
    .onUpdate((event) => {
      const slotWidth = contentWidth > 0 ? (contentWidth - 8) / TABS.length : 0;
      if (slotWidth > 0) dragOffset.value = Math.min(TABS.length - 1 - dragStart.value, Math.max(-dragStart.value, event.translationX / slotWidth));
    })
    .onEnd(() => {
      const target = Math.min(TABS.length - 1, Math.max(0, Math.round(dragStart.value + dragOffset.value)));
      indicatorIndex.value = withSpring(target, SPRING);
      dragOffset.value = 0;
      runOnJS(selectTab)(target);
    }), [contentWidth, focusedIndex]);

  if (keyboardVisible) return null;
  return (
    <View style={[styles.shell, { paddingBottom: Math.max(insets.bottom, 8) + 10 }]} pointerEvents="box-none">
      <View style={styles.glass}>
        <BlurView intensity={68} tint="dark" style={styles.blur} pointerEvents="none" />
        <View style={styles.tint} pointerEvents="none" />
        <View style={styles.innerGloss} pointerEvents="none" />
        <GestureDetector gesture={dragGesture}>
          <View style={styles.content} onLayout={(event) => setContentWidth(event.nativeEvent.layout.width)}>
            {focusedIndex !== 2 ? <Animated.View style={[styles.liquidIndicator, indicatorStyle]} pointerEvents="none" /> : null}
            {TABS.map((tab, index) => index === 2 ? <LensTabButton key={tab.label} tab={tab} focused={index === focusedIndex} onPress={() => selectTab(index)} /> : <GlassTabItem key={tab.label} tab={tab} focused={index === focusedIndex} onPress={() => selectTab(index)} />)}
          </View>
        </GestureDetector>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { position: "absolute", right: 0, bottom: 0, left: 0, zIndex: 50, elevation: 20, paddingHorizontal: 16, paddingTop: 8 },
  glass: { height: 72, position: "relative", overflow: "visible", borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.18)", backgroundColor: "rgba(2,6,23,0.42)", shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  blur: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, overflow: "hidden", borderRadius: 999 },
  tint: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, borderRadius: 999, backgroundColor: "rgba(2,6,23,0.16)" },
  innerGloss: { position: "absolute", top: 3, right: 40, left: 40, height: 18, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)" },
  content: { position: "relative", flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 4 },
  itemSlot: { flex: 1, minWidth: 48, alignItems: "center", justifyContent: "center", zIndex: 2 },
  itemPressable: { width: 56, minWidth: 48, minHeight: 56, height: 56, alignItems: "center", justifyContent: "center", borderRadius: 999 },
  icon: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  label: { maxWidth: 64, fontFamily: "WantedSansB", fontSize: 9, lineHeight: 12, marginTop: 2 },
  liquidIndicator: { position: "absolute", top: "50%", marginTop: -28, height: 56, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.14)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.28)", shadowColor: "#FFFFFF", shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 2 } },
  lensSlot: { flex: 1, minWidth: 48, alignItems: "center", justifyContent: "center", zIndex: 3 },
  lensButton: { width: 60, height: 60, alignItems: "center", justifyContent: "center", gap: 1, borderRadius: 999, backgroundColor: "rgba(34,197,94,0.16)", borderWidth: 2, borderColor: "rgba(134,239,172,0.58)", shadowColor: "#000", shadowOpacity: 0.16, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  lensButtonFocused: { backgroundColor: "#65c94a", borderColor: "rgba(255,255,255,0.94)", shadowColor: "#a7e66d", shadowOpacity: 0.46, shadowRadius: 18, shadowOffset: { width: 0, height: 6 } },
  lensRing: { position: "absolute", width: 68, height: 68, borderRadius: 34, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(134,239,172,0.46)" },
  lensRingFocused: { borderWidth: 4, borderColor: "rgba(134,239,172,0.92)" },
  lensLabel: { maxWidth: 64, color: "#ffffff", fontFamily: "WantedSansB", fontSize: 8, lineHeight: 10, textAlign: "center" },
});
