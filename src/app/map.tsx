import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
// 1. Marker 컴포넌트 추가 import
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";

const FALLBACK_REGION: Region = {
  latitude: 37.5665,
  longitude: 126.978,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function DarkOSMMap() {
  const [region, setRegion] = useState<Region | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        const granted = status === "granted";
        if (!isMounted) return;
        setHasPermission(granted);

        if (!granted) {
          setRegion(FALLBACK_REGION);
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!isMounted) return;
        setRegion({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } catch (error) {
        if (isMounted) {
          setRegion(FALLBACK_REGION);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!region) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialCamera={{
          center: {
            latitude: region.latitude,
            longitude: region.longitude,
          },
          pitch: 0, // 3D 경사각 설정 (약 45~60도 추천)
          heading: 0, // 방위각 (지도 회전)
          altitude: 1000,
          zoom: 17, // 3D 건물이 잘 보이는 로컬 확대 수준
        }}
        pitchEnabled={true} // 사용자가 두 손가락으로 경사각 조절 가능
        rotateEnabled={true} // 지도 회전 가능
        showsBuildings={true} // 3D 건물 표시
        showsUserLocation={hasPermission}
        showsMyLocationButton={hasPermission}
        followsUserLocation={false}
        googleMapId="449973237f53c8cbcd81d11f"
      >
        {/* 3. 마커 추가 (3D 뷰 위에서도 정상 작동) */}
        <Marker
          coordinate={{
            latitude: region.latitude,
            longitude: region.longitude,
          }}
          title="현재 위치"
          description="여기 있습니다."
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
});
