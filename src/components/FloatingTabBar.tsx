// components/FloatingBottomNav.tsx
import { Ionicons } from "@expo/vector-icons";
import { type Href, usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

type TabItem = {
  label: string;
  path: Href;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
};

const TABS: TabItem[] = [
  { label: "홈", path: "/", icon: "home-outline", activeIcon: "home" },
  { label: "지도", path: "/map", icon: "map-outline", activeIcon: "map" },
  {
    label: "미션",
    path: "/mission",
    icon: "flag-outline",
    activeIcon: "flag",
  },
  {
    label: "마이",
    path: "/my",
    icon: "person-outline",
    activeIcon: "person",
  },
];

export default function FloatingBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.container}>
        {TABS.map((tab) => {
          const isActive = pathname === tab.path;
          return (
            <Pressable
              key={tab.path as string}
              onPress={() => {
                if (!isActive) router.replace(tab.path);
              }}
              style={styles.tab}
              hitSlop={8}
            >
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={24}
                color={isActive ? "#ffffff" : "#9c9c9c"}
              />
              <Text
                style={[
                  styles.label,
                  { color: isActive ? "#ffffff" : "#9c9c9c" },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: "#191919",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#2f2f2f",
    paddingVertical: 9,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  label: {
    fontFamily: "WantedSansR",
    fontSize: 11,
  },
});
