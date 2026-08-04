// app.config.js
import "dotenv/config";

export default {
  expo: {
    name: "동네모아",
    slug: "dongnae-moa",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "dongnaemoa",
    userInterfaceStyle: "automatic",
    ios: {
      icon: "./assets/expo.icon",
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
      package: "com.anonymous.dongnaemoa",
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#fbfbfb",
          image: "./assets/images/splash-icon.png",
          imageWidth: 76,
        },
      ],
      "expo-font",
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    // 💡 앱 내 일반 JS/TS 코드에서 접근해야 하는 변수는 extra에 전달할 수도 있습니다.
    extra: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
  },
};
