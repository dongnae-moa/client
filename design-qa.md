# Dongnae-Moa home screen design QA

## Evidence

- Source visual truth: `C:\Users\krjih\AppData\Local\Temp\codex-clipboard-81728254-2bdc-4375-9a70-5a3e00f97699.png`
- Implementation capture: `C:\Users\krjih\Documents\GEEKs\client\dongnae-home.png`
- State: Android physical device, Expo Go SDK 57, home tab at the top of the scroll view
- Source pixels: 530 x 1142 portrait
- Implementation pixels: 1080 x 2340 portrait, Samsung SM-S911N, physical density 480 (360 x 780 dp)
- Normalization: compared portrait composition and app-owned content after accounting for the device density and Expo Go development overlay

## Comparison

The implementation keeps the reference hierarchy: one large recommended mission, a compact rank/progress state, a neighborhood status summary, one daily micro-mission, and four persistent bottom tabs. The dark surface, pale-green mission emphasis, colored status icons, rounded cards, and Korean display hierarchy are all present in the same order.

The first pass allowed the daily mission card to sit behind the persistent tab bar. The card and tab bar were compacted, then re-captured; the daily mission image, title, reward, and CTA are now visible above the tab bar in the initial viewport.

## Required fidelity surfaces

- Fonts and typography: Wanted Sans regular/bold are used for the Korean hierarchy, with large display text reserved for the recommendation and section headings.
- Spacing and layout rhythm: the top recommendation, rank state, neighborhood card, daily mission, and bottom navigation fit the initial 360 x 780 dp viewport without app-owned overflow.
- Colors and visual tokens: black background, dark gray surfaces, pale-green primary CTA/card, green progress, and purple/blue/orange status accents match the supplied direction.
- Image quality and asset fidelity: the existing project scooter photo is used for the daily mission; Ionicons supply the interface icons rather than hand-drawn shapes or glyph approximations.
- Copy and content: the home uses one recommended mission and representative map/mission/my content instead of repeating the full mission list.

## Primary interactions checked

- Recommended mission card routes to `/mission`.
- Rank/activity card routes to `/my`.
- Neighborhood status card routes to `/map`.
- Daily mission card routes to `/mission`.
- Bottom tabs retain the existing home/map/mission/my route structure.
- Menu control exposes an accessible alert state for the current dummy-data build.

## Final result

passed
