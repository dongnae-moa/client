import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { type Href, usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-worklets";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";

const SPRING = { damping: 18, stiffness: 230, mass: 0.72 };
const TABS: Array<{ label: string; path: Href; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }> = [
  { label: "홈", path: "/", icon: "home-outline", activeIcon: "home" },
  { label: "상점", path: "/map", icon: "storefront-outline", activeIcon: "storefront" },
  { label: "미션", path: "/mission", icon: "checkmark-circle-outline", activeIcon: "checkmark-circle" },
  { label: "커뮤니티", path: "/community", icon: "chatbubbles-outline", activeIcon: "chatbubbles" },
  { label: "마이", path: "/my", icon: "person-outline", activeIcon: "person" },
];

function TabItem({ tab, focused, onPress }: { tab: typeof TABS[number]; focused: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const scale = useSharedValue(focused ? 1.1 : 1);
  useEffect(() => { scale.value = withSpring(focused ? 1.1 : 1, SPRING); }, [focused, scale]);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <View style={styles.itemSlot}>
      <Pressable accessibilityRole="tab" accessibilityLabel={tab.label} accessibilityState={{ selected: focused }} onPress={onPress} style={styles.itemPressable}>
        <Animated.View style={[styles.icon, iconStyle]}>
          <Ionicons name={focused ? tab.activeIcon : tab.icon} size={22} color={focused ? "#17310b" : colors.muted} />
        </Animated.View>
        <Text style={[styles.label, { color: focused ? "#17310b" : colors.muted }]}>{tab.label}</Text>
      </Pressable>
    </View>
  );
}

function MissionTab({ focused, onPress }: { focused: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const iconScale = useSharedValue(1);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: iconScale.value }] }));
  return (
    <View style={styles.itemSlot}>
      <Pressable accessibilityRole="tab" accessibilityLabel="미션" accessibilityState={{ selected: focused }} onPress={onPress} onPressIn={() => { iconScale.value = withSpring(0.84, SPRING); }} onPressOut={() => { iconScale.value = withSpring(1, SPRING); }} style={styles.itemPressable}>
        <View style={styles.missionButton}>
          <Animated.View style={iconStyle}>
          <Ionicons name={focused ? "checkmark-circle" : "checkmark-circle-outline"} size={25} color={focused ? "#17310b" : colors.muted} />
          </Animated.View>
          <Text style={[styles.missionLabel, { color: focused ? "#17310b" : colors.muted }]}>미션</Text>
        </View>
      </Pressable>
    </View>
  );
}

export default function FloatingNavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors, mode } = useTheme();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [contentWidth, setContentWidth] = useState(0);
  const matchedIndex = TABS.findIndex((tab) => pathname === tab.path);
  const focusedIndex = pathname === "/settings" ? 4 : Math.max(0, matchedIndex);
  const requestedIndex = useRef(focusedIndex);
  const indicatorIndex = useSharedValue(focusedIndex);
  const dragOffset = useSharedValue(0);
  const dragStart = useSharedValue(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  useEffect(() => {
    if (requestedIndex.current === focusedIndex) return;
    requestedIndex.current = focusedIndex;
    dragOffset.value = 0;
    indicatorIndex.value = withSpring(focusedIndex, SPRING);
  }, [dragOffset, focusedIndex, indicatorIndex]);

  const selectTab = useCallback((index: number, animateIndicator = true) => {
    const tab = TABS[index];
    if (!tab) return;
    requestedIndex.current = index;
    if (animateIndicator) {
      dragOffset.value = 0;
      indicatorIndex.value = withSpring(index, SPRING);
    }
    if (index !== focusedIndex) router.navigate(tab.path);
  }, [dragOffset, focusedIndex, indicatorIndex, router]);

  const indicatorStyle = useAnimatedStyle(() => {
    const inset = 4;
    const slotWidth = Math.max(0, (contentWidth - inset * 2) / TABS.length);
    const x = inset + (indicatorIndex.value + dragOffset.value) * slotWidth + slotWidth / 2 - 28;
    return { transform: [{ translateX: Math.max(inset, Math.min(contentWidth - 60, x)) }] };
  }, [contentWidth]);

  const dragGesture = useMemo(() => Gesture.Pan()
    .activeOffsetX([-8, 8])
    .failOffsetY([-12, 12])
    .onStart(() => {
      dragStart.value = indicatorIndex.value + dragOffset.value;
      indicatorIndex.value = dragStart.value;
      dragOffset.value = 0;
    })
    .onUpdate((event) => {
      const slotWidth = contentWidth > 0 ? (contentWidth - 8) / TABS.length : 0;
      if (slotWidth > 0) dragOffset.value = Math.min(TABS.length - 1 - dragStart.value, Math.max(-dragStart.value, event.translationX / slotWidth));
    })
    .onEnd(() => {
      const target = Math.min(TABS.length - 1, Math.max(0, Math.round(dragStart.value + dragOffset.value)));
      const targetOffset = target - dragStart.value;
      dragOffset.value = withSpring(targetOffset, SPRING, (finished) => {
        if (!finished) return;
        indicatorIndex.value = target;
        dragOffset.value = 0;
      });
      runOnJS(selectTab)(target, false);
    })
    .onFinalize((_event, success) => {
      if (success) return;
      dragOffset.value = withSpring(0, SPRING);
    }), [contentWidth, selectTab]);

  if (keyboardVisible) return null;
  return (
    <View style={[styles.shell, { paddingBottom: Math.max(insets.bottom, 8) + 10 }]} pointerEvents="box-none">
      <View style={[styles.glass, { backgroundColor: colors.navTint, borderColor: colors.navBorder }]}>
        <BlurView intensity={72} tint={mode} style={styles.blur} pointerEvents="none" />
        <View style={styles.tint} pointerEvents="none" />
        <View style={styles.innerGloss} pointerEvents="none" />
        <GestureDetector gesture={dragGesture}>
          <View style={styles.content} onLayout={(event) => setContentWidth(event.nativeEvent.layout.width)}>
            <Animated.View style={[styles.liquidIndicator, { backgroundColor: colors.green, borderColor: colors.green }, indicatorStyle]} pointerEvents="none" />
            {TABS.map((tab, index) => index === 2 ? <MissionTab key={tab.label} focused={focusedIndex === index} onPress={() => selectTab(index)} /> : <TabItem key={tab.label} tab={tab} focused={focusedIndex === index} onPress={() => selectTab(index)} />)}
          </View>
        </GestureDetector>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { position: "absolute", right: 0, bottom: 0, left: 0, zIndex: 50, elevation: 20, paddingHorizontal: 16, paddingTop: 8 },
  glass: { height: 76, overflow: "visible", borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, shadowColor: "#000", shadowOpacity: 0.26, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  blur: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, overflow: "hidden", borderRadius: 999 },
  tint: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.035)" },
  innerGloss: { position: "absolute", top: 3, right: 42, left: 42, height: 16, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.08)" },
  content: { flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 4, position: "relative" },
  itemSlot: { flex: 1, minWidth: 48, alignItems: "center", justifyContent: "center", zIndex: 2 },
  itemPressable: { width: 56, height: 60, alignItems: "center", justifyContent: "center", borderRadius: 999 },
  icon: { width: 26, height: 26, alignItems: "center", justifyContent: "center" },
  label: { maxWidth: 64, fontFamily: "WantedSansB", fontSize: 9, lineHeight: 12, marginTop: 1 },
  liquidIndicator: { position: "absolute", top: "50%", marginTop: -28, height: 56, width: 56, borderRadius: 999, borderWidth: 1.5, shadowColor: "#a7e66d", shadowOpacity: 0.58, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  missionButton: { width: 56, height: 56, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: "transparent" },
  missionLabel: { fontFamily: "WantedSansB", fontSize: 9, lineHeight: 11, marginTop: -1 },
});
