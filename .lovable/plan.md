## Ask the Coach — relocate + question history (stubbed)

Frontend-only change. No engine/edge/SQL edits. Existing mock coach behavior preserved.

### 1. New component: `src/components/backtesting/BacktestCoachPanel.tsx`
Mirrors the pattern of `BacktestComparePanel` and `BacktestOptimizePanel`:
- Renders an outline `Button` (`variant="outline" size="sm" gap-2`) with a `MessageCircle` (lucide) icon and label "Ask the Coach".
- Button is a `DialogTrigger`; opens a `Dialog` (`max-w-2xl max-h-[90vh]`) titled "Ask the Coach".
- Props: `run: BacktestRun | null`, `teachingArr`, `sameSignal`, `stopBlock`, `cardMessage` — same context CoachChat currently receives.
- Renders `null` if there's no run, no stop config, or no teaching data (same gates `BacktestTeachPanel` uses today).
- Body of the dialog:
  - Scrollable chat thread (max-h e.g. `60vh`, `overflow-y-auto`) showing session Q&A in chronological order. User bubbles right-aligned (primary), assistant left-aligned with `ReactMarkdown` — reuses the exact styling in `CoachChat.tsx`.
  - Composer at the bottom: `Textarea` + send `Button`, Enter-to-send / Shift+Enter newline (lifted verbatim from `CoachChat`).
  - Admin-only Live/Mock toggle in the dialog header (moved out of the teaching card).
  - "N left today" counter rendered when the coach returns a remaining count (existing behavior).
- Thread state is in-memory: `useState<ChatMsg[]>([])`, per session, per mount. Not persisted. Reset only when the component unmounts (documented follow-up: persist per user/run).
- Uses the same `supabase.functions.invoke('coach-agent', …)` call as today, so the existing mock/live behavior is unchanged.

### 2. Wire the button into the Compare/Optimize row
The trigger buttons for `BacktestComparePanel` and `BacktestOptimizePanel` render as top-level buttons in `src/pages/Backtesting.tsx`. Add `<BacktestCoachPanel run={latest} />` alongside them so all three appear in the same visual row, in this order: Compare runs · Optimize · Ask the Coach.
- The Coach panel needs the same teaching context the TeachPanel builds. Two options:
  1. Compute the teaching context inside `BacktestCoachPanel` from `run.results_detail._teaching` (same logic already in `BacktestTeachPanel`).
  2. Lift that derivation into a small helper (`src/lib/teachingContext.ts`) reused by both panels.
- Chosen: option 1 for scope minimalism — copy the derivation locally, no shared-lib refactor.

### 3. Remove inline coach from `BacktestTeachPanel.tsx`
- Delete the `CoachChat` import + render.
- Delete the admin Live/Mock `adminToggle` block (moved into the coach dialog).
- Remove the `mockMode` state.
- Remove the `buildCardMessage` helper (moved into `BacktestCoachPanel`).
- Teaching cards continue to render exactly as they do today (all six untouched).

### 4. Keep `CoachChat.tsx` as-is
Left in place so nothing else that imports it breaks; the new panel implements its own composer directly (reuses the same look/behavior) so we can freely tune header/mock toggle placement in the dialog without changing CoachChat's public contract.

### Acceptance
- Preview `/backtesting`: after a completed run with a stop, "Ask the Coach" button sits in the row with Compare runs / Optimize, same outline styling + leading icon.
- Clicking it opens a dialog containing a scrollable chat history + composer.
- Sending a question appends both the question and the mock coach reply to the history; previous entries remain visible.
- Old inline coach input under the stop teaching card is gone.
- Six teaching cards, Compare, Optimize, run history all unchanged; no console errors.

### Out of scope (follow-ups)
- Real Claude wiring (Live mode already exists but is off by default per feature flag).
- Persisting the thread across reloads or per user/run.
