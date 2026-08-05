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
      config: {
        // PROVIDER_GOOGLE을 쓰므로 iOS도 키가 있어야 지도가 렌더링된다.
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
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
      // 액세스·리프레시 토큰을 SecureStore에 보관한다(src/auth/AuthContext.tsx).
      "expo-secure-store",
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "내 주변 미션을 지도에 보여주기 위해 위치를 사용합니다.",
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission:
            "동네 인증과 게시글에 사진을 첨부하기 위해 사진 보관함을 사용합니다.",
          cameraPermission:
            "미션 완료 인증 사진을 촬영하기 위해 카메라를 사용합니다.",
          microphonePermission: false,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    // 💡 앱 내 일반 JS/TS 코드에서 접근해야 하는 변수는 extra에 전달할 수도 있습니다.
    extra: {
      // 백엔드 API 주소. src/api/client.ts가 이 값을 먼저 읽는다.
      apiUrl:
        process.env.EXPO_PUBLIC_API_URL ?? "http://165.140.22.60:8080",
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      // 지도 스타일(Cloud-based map styling) ID. 앱 테마에 맞춰 골라 쓴다.
      googleMapIdDark:
        process.env.EXPO_PUBLIC_GOOGLE_MAP_ID_DARK ??
        "449973237f53c8cbcd81d11f",
      // 라이트용 Map ID를 만들면 여기에 넣는다. 비워두면 구글 기본(라이트) 스타일을 쓴다.
      googleMapIdLight: process.env.EXPO_PUBLIC_GOOGLE_MAP_ID_LIGHT,
    },
  },
};
