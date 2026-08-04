# Dongnae-Moa mobile design QA

## Evidence

- Reference: `C:\Users\krjih\Downloads\Mobile Devices\Screenshot_20260804_214939_Expo Go.jpg`
- Navigation motion reference: `C:\Users\krjih\Downloads\Screen_Recording_20260804_205341.mp4`
- Side-by-side comparison: `C:\Users\krjih\Documents\GEEKs\client\design-qa-comparison.png`
- Dark implementation: `C:\Users\krjih\Documents\GEEKs\client\device-home-final.png`
- Light implementation: `C:\Users\krjih\Documents\GEEKs\client\device-settings-light-final.png`
- Device: connected Android physical device through Expo Go SDK 57, 1080 x 2340 capture

## Comparison and decisions

The implementation keeps the reference information hierarchy—brand, one recommended mission, secondary missions, progress, and neighborhood context—but reduces repeated list density and colorful decoration. The home Community XP card remains the central `73/100` experience. The supplied video was used for the floating navigation behavior: translucent capsule, fixed circular indicators, center mission action, horizontal-only drag, clamped edges, and spring snap.

## Required fidelity surfaces

- Themes: dark and light palettes share spacing and typography while surfaces, borders, status-bar contrast, and logo treatment adapt per mode.
- Brand: `assets/images/로고임.png` is used for light mode and `assets/images/logo-dark.png` is the high-contrast white/green variant for dark mode. The visible logo is reduced to roughly half the previous size.
- Navigation: five items are present in the requested order—홈, 지도, 미션, 커뮤니티, 마이. 미션 stays centered with a green circular action and checkmark icon; 커뮤니티 uses chat bubbles. The old hamburger and camera mission icon are gone.
- Liquid glass: the navbar uses `BlurView`, translucent tint, gloss, border, shadow, and a 56 x 56 circular indicator. Only the focused icon springs; label and circle remain stable. The pan gesture is horizontal, clamped, and snaps to the nearest tab.
- Screens: map, mission detail, community, my page, and settings now share a restrained surface/card system with realistic dummy content and the persistent nav.

## Interactions checked

- Fast Refresh physical-device render opened successfully after Metro reload.
- UI hierarchy exposed all five tab labels through Android UIAutomator.
- Tapped 지도, 미션, 커뮤니티, 마이 and verified titles: `동네 지도`, `미션 상세`, `커뮤니티`, `마이페이지`.
- Swiped the navbar from the right edge to the left; it clamped and spring-snapped to 홈.
- Opened 설정 from 마이페이지 and switched 다크 → 화이트; verified the light surface, dark text, and light-mode navbar.
- Home mission rail still snaps between four Notion-backed dummy cards.

## Validation

- `npx.cmd tsc --noEmit` passed.
- `git diff --check` passed.
- Metro Fast Refresh physical-device render passed.

## Final result

passed
