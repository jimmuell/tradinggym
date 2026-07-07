## Goal
E2E verify the guided ORB walkthrough on the published URL (https://keen-chart-clone.lovable.app) as a Starter user. Test-only — no code changes.

## Approach
Drive the live published app with Playwright (headless Chromium) from the sandbox. Capture a screenshot at each of the 5 checkpoints and assert the required UI state, then report pass/fail per checkpoint.

## Steps

1. **Setup script** at `/tmp/browser/promptM/run.py`:
   - Launch Chromium headless, viewport 1280x1800.
   - Navigate to `https://keen-chart-clone.lovable.app/auth`.
   - Click the DEV auto-login "Starter" button.
   - Wait for redirect to a dashboard/simulator route.
   - Navigate to `/simulator?playback=db83bd35-4bdf-4dc4-a93b-4894e33ee537`.

2. **Checkpoint 1 — Pre-Start**
   - Screenshot `01_prestart.png`.
   - Assert: "Start walkthrough" button visible; top stepper shows 6 beat labels (Mark Opening Range … Execute & Review); all 6 checklist items unchecked; only first candle visible (no EMA/SMA overlay line, chart framed to bar 0).

3. **Checkpoint 2 — Beat 1**
   - Click "Start walkthrough". Screenshot `02_beat1.png`.
   - Assert: step 1 checked, steps 2–6 unchecked; chart shows ~3 opening-range candles; ORB High 4785.50 and ORB Low 4780.25 price lines visible; opening-range band rendered; coach note text present.

4. **Checkpoint 3 — Beats 2→4**
   - Click stepper beat 2 → screenshot `03_beat2.png`; assert exactly steps 1–2 checked; breakout label visible.
   - Click beat 3 → screenshot `03_beat3.png`; assert steps 1–3 checked; retest zone at ORB High visible.
   - Click beat 4 → screenshot `03_beat4.png`; assert steps 1–4 checked.

5. **Checkpoint 4 — Beat 5**
   - Click beat 5. Screenshot `04_beat5.png`.
   - Assert: step 5 checked; Entry 4785.50, Stop 4783.00, Target 4790.75 labels; green profit + red risk zones; R/R badge showing ~2:1.

6. **Checkpoint 5 — Beat 6**
   - Click beat 6. Screenshot `05_beat6_start.png`.
   - Click "Next candle" in a loop until outcome banner appears (or ~20 max). Screenshot `05_beat6_resolved.png`.
   - Assert: "Target hit +5.25 pts" text; step 6 checked; Blueprint Complete banner with "Try It Yourself" and "Replay" buttons.

7. **Report**
   - View each screenshot via `code--view` for visual confirmation.
   - Emit pass/fail + screenshot path per checkpoint 1–5, list discrepancies, flag issues, end with `Prompt M — Completed`.

## Technical notes
- Use `page.get_by_role`, `page.get_by_text` with regex for stable selectors.
- Since Playwright runs against the published URL (not localhost), no Supabase session injection is needed — DEV auto-login button handles auth in-app.
- Redirect one Playwright shell run per turn; patch script with `sed -i` if a selector misses rather than rewriting.
- Screenshots saved under `/tmp/browser/promptM/screenshots/`. No project files touched.
