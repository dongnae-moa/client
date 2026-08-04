import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { statusMeta, type Mission } from "../data/missions";
import { useTheme, type AppTheme, type ThemeMode } from "../theme/ThemeContext";
import type { Coords } from "../utils/geo";

// 지도 스타일은 Google Cloud 콘솔의 Map ID로 관리한다(코드 내 customMapStyle과 함께 쓸 수 없다).
// Map ID는 지도 생성 시점에만 적용되므로(MapManager.createViewInstance), 테마가 바뀌면
// MapView를 key로 다시 마운트해야 새 스타일이 반영된다.
const MAP_ID_DARK =
  (Constants.expoConfig?.extra?.googleMapIdDark as string | undefined) ??
  "449973237f53c8cbcd81d11f";
// 라이트용 Map ID가 없으면 대신 lightMapStyle(JSON)로 라이트를 강제한다.
// 폐기
const MAP_ID_LIGHT =
  (Constants.expoConfig?.extra?.googleMapIdDark as string | undefined) ??
  "449973237f53c8cbcd81d11f";

/** 선택된 핀으로 카메라를 옮길 때 쓰는 확대 수준. */
const FOCUS_ZOOM = 17;

export type MissionPin = {
  mission: Mission;
  coordinate: Coords;
};

type MissionMapProps = {
  missions: readonly Mission[];
  /** 위치를 아직 못 구했을 때 지도를 처음 띄울 기준점. */
  origin: Coords;
  userLocation: Coords | null;
  hasPermission: boolean;
  selectedId: string | null;
  /** 같은 미션이 이미 선택돼 있어도 카메라를 다시 맞추고 싶을 때 값을 올린다. */
  focusRequest: number;
  onSelectMission: (id: string) => void;
  onPressMap: () => void;
  /** 상단바가 지도를 덮는 높이. 구글 로고·나침반과 카메라 중심 계산에 쓴다. */
  topPadding: number;
  /** 하단 네비바(+열려 있는 상세 시트)가 지도를 덮는 높이. */
  bottomPadding: number;
};

export default function MissionMap({
  missions,
  origin,
  userLocation,
  hasPermission,
  selectedId,
  focusRequest,
  onSelectMission,
  onPressMap,
  topPadding,
  bottomPadding,
}: MissionMapProps) {
  const { colors, mode } = useTheme();
  const mapRef = useRef<MapView>(null);
  const centeredOnUser = useRef(false);
  const animatedFor = useRef<string | null>(null);

  // 미션은 서버에서 받은 위경도를 그대로 쓴다.
  const pins = useMemo<MissionPin[]>(
    () =>
      missions.map((mission) => ({
        mission,
        coordinate: {
          latitude: mission.latitude,
          longitude: mission.longitude,
        },
      })),
    [missions],
  );

  // 정확한 위치가 처음 도착했을 때 한 번만 내 위치로 이동한다.
  useEffect(() => {
    if (!userLocation || centeredOnUser.current) return;
    centeredOnUser.current = true;
    mapRef.current?.animateCamera(
      { center: userLocation, zoom: 16.4 },
      { duration: 600 },
    );
  }, [userLocation]);

  // 핀을 고르면 그 핀을 화면 중앙(패딩 제외 영역)으로 옮긴다. 상세 시트 높이가
  // bottomPadding에 반영되므로 핀은 시트에 가려지지 않는 위치로 온다.
  //
  // 목록이 다시 내려와 pins가 갱신될 때 카메라가 또 튀지 않도록
  // "어떤 선택에 대해 이미 움직였는지"를 토큰으로 기억한다.
  const focusToken = selectedId ? `${selectedId}#${focusRequest}` : null;
  useEffect(() => {
    if (!focusToken || !selectedId) {
      animatedFor.current = null;
      return;
    }
    if (animatedFor.current === focusToken) return;
    const pin = pins.find((item) => item.mission.id === selectedId);
    if (!pin) return;
    animatedFor.current = focusToken;
    mapRef.current?.animateCamera(
      { center: pin.coordinate, zoom: FOCUS_ZOOM },
      { duration: 420 },
    );
  }, [focusToken, pins, selectedId]);

  return (
    <ThemedMap
      // 테마마다 새로 마운트해 새 Map ID와 패딩 상태를 적용한다.
      key={mode}
      mapRef={mapRef}
      mode={mode}
      center={userLocation ?? origin}
      hasPermission={hasPermission}
      topPadding={topPadding}
      bottomPadding={bottomPadding}
      onPressMap={onPressMap}
    >
      {pins.map((pin) => (
        <MissionMarker
          key={pin.mission.id}
          pin={pin}
          mode={mode}
          colors={colors}
          selected={pin.mission.id === selectedId}
          onPress={() => onSelectMission(pin.mission.id)}
        />
      ))}
    </ThemedMap>
  );
}

type ThemedMapProps = {
  mapRef: React.RefObject<MapView | null>;
  mode: ThemeMode;
  center: Coords;
  hasPermission: boolean;
  topPadding: number;
  bottomPadding: number;
  onPressMap: () => void;
  children: React.ReactNode;
};

/**
 * 테마별로 새로 마운트되는 지도 본체.
 *
 * mapPadding은 뷰에 크기가 생긴 뒤에 적용해야 반영이 보장된다. 라이브러리가 패딩을
 * `setPaddingDeferred`/`shouldRestorePadding` 플래그와 뷰 크기 조건으로 처리하기 때문에
 * (MapView.java), 생성 시점에 넘기면 간헐적으로 무시된다. 그래서 실제 렌더가 끝난 뒤
 * 1dp만 바꿔 프롭 갱신을 한 번 더 유발한다(눈에 보이지 않는 차이).
 */
function ThemedMap({
  mapRef,
  mode,
  center,
  hasPermission,
  topPadding,
  bottomPadding,
  onPressMap,
  children,
}: ThemedMapProps) {
  const [loaded, setLoaded] = useState(false);
  const mapId = mode === "dark" ? MAP_ID_DARK : MAP_ID_LIGHT;
  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={styles.map}
      onMapLoaded={() => setLoaded(true)}
      onPress={onPressMap}
      initialCamera={{
        center,
        pitch: 0,
        heading: 0,
        altitude: 1000,
        zoom: 16.4,
      }}
      mapPadding={{
        top: topPadding,
        right: 0,
        bottom: bottomPadding + (loaded ? 1 : 0),
        left: 0,
      }}
      pitchEnabled
      rotateEnabled
      showsBuildings
      showsUserLocation={hasPermission}
      showsMyLocationButton={hasPermission}
      followsUserLocation={false}
      googleMapId={mapId}
      // Map ID가 있으면 Cloud 스타일이 우선이라 customMapStyle은 무시된다.
      // 라이트용 Map ID가 없을 때만 JSON 스타일로 라이트를 강제한다. (폐기)
      // customMapStyle={mode === "light" && !mapId ? lightMapStyle : undefined}
      userInterfaceStyle={mode}
      toolbarEnabled={false}
    >
      {children}
    </MapView>
  );
}

/**
 * 미션 위치 핀.
 *
 * `tracksViewChanges`를 계속 켜두면 커스텀 뷰 마커가 매 프레임 비트맵으로 다시 그려져
 * 지도 조작이 무거워진다. 그래서 마운트·선택·테마가 바뀐 직후 잠깐만 켜고 끈다.
 */
function MissionMarker({
  pin,
  mode,
  colors,
  selected,
  onPress,
}: {
  pin: MissionPin;
  mode: ThemeMode;
  colors: AppTheme["colors"];
  selected: boolean;
  onPress: () => void;
}) {
  const [tracking, setTracking] = useState(true);

  useEffect(() => {
    setTracking(true);
    const timer = setTimeout(() => setTracking(false), 700);
    return () => clearTimeout(timer);
  }, [mode, selected]);

  const status = statusMeta[pin.mission.status];
  // 상태별 강조색. 모집 중은 초록, 진행 중은 주황, 완료는 흐리게 둔다.
  const accent =
    status.tone === "orange"
      ? colors.orange
      : status.tone === "muted"
        ? colors.faint
        : colors.green;
  const fill = selected ? colors.green : colors.surface;
  return (
    <Marker
      coordinate={pin.coordinate}
      onPress={onPress}
      tracksViewChanges={tracking}
      anchor={{ x: 0.5, y: 1 }}
      zIndex={selected ? 2 : 1}
      accessibilityLabel={`${pin.mission.title}, ${status.label}, ${pin.mission.rewardPoint}포인트`}
    >
      <View style={styles.pinWrap}>
        <View
          style={[
            styles.pin,
            {
              backgroundColor: fill,
              borderColor: selected ? colors.green : accent,
            },
            selected && styles.pinSelected,
          ]}
        >
          <Ionicons
            name={status.icon}
            size={selected ? 17 : 14}
            color={selected ? "#17310b" : accent}
          />
          <Text
            style={[
              styles.pinText,
              { color: selected ? "#17310b" : colors.text },
              selected && styles.pinTextSelected,
            ]}
          >
            {pin.mission.rewardPoint}P
          </Text>
        </View>
        <View style={[styles.pinTail, { borderTopColor: fill }]} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  pinWrap: { alignItems: "center" },
  pin: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  pinSelected: { paddingHorizontal: 10, paddingVertical: 7 },
  pinText: { fontFamily: "WantedSansB", fontSize: 10 },
  pinTextSelected: { fontSize: 12 },
  pinTail: {
    borderLeftColor: "transparent",
    borderLeftWidth: 5,
    borderRightColor: "transparent",
    borderRightWidth: 5,
    borderTopWidth: 7,
    height: 0,
    marginTop: -1,
    width: 0,
  },
});
