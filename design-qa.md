# ALISA visual QA

Source visual truth: user attachment `Снимок экрана 2026-11-14 в 22.47.50.png` (980 × 778 px).
Implementation evidence: `/workspace/shared/alisa-orange-mobile.jpg`, captured through the cloud browser.
Implementation: isolated same-code fixture at `_style-preview.html`, removed after verification.
Viewport: 393 × 852 CSS px iframe; 378 px usable width with the desktop scrollbar. Browser zoom 100%. No device chrome was recreated.
State: main dashboard using synthetic training records; measurements, progress and plans also exercised. Production authentication and stored diary records were not altered.

## Scope and comparison

The supplied board is a style reference, not a request to copy its English fitness product or introduce steps, weather, social feeds or an unrelated avatar. Compared app-owned content: light neutral canvas, orange statistics and chart bars, powder-blue large sections, black controls, pill navigation and restrained type. The reference's phone bezels, status bars and unrelated personal imagery are intentionally excluded. The reference image and browser-rendered implementation were opened and inspected. Full dashboard and focused progress/form/navigation regions were checked; no claim of a pixel-identical clone is made.

## Required surfaces

- Typography: existing Manrope retained for Cyrillic and consistent loading; lighter 400/500 weights, 33 px mobile heading and 40 px statistics. No clipped labels observed.
- Spacing: 18 px mobile page gutters, 20 px card padding, 10 px tile gap, 22–30 px rounded sections. Fixed navigation floats above the bottom; content has compensating bottom padding.
- Colors: neutral #F0F1F3, ink #171717, orange #EF5B0C, blue #DFE5F2. Orange used for graphical emphasis, black/white for primary action contrast.
- Assets: existing ALISA vector mark recolored; Lucide icon system preserved as requested. No fabricated portrait, decorative raster substitute or duplicate phone chrome.
- Content: existing Russian section names preserved exactly. No new decorative headings or subtitles.

## Interactions and diagnostics

- Opened Plans accordion and verified its expanded exercise list.
- Entered a comma-decimal body measurement and verified the saved history card.
- Opened Progress and checked orange rounded bars and blue history cards.
- Root width equals scroll width in the mobile frame: 378 px; no horizontal document overflow.
- Checked captured error logs: extension metadata errors only; no application errors observed.
- All 16 Node tests passed, including PIN and cloud sync regressions.
- Physical iPhone/Safari was not tested.

## Findings and comparison history

No actionable P0/P1/P2 findings were identified in the style comparison. No visual corrections were needed after the rendered comparison. Intentional differences are the ALISA-specific content, the original mark, and the absence of the reference's avatar/decorative orb.

## Follow-up polish

P3: verify rendering on a physical iPhone when available.

final result: passed

## Report iteration

User-directed changes: grayscale report figures, lower menu, greeting, actionable dashboard, cycle hidden, workout load summaries. Single report was inspected in the 393 px mobile fixture through the cloud browser. Tables fit without document overflow (378 px usable width). Dashboard load card opened Progress; individual report displayed matching 7,590 kg for the synthetic fixture. Comparison summary also displayed 7,590 kg per selected synthetic session. No app console errors captured. PNG-download completion could not be confirmed through the browser event listener; the underlying canvas export remains in place. Corrected opening scroll position and report count labels after review. All 19 Node tests pass. Stored cycle measurements remain preserved; the cycle tab is removed.

## Cardio iteration

Browser tested at 393 × 852 CSS px using isolated synthetic records. Started an empty legacy plan named Кардио, entered 40 minutes and 320 active kcal, finished, then verified the dashboard showed 320 kcal and the cardio report showed time/calories with no weights or sets. Root scroll width equals 393 px client width. Plan type changes preserve program exercise arrays and historical session snapshots. Missing calories render a dash; active and total calories are never added together. All 22 tests passed. Temporary fixtures removed after verification.

## Coach assignment and records iteration

Mobile fixture 393 × 852 CSS px (378 px usable with desktop scrollbar). Verified the first exercise showed an actual best-weight set of 40 × 12 and separate maximum-reps set of 30 × 20. Entered a session-only coach assignment, observed it replace records live, cleared it and verified records returned. Navigated away and resumed the same draft. Document width equaled scroll width. Dashboard showed strength load and calories together; cardio minutes/calories covered by automated tests. Task editor now starts collapsed when reopening a session and its label updates live. Historical records ignore unfinished/current/future sessions and do not combine weight/reps from different sets. All 26 tests passed. No production private records modified during verification.
