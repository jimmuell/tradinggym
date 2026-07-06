## Make ORB Blueprint checklist phase-aware and visible during playback

Frontend-only. No schema, no trade-save changes, no ChartContainer changes.

### 1. `src/components/chart/BlueprintChecklist.tsx` — rework component

Keep existing `onStepsChange` and `resetKey` props (Simulator's `blueprintResetKey` still drives reset). Add new optional props:

```ts
mode?: 'manual' | 'guided';           // default 'manual'
currentPhase?: PlaybackPhase;
showMe?: boolean;
onShowMeChange?: (v: boolean) => void;
```

Import from `@/lib/playbackTypes`: `PlaybackPhase`, `PLAYBACK_PHASES`, `phaseToBarIndex`.

Add step→phase map:
```ts
const STEP_PHASE: PlaybackPhase[] =
  ['setup','confirmation','confirmation','confirmation','entry','exit'];
```

Derived-checked logic:
- When `mode === 'guided'` OR `showMe === true`, compute `derived[i] = PLAYBACK_PHASES.indexOf(currentPhase) >= PLAYBACK_PHASES.indexOf(STEP_PHASE[i])`. Render checkboxes disabled (read-only) using `derived` instead of local `checked`. Sequential visual lock still applies.
- When `mode === 'manual'` AND `!showMe`, keep the current click-to-check behavior untouched.
- Fire `onStepsChange` for both branches so `blueprintSteps` stays accurate for the trade save.

Header additions:
- Render a small "Show me" `<Checkbox>` + label in the panel header ONLY when `currentPhase !== undefined`. Calls `onShowMeChange`.
- Keep existing Reset button and "Blueprint Complete" state (based on whichever source is active).

### 2. `src/pages/Simulator.tsx` — wire it up

- Add `const [showMe, setShowMe] = useState(false);`
- Remove the `{!isPlaybackMode && ...}` gate around `<BlueprintChecklist>` so it renders in playback too. Pass:
  ```tsx
  <BlueprintChecklist
    onStepsChange={setBlueprintSteps}
    resetKey={blueprintResetKey}
    mode={isPlaybackMode ? 'guided' : 'manual'}
    currentPhase={isPlaybackMode || isPracticeWithScenario ? playback.phase : undefined}
    showMe={showMe}
    onShowMeChange={setShowMe}
  />
  ```
- Practice mode (`isPracticeWithScenario`, already defined) with `showMe` on: derive the effective phase from the current visible bar count using `phaseToBarIndex(phase, scenario)` — walk `PLAYBACK_PHASES` and pick the highest phase whose target index ≤ `playbackBarCount` (fallback to `'context'`). Pass that computed phase as `currentPhase` instead of `playback.phase` in the practice branch.
- When `isPracticeWithScenario && showMe`, also mount `<AnnotationLayer>` inside `playbackChildren` (mirroring the playback branch's pattern) so on-chart hints appear. Do NOT mount `PlaybackOverlay` in practice mode.

### Files touched

```text
src/components/chart/BlueprintChecklist.tsx   props + guided/showMe logic + header toggle
src/pages/Simulator.tsx                        render in all modes; showMe state; practice AnnotationLayer
```

### Out of scope (do not touch)

Trade save mutation, `steps_completed`, DB schema, `TradeOrderPanel`, `ChartContainer` internals, `src/components/checklist/*` template system, `AnnotationLayer` / `PlaybackOverlay` internals.

### Verify on published URL (https://keen-chart-clone.lovable.app)

- `/simulator?playback=db83bd35-4bdf-4dc4-a93b-4894e33ee537` — checklist visible; steps auto-check as phases advance (setup→1, confirmation→2-4, entry→5, exit→6). Checkboxes read-only.
- `/simulator?playback=db83bd35-4bdf-4dc4-a93b-4894e33ee537&practice=1` — checklist starts empty and clickable. Toggling "Show me" on reveals annotations and lights steps as bars advance past each phase index. Toggling off returns to manual.
- `/simulator` (no scenario) — unchanged: manual checklist, no "Show me" toggle, no annotations.

Publish → Update after edit.
