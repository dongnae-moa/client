import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { statusMeta } from "../data/missions";
import type { AppTheme, ThemeMode } from "../theme/ThemeContext";
import type { Coords } from "../utils/geo";
import type { MissionPin } from "./MissionMap";

type ExpoGoMissionMapProps = {
  pins: readonly MissionPin[];
  center: Coords;
  userLocation: Coords | null;
  selectedId: string | null;
  focusRequest: number;
  mode: ThemeMode;
  colors: AppTheme["colors"];
  topPadding: number;
  bottomPadding: number;
  onSelectMission: (id: string) => void;
  onPressMap: () => void;
};

type WebMapMessage =
  | { type: "ready" }
  | { type: "mission"; id: string }
  | { type: "map" };

function serializeForScript(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/**
 * Expo Go의 내장 Google Maps 키가 기기에서 거절될 때 사용하는 개발용 지도.
 *
 * Leaflet은 실제 앱 화면을 흉내 낸 정적 이미지가 아니라 핀 선택, 드래그, 관성 이동,
 * 두 손가락 확대를 지원하는 지도다. 정식 개발/배포 빌드는 MissionMap의 네이티브
 * Google Map 경로를 그대로 사용한다.
 */
export default function ExpoGoMissionMap({
  pins,
  center,
  userLocation,
  selectedId,
  focusRequest,
  mode,
  colors,
  topPadding,
  bottomPadding,
  onSelectMission,
  onPressMap,
}: ExpoGoMissionMapProps) {
  const webRef = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const html = useMemo(() => {
    const mapPins = pins.map(({ mission, coordinate }) => {
      const status = statusMeta[mission.status];
      const accent =
        status.tone === "orange"
          ? colors.orange
          : status.tone === "muted"
            ? colors.faint
            : colors.green;
      return {
        id: mission.id,
        title: mission.title,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        rewardPoint: mission.rewardPoint,
        accent,
      };
    });
    const payload = serializeForScript({
      pins: mapPins,
      center,
      userLocation,
      topPadding,
      bottomPadding,
    });
    const tileFilter =
      mode === "dark"
        ? "brightness(.72) saturate(.7) invert(1) hue-rotate(180deg)"
        : "none";

    return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { width: 100%; height: 100%; margin: 0; background: ${colors.background}; }
    body { overflow: hidden; }
    .leaflet-tile-pane { filter: ${tileFilter}; }
    .leaflet-control-attribution {
      margin: 0 8px ${Math.max(8, bottomPadding + 6)}px 0 !important;
      border-radius: 6px; background: ${colors.surface}cc !important;
      color: ${colors.muted} !important; font: 10px/14px sans-serif;
    }
    .leaflet-control-attribution a { color: ${colors.text} !important; }
    .mission-marker { background: transparent; border: 0; }
    .mission-pin {
      width: 38px; height: 38px; box-sizing: border-box; border-radius: 50% 50% 50% 8px;
      transform: rotate(-45deg); display: grid; place-items: center;
      background: ${colors.surface}; border: 3px solid var(--accent);
      box-shadow: 0 3px 10px rgba(0,0,0,.35); transition: .18s ease;
    }
    .mission-pin::after {
      content: ''; width: 10px; height: 10px; border-radius: 50%;
      background: var(--accent); transform: rotate(45deg);
    }
    .mission-pin.selected {
      background: ${colors.green}; border-color: ${colors.green};
      transform: rotate(-45deg) scale(1.16);
      box-shadow: 0 0 0 7px ${colors.green}35, 0 4px 15px rgba(0,0,0,.4);
    }
    .mission-pin.selected::after { background: ${colors.background}; }
    .user-dot {
      width: 18px; height: 18px; border-radius: 50%; background: #4285f4;
      border: 3px solid white; box-shadow: 0 0 0 9px rgba(66,133,244,.22);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    (function () {
      var data = ${payload};
      var map = L.map('map', {
        zoomControl: false,
        attributionControl: true,
        preferCanvas: true,
        tap: true,
        touchZoom: true,
        scrollWheelZoom: true
      }).setView([data.center.latitude, data.center.longitude], 16);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      var markers = {};
      var selectedId = null;
      function send(message) {
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      }
      function iconFor(item, selected) {
        return L.divIcon({
          className: 'mission-marker',
          html: '<div class="mission-pin' + (selected ? ' selected' : '') +
            '" style="--accent:' + item.accent + '"></div>',
          iconSize: [44, 44],
          iconAnchor: [22, 41]
        });
      }
      function select(id) {
        if (selectedId && markers[selectedId]) {
          markers[selectedId].marker.setIcon(iconFor(markers[selectedId].item, false));
        }
        selectedId = id || null;
        if (selectedId && markers[selectedId]) {
          markers[selectedId].marker.setIcon(iconFor(markers[selectedId].item, true));
        }
      }
      function focus(id) {
        if (!id || !markers[id]) return;
        var item = markers[id].item;
        map.flyTo([item.latitude, item.longitude], 17, { duration: .42 });
        window.setTimeout(applyVisibleCenterOffset, 440);
      }
      function applyVisibleCenterOffset() {
        var offset = (data.topPadding - data.bottomPadding) / 2;
        if (Math.abs(offset) > 1) map.panBy([0, -offset], { animate: false });
      }

      data.pins.forEach(function (item) {
        var marker = L.marker([item.latitude, item.longitude], {
          icon: iconFor(item, false),
          keyboard: true,
          title: item.title + ', ' + item.rewardPoint + '포인트'
        }).addTo(map);
        marker.on('click', function (event) {
          if (event.originalEvent) L.DomEvent.stopPropagation(event.originalEvent);
          select(item.id);
          send({ type: 'mission', id: item.id });
        });
        markers[item.id] = { marker: marker, item: item };
      });
      if (data.userLocation) {
        L.marker([data.userLocation.latitude, data.userLocation.longitude], {
          icon: L.divIcon({ className: '', html: '<div class="user-dot"></div>', iconSize: [24,24], iconAnchor: [12,12] }),
          interactive: false,
          zIndexOffset: 1000
        }).addTo(map);
      }
      map.on('click', function () {
        select(null);
        send({ type: 'map' });
      });

      function receive(event) {
        try {
          var message = JSON.parse(event.data);
          if (message.type === 'selection') {
            select(message.id);
            if (message.focus) focus(message.id);
          }
        } catch (_) {}
      }
      document.addEventListener('message', receive);
      window.addEventListener('message', receive);
      window.setTimeout(function () {
        map.invalidateSize();
        applyVisibleCenterOffset();
        send({ type: 'ready' });
      }, 0);
    })();
  </script>
</body>
</html>`;
  }, [bottomPadding, center, colors, mode, pins, topPadding, userLocation]);

  useEffect(() => {
    if (!ready) return;
    webRef.current?.postMessage(
      JSON.stringify({
        type: "selection",
        id: selectedId,
        focus: Boolean(selectedId),
        focusRequest,
      }),
    );
  }, [focusRequest, ready, selectedId]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let message: WebMapMessage;
      try {
        message = JSON.parse(event.nativeEvent.data) as WebMapMessage;
      } catch {
        return;
      }
      if (message.type === "ready") {
        setReady(true);
        return;
      }
      if (message.type === "mission") {
        onSelectMission(message.id);
        return;
      }
      if (message.type === "map") onPressMap();
    },
    [onPressMap, onSelectMission],
  );

  if (loadError) {
    return (
      <View style={[styles.error, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorTitle, { color: colors.text }]}>지도를 불러오지 못했어요</Text>
        <Text style={[styles.errorBody, { color: colors.muted }]}>네트워크를 확인한 뒤 다시 열어주세요.</Text>
      </View>
    );
  }

  return (
    <WebView
      ref={webRef}
      style={[styles.map, { backgroundColor: colors.background }]}
      source={{ html, baseUrl: "https://localhost" }}
      originWhitelist={["https://*", "http://*"]}
      javaScriptEnabled
      domStorageEnabled
      nestedScrollEnabled
      overScrollMode="never"
      onLoadStart={() => {
        setReady(false);
        setLoadError(false);
      }}
      onMessage={handleMessage}
      onError={() => setLoadError(true)}
    />
  );
}

const styles = StyleSheet.create({
  map: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  error: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  errorTitle: { fontSize: 18, fontWeight: "800", marginBottom: 7 },
  errorBody: { fontSize: 14, fontWeight: "600" },
});
