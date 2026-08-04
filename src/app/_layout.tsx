import { useFonts } from "expo-font";
import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationLightTheme, Tabs, ThemeProvider as NavigationThemeProvider, usePathname, useRouter, type Href } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { useEffect, useMemo } from "react";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import FloatingNavBar from "../components/FloatingNavBar";
import { ThemeProvider as AppThemeProvider, useTheme } from "../theme/ThemeContext";
import { AuthProvider, useAuth } from "../auth/AuthContext";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    WantedSansB: require("@/assets/fonts/WantedSans-Bold.ttf"),
    WantedSansR: require("@/assets/fonts/WantedSans-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <AppThemeProvider>
      <AuthProvider>
        <AppRoot />
      </AuthProvider>
    </AppThemeProvider>
  );
}

function AppRoot() {
  const { colors, mode } = useTheme();
  const { phase } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const navigationTheme = useMemo(() => {
    const base = mode === "dark" ? NavigationDarkTheme : NavigationLightTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: colors.background,
        border: colors.border,
        card: colors.background,
        notification: colors.orange,
        primary: colors.green,
        text: colors.text,
      },
    };
  }, [colors, mode]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  useEffect(() => {
    if (phase === "booting") return;
    const isOnboarding = pathname === "/onboarding";
    const isAuth = pathname.startsWith("/auth");
    const isLocation = pathname === "/location";

    if (phase === "onboarding" && !isOnboarding) router.replace("/onboarding" as Href);
    else if (phase === "anonymous" && !isAuth) router.replace("/auth/login" as Href);
    else if (phase === "needsNeighborhood" && !isLocation) router.replace("/location" as Href);
    else if (phase === "authenticated" && (isOnboarding || isAuth || isLocation)) router.replace("/");
  }, [pathname, phase, router]);

  if (phase === "booting") {
    return <BootScreen />;
  }

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <GestureHandlerRootView style={{ backgroundColor: colors.background, flex: 1 }}>
        <Tabs
          backBehavior="history"
          detachInactiveScreens={false}
          tabBar={() => null}
          screenOptions={{ animation: "none", headerShown: false, lazy: false, sceneStyle: { backgroundColor: colors.background } }}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="map" />
          <Tabs.Screen name="mission" />
          <Tabs.Screen name="community" />
          <Tabs.Screen name="my" />
          <Tabs.Screen name="settings" options={{ href: null }} />
          <Tabs.Screen name="onboarding" options={{ href: null }} />
          <Tabs.Screen name="location" options={{ href: null }} />
          <Tabs.Screen name="auth" options={{ href: null }} />
        </Tabs>
        {phase === "authenticated" ? <FloatingNavBar /> : null}
      </GestureHandlerRootView>
    </NavigationThemeProvider>
  );
}

function BootScreen() {
  const { colors, mode } = useTheme();
  return (
    <View style={[styles.boot, { backgroundColor: colors.background }]}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <Image
        source={mode === "dark" ? require("@/assets/images/logo-dark.png") : require("@/assets/images/로고임.png")}
        style={styles.bootLogo}
        contentFit="contain"
      />
      <Text style={[styles.bootCopy, { color: colors.muted }]}>우리 동네를 불러오고 있어요</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  boot: { alignItems: "center", flex: 1, justifyContent: "center" },
  bootLogo: { height: 42, width: 160 },
  bootCopy: { fontFamily: "WantedSansR", fontSize: 12, marginTop: 18 },
});
