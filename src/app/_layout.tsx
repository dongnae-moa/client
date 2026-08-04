import { useFonts } from "expo-font";
import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationLightTheme, Tabs, ThemeProvider as NavigationThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { useEffect, useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import FloatingNavBar from "../components/FloatingNavBar";
import { ThemeProvider as AppThemeProvider, useTheme } from "../theme/ThemeContext";

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
      <AppRoot />
    </AppThemeProvider>
  );
}

function AppRoot() {
  const { colors, mode } = useTheme();
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
        </Tabs>
        <FloatingNavBar />
      </GestureHandlerRootView>
    </NavigationThemeProvider>
  );
}
