# Dongnae Moa mobile design QA

## Evidence

- Source screen board: `C:\Users\krjih\AppData\Local\Temp\codex-clipboard-d349942d-d4b0-4e6e-8aca-104cc4695ba6.png` (1536 x 1024)
- Navigation state reference: `C:\Users\krjih\AppData\Local\Temp\codex-clipboard-47f07b0d-86f4-4003-be28-7b5964879419.png` (826 x 226)
- Full comparison input: `C:\Users\krjih\Documents\GEEKs\client\design-qa-comparison-final.png` (2000 x 1200)
- Home implementation: `C:\Users\krjih\Documents\GEEKs\client\device-home-equal-nav.png` (1080 x 2340)
- Mission implementation: `C:\Users\krjih\Documents\GEEKs\client\device-mission-collapsed2.png` (1080 x 2340)
- Mission map-toggle state: `C:\Users\krjih\Documents\GEEKs\client\device-mission-map-toggle2.png` (1080 x 2340)
- Device/state: connected Android physical device, Expo Go SDK 57, dark theme, app viewport 1080 x 2340 physical pixels.
- Normalization: the source board contains three reduced phone captures and the nav reference is a focused crop, so comparisons use aligned content regions rather than pixel-for-pixel device frames. Implementation evidence is native 1080 x 2340 output at the device density.

## Findings

- No actionable P0/P1/P2 issues remain in the requested scope.
- Typography: Wanted Sans weights preserve the source hierarchy; long mission titles reduce from 18 to 15/16 px and wrap to two lines without overflowing.
- Spacing and layout: the map and overlapping bottom sheet were removed. The collapsible filter card, view toggle, sort controls, and mission cards now use consistent 10–24 px vertical gaps. Persistent navigation remains reachable without clipping scroll content.
- Colors and tokens: dark/light theme tokens remain intact. Every selected tab now uses the same filled lime 56 x 56 indicator and glow; every unselected tab is neutral. Mission has no independent background or shadow layer.
- Image quality: supplied light/dark logo assets remain crisp and clear of the camera safe area. No generated map raster or placeholder map artwork remains.
- Copy/content: filters cover distance, category, time, difficulty including 어려움, and points. Slider endpoints read 상관없음. Reward copy still explains gifticons, profile decoration, and nearby-store discounts.

## Interaction evidence

- Filter header collapses and expands while preserving filter state.
- Category and difficulty chips update selection; 거리/시간/포인트 sliders update continuously with 50 m, 1 minute, and 1 point steps.
- Moving all three sliders to the far right produced `거리 상관없음 · 시간 상관없음 · 포인트 상관없음` in Android UIAutomator.
- Sorting offers 가까운 순, 포인트 많은 순, 짧은 시간 순, and 쉬운 순.
- 목록/지도 toggle is functional. The 지도 state intentionally exposes an integration-ready empty surface and does not mount a map SDK or fake map, per ownership constraints.
- Navbar drag from 홈 to the right clamped and selected 마이. The indicator remains rooted globally and springs from the finger-release offset to the nearest tab; it no longer resets to the origin before snapping.
- Before the navigation fix, the 30 fps recording contained one frame with 89.2% white pixels. After switching the bottom-level routes to persistent tabs and theme-locking the native/root backgrounds, a five-route 134-frame recording had no full-screen white frame (maximum white-pixel ratio 0.268%).
- Pressing 설정 on 마이페이지 opens the settings controls inline; theme changes and all settings rows remain under the 마이 tab.
- Android UIAutomator exposed all five tabs and selected states. Android `ReactNativeJS:E` logcat output was empty after interaction testing.

## Comparison history

1. Earlier P1: a native map/map raster conflicted with the requested ownership boundary and overlapped the mission card.
   - Fix: removed all map rendering and generated map assets, then replaced the mission surface with filters and results.
   - Post-fix evidence: `device-mission-collapsed2.png`.
2. Earlier P1: stack route replacement briefly exposed the native light window between screens; frame 25 of `nav-equal-drag.mp4` measured 89.2% white pixels.
   - Fix: bottom destinations now use persistent, non-detaching tabs; navigation uses tab navigation instead of route replacement; React Navigation, system UI, gesture root, and scene backgrounds all share the active app theme.
   - Post-fix evidence: `nav-no-flash-final.mp4`, 134 analyzed frames, no full-screen white frame.
3. Earlier P1: mission had a separate green/elevated background while other selected tabs used a neutral moving indicator; the idle mission elevation could render as an octagonal underlay on Android.
   - Fix: removed the mission-only background/elevation and unified all five tabs behind one filled lime circular indicator with the same glow.
   - Post-fix evidence: `device-home-equal-nav.png` and `device-mission-collapsed2.png`.
4. Earlier P2: the mission surface was too dense and did not provide filtering, sorting, or view controls.
   - Fix: added a collapsible filter, fine-grained sliders with a no-preference endpoint, four sort modes, and list/map toggle.
   - Post-fix evidence: `device-mission-collapsed2.png` and `device-mission-map-toggle2.png`.

## Focused comparison

- The navigation region required focused comparison because selection fill, glow, and the removed mission-only layer are too small to judge from the three-screen board. `design-qa-comparison-final.png` pairs the focused nav source with the final home-selected implementation.
- The mission region is compared as a product-direction adaptation rather than a literal map clone: the user explicitly removed map ownership from this change, so the implementation intentionally preserves the source's minimal dark cards and hierarchy while replacing map content with filter/list controls.

## Follow-up polish

- P3: when the separate map implementation lands, replace only the prepared map-state body and retain the current filter, sort, and view state contract.

final result: passed
