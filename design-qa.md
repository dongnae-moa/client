# Dongnae-Moa home screen design QA

## Evidence

- Source visual truth: `C:\Users\krjih\Downloads\Mobile Devices\Screenshot_20260804_214939_Expo Go.jpg`
- Implementation capture: `C:\Users\krjih\Documents\GEEKs\client\dongnae-home-v2-top.png`
- State: Android physical device `SM-S911N`, Expo Go SDK 57, home tab at the top of the scroll view
- Source pixels: 1080 x 2197 portrait
- Implementation pixels: 1080 x 2340 portrait, density 480 (360 x 780 dp)
- Normalization: compared the app-owned portrait content after accounting for the source crop, Android system bars, density, and Expo Go development chrome

## Comparison

The updated implementation uses the supplied logo asset with safe-area top padding, removes the hamburger menu, and follows the reference hierarchy of `추천 미션` → one featured mission → a mission-card rail. The mission rail is horizontally swipable and uses the Notion `테스트 데이터` values for community order, accessibility, facility-check, and environment missions. The rank line was replaced with a circular `73/100` Community XP meter, and the provided liquid-glass camera-style navigation was adapted to the existing four routes.

## Required fidelity surfaces

- Fonts and typography: Wanted Sans regular/bold are used for Korean display hierarchy; H2-sized section labels are left-aligned and the previous centered greeting was removed.
- Spacing and layout rhythm: safe-area padding keeps the logo below the device camera/status area; recommendation, swipe rail, progress card, community status, daily mission, and persistent navigation maintain clear vertical grouping.
- Colors and visual tokens: black background, dark surfaces, pale-green recommendation, green ring progress, and Gold badge preserve the existing Dongnae-Moa direction while the liquid-glass bar adds the supplied translucent treatment.
- Image quality and asset fidelity: `assets/images/로고임.png` is used for the real wordmark, `assets/images/omg.png` is reused for the Notion scooter dummy missions, and Ionicons provide interface icons.
- Copy and content: mission titles, categories, times, points, and verification data are drawn from Notion `테스트 데이터`; no full repeated mission list is shown on the home screen.

## Primary interactions checked

- Recommended mission card routes to `/mission`.
- Horizontal mission rail snaps between four dummy cards and updates its position indicator.
- Circular progress/activity card routes to `/my`.
- Neighborhood status card routes to `/map`.
- Daily mission card routes to `/mission`.
- Liquid-glass bottom bar navigates home/map/mission/my; the mission tab uses the camera-style center treatment and supports horizontal tab swiping.

## Comparison history

1. Previous pass: the original dark home showed a centered greeting, a text-only logo, a straight rank line, and a flat four-item bottom bar.
2. Fixes: replaced the logo with the supplied asset, added safe-area padding, removed the hamburger, added the Notion-backed swipable mission rail, changed progress to a circular 73/100 meter, and adapted `FloatingNavBar.tsx`.
3. Post-fix evidence: `dongnae-home-v2-top.png` shows the logo fully visible, the recommendation and rail at the top, the 73/100 ring, and the new camera-style bottom navigation on the connected Android device.

## Validation

- `npx tsc --noEmit` passed.
- `git diff --check` passed.
- Expo Go physical-device render passed after wrapping the app in `GestureHandlerRootView`.

## Final result

passed
