import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { type Href, usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { runOnJS } from "react-native-worklets";
import { useTheme } from "../theme/ThemeContext";

const SPRING = { damping: 18, stiffness: 230, mass: 0.72 };
const GLASS_HEIGHT = 76;
const SHELL_TOP_PADDING = 8;
const SHELL_BOTTOM_PADDING = 10;
const MIN_BOTTOM_INSET = 8;

/** 화면 하단에서 네비바가 실제로 덮는 높이. 전체 화면 콘텐츠(지도 등)의 여백 계산에 사용한다. */
export function useNavBarHeight() {
  const insets = useSafeAreaInsets();
  return (
    SHELL_TOP_PADDING +
    GLASS_HEIGHT +
    Math.max(insets.bottom, MIN_BOTTOM_INSET) +
    SHELL_BOTTOM_PADDING
  );
}

const TABS: Array<{
  label: string;
  path: Href;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}> = [
  { label: "홈", path: "/", icon: "home-outline", activeIcon: "home" },
  {
    label: "상점",
    path: "/store",
    icon: "storefront-outline",
    activeIcon: "storefront",
  },
  {
    // 지도와 미션은 /mission 한 화면(지도 + 상단바 필터)으로 합쳐져 있다.
    label: "미션",
    path: "/mission",
    icon: "map-outline",
    activeIcon: "map",
  },
  {
    label: "커뮤니티",
    path: "/community",
    icon: "chatbubbles-outline",
    activeIcon: "chatbubbles",
  },
  { label: "마이", path: "/my", icon: "person-outline", activeIcon: "person" },
];

function TabItem({
  tab,
  focused,
  onPress,
}: {
  tab: (typeof TABS)[number];
  focused: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(focused ? 1.1 : 1);
  useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1, SPRING);
  }, [focused, scale]);
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <View style={styles.itemSlot}>
      <Pressable
        accessibilityRole="tab"
        accessibilityLabel={tab.label}
        accessibilityState={{ selected: focused }}
        onPress={onPress}
        style={styles.itemPressable}
      >
        <Animated.View style={[styles.icon, iconStyle]}>
          <Ionicons
            name={focused ? tab.activeIcon : tab.icon}
            size={22}
            color={focused ? "#17310b" : colors.muted}
          />
        </Animated.View>
        <Text
          style={[styles.label, { color: focused ? "#17310b" : colors.muted }]}
        >
          {tab.label}
        </Text>
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
  // 마이페이지에서 여는 세부 화면은 별도 경로여도 마지막 탭(마이)을 선택 상태로 둔다.
  const focusedIndex = ["/settings", "/profile", "/saved-missions"].includes(
    pathname,
  )
    ? TABS.length - 1
    : Math.max(0, matchedIndex);
  const requestedIndex = useRef(focusedIndex);
  const indicatorIndex = useSharedValue(focusedIndex);
  const dragOffset = useSharedValue(0);
  const dragStart = useSharedValue(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, () =>
      setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  useEffect(() => {
    if (requestedIndex.current === focusedIndex) return;
    requestedIndex.current = focusedIndex;
    dragOffset.value = 0;
    indicatorIndex.value = withSpring(focusedIndex, SPRING);
  }, [dragOffset, focusedIndex, indicatorIndex]);

  const selectTab = useCallback(
    (index: number, animateIndicator = true) => {
      const tab = TABS[index];
      if (!tab) return;
      requestedIndex.current = index;
      if (animateIndicator) {
        dragOffset.value = 0;
        indicatorIndex.value = withSpring(index, SPRING);
      }
      if (index !== focusedIndex) router.navigate(tab.path);
    },
    [dragOffset, focusedIndex, indicatorIndex, router],
  );

  const indicatorStyle = useAnimatedStyle(() => {
    const inset = 4;
    const slotWidth = Math.max(0, (contentWidth - inset * 2) / TABS.length);
    const x =
      inset +
      (indicatorIndex.value + dragOffset.value) * slotWidth +
      slotWidth / 2 -
      28;
    return {
      transform: [
        { translateX: Math.max(inset, Math.min(contentWidth - 60, x)) },
      ],
    };
  }, [contentWidth]);

  const dragGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-8, 8])
        .failOffsetY([-12, 12])
        .onStart(() => {
          dragStart.value = indicatorIndex.value + dragOffset.value;
          indicatorIndex.value = dragStart.value;
          dragOffset.value = 0;
        })
        .onUpdate((event) => {
          const slotWidth =
            contentWidth > 0 ? (contentWidth - 8) / TABS.length : 0;
          if (slotWidth > 0)
            dragOffset.value = Math.min(
              TABS.length - 1 - dragStart.value,
              Math.max(-dragStart.value, event.translationX / slotWidth),
            );
        })
        .onEnd(() => {
          const target = Math.min(
            TABS.length - 1,
            Math.max(0, Math.round(dragStart.value + dragOffset.value)),
          );
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
        }),
    [contentWidth, selectTab],
  );

  if (keyboardVisible) return null;
  return (
    <View
      style={[
        styles.shell,
        {
          paddingBottom:
            Math.max(insets.bottom, MIN_BOTTOM_INSET) + SHELL_BOTTOM_PADDING,
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.glass,
          { backgroundColor: colors.navTint, borderColor: colors.navBorder },
        ]}
      >
        <BlurView
          intensity={72}
          tint={mode}
          style={styles.blur}
          pointerEvents="none"
        />
        <View style={styles.tint} pointerEvents="none" />
        <View style={styles.innerGloss} pointerEvents="none" />
        <GestureDetector gesture={dragGesture}>
          <View
            style={styles.content}
            onLayout={(event) =>
              setContentWidth(event.nativeEvent.layout.width)
            }
          >
            <Animated.View
              style={[
                styles.liquidIndicator,
                { backgroundColor: colors.green, borderColor: colors.green },
                indicatorStyle,
              ]}
              pointerEvents="none"
            />
            {TABS.map((tab, index) => (
              <TabItem
                key={tab.label}
                tab={tab}
                focused={focusedIndex === index}
                onPress={() => selectTab(index)}
              />
            ))}
          </View>
        </GestureDetector>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 50,
    elevation: 20,
    paddingHorizontal: 16,
    paddingTop: SHELL_TOP_PADDING,
  },
  glass: {
    height: GLASS_HEIGHT,
    overflow: "visible",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOpacity: 0.26,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  blur: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
    borderRadius: 999,
  },
  tint: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  innerGloss: {
    position: "absolute",
    top: 3,
    right: 42,
    left: 42,
    height: 16,
    borderRadius: 999,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    position: "relative",
  },
  itemSlot: {
    flex: 1,
    minWidth: 48,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  itemPressable: {
    width: 56,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  icon: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    maxWidth: 64,
    fontFamily: "WantedSansB",
    fontSize: 9,
    lineHeight: 12,
    marginTop: 1,
  },
  liquidIndicator: {
    position: "absolute",
    top: "50%",
    marginTop: -28,
    height: 56,
    width: 56,
    borderRadius: 999,
    borderWidth: 1.5,
    shadowColor: "#a7e66d",
    shadowOpacity: 0.58,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
