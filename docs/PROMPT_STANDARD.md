# Prompt Standard

One canonical shape for every prompt that leaves Claude Chat for **Claude Code** or the **Lovable agent**. Copy the matching template from this file, fill it in, hand it to Jim. If a prompt doesn't follow this, it's off-standard — don't send it.

Companion doc: **`DEPLOY_WORKFLOW.md`** (how a change actually reaches production).

---

## Prompt hygiene — one clean artifact per project (READ THIS FIRST)

A prompt is a **standalone, paste-ready artifact for exactly one builder.** It is not a design doc.

- **One prompt = one project.** Never bundle two builders' work in a single prompt or a single document. A change that spans the engine and the app is **two separate prompts**, delivered as separate artifacts (engine → Claude Code; app → Lovable).
- **No rationale inside the prompt.** Diagnosis, root cause, trade-offs, sequencing, and any "why" belong in the **chat stream** (and Notion for durability) — never inside the prompt. The prompt body contains only: header block → TASK → precise instructions → deploy/verify → report-back.
- **The prompt starts at the header block.** The very first line is `Platform:` — nothing above it (no title, no "here's the prompt", no copy markers). The whole file IS the prompt, so Jim can select-all and paste.
- **Plain headers, no divider bars.** Sections are bare labels — `STEP 0 — gate`, `TASK — <summary>`, `REPORT BACK (exactly this):` — with the body indented two spaces beneath (four for nested). No `────` rules, no code fences.
- If you catch yourself writing a paragraph of context into a prompt, stop — that paragraph goes in chat, not the prompt.

---

## Who does what

- **Claude Chat** — head engineer / PM. Writes every spec and every build prompt, reviews all work against the spec before Jim merges. Does not run access-control SQL.  
- **Claude Code** — the **engine** repo (`jimmuell/mes-orb-strategy`), plus app-repo tasks that need a live run to reproduce/verify (render/timing bugs, running the e2e suite). Lovable stays the default for app feature authoring.  
- **Lovable agent** — the **app**: UI, edge functions, and SQL (`jimmuell/tradinggym`).  
- **Jim** — decides, approves, merges, and runs all live/manual steps (Railway, publish, applying migrations, access-control SQL).

**Cost routing:** prefer Claude Code when a task *can* be done there (more credits than Lovable). Never leave Claude Code **and** Lovable both holding pending changes on the same repo at once — pick one owner per change.

### Testing — who runs what

- **Lovable** (app sandbox): unit/component tests (Vitest + RTL), edge-function Deno tests, TypeScript typecheck, production build verification, security scans (the publish gate), console/network debugging in Preview, and DOM-observable e2e flows on Preview/Published.
- **Claude Code** (local run): local reproduction of render/timing/effect-ordering bugs, canvas/chart visual verification via screenshots, running the Playwright e2e suite, and engine (Python/backtest) tests. Default owner for any app bug that only reproduces at runtime — this extends "engine only" to app-repo tasks that need a live run to verify.
- **Cowork / Chat**: authors & reviews test specs/prompts, reviews the real diff before merge, and can drive the live app in the browser for visual/e2e spot-checks. Does not run the suite.
- **Jim**: merges, publishes, runs manual/live steps.

Rule of thumb: charting/canvas correctness must be verified **visually** (screenshots), not by DOM assertions — a change can pass typecheck AND DOM-e2e and still render wrong. One owner per change.

---

## Required header block — every prompt

The five header lines sit at the **very top** of the prompt, each on its own line, as their own section. Put a **blank line after every header line** (not just at the end) — markdown collapses single newlines into one paragraph, so a blank line is what forces a hard return after each line in a rendered viewer. All five lines are present on **every** prompt (Lovable included) — seeing the repo + local path is what stops a prompt from being pasted into the wrong project. The `Platform:` line carries the paste instruction. The `Prompt:` line carries the prompt's name/ID, which the executor echoes back on completion (see **Report-back format**).

Shape:

```
Platform:    <platform> (paste this code into this platform)
Project:     TradingGYM Web | TradingGYM Live | TradingGYM (engine)
Repo:        jimmuell/tradinggym | jimmuell/trading-gym-live | jimmuell/mes-orb-strategy
Prompt:      <name/ID — e.g. A, B, C, or a short label>
Local path:  /Users/jameslmueller/Projects/<repo>

<blank line, then the body: STEP 0 / TASK / REPORT BACK>
```

Canonical header blocks:

```
Platform:    Lovable Project (paste this code into this platform)
Project:     TradingGYM Web
Repo:        jimmuell/tradinggym
Prompt:      <name>
Local path:  /Users/jameslmueller/Projects/tradinggym
```

```
Platform:    Claude Code (paste this code into this platform)
Project:     TradingGYM (engine)
Repo:        jimmuell/mes-orb-strategy
Prompt:      <name>
Local path:  /Users/jameslmueller/Projects/mes-orb-strategy
```

```
Platform:    Claude Code (paste this code into this platform)
Project:     TradingGYM Live
Repo:        jimmuell/trading-gym-live
Prompt:      <name>
Local path:  ~/Projects/trading-gym-live
```

---

## Claude Code prompts (engine)

Rules, in order:

1. **STEP 0 — repo-confirmation gate.** Always first. Nothing is read, edited, run, or committed until the remote and path are confirmed.  
2. **Stage explicit paths only. Never `git add -A`.** (This is what swept a stray file into ADR-038. `git add -A` grabs anything sitting in the working tree.)  
3. **Commit subject leads with the ADR:** `ADR-0NN: <short imperative summary>`. Put the conventional-commit type/detail in the body.  
4. **One task per prompt.** Close it out (PR up, reviewed) before the next.  
5. **Report back in 3 lines.**

### Template (copy the whole thing)

```
Platform:    Claude Code (paste this code into this platform)
Project:     TradingGYM (engine)
Repo:        jimmuell/mes-orb-strategy
Prompt:      <name>
Local path:  /Users/jameslmueller/Projects/mes-orb-strategy

STEP 0 — gate
  git remote -v && pwd
  Confirm remote is jimmuell/mes-orb-strategy at the path above. If not, STOP and report.
  git checkout main && git pull --ff-only origin main

TASK — <one-line summary>
  <what to change, precisely. Name the files/functions. Give the exact logic.>
  Stage explicit paths only — never git add -A:
    git add <paths>
  Commit subject MUST start with: ADR-0NN:
  Open a PR; do NOT merge.
REPORT BACK (exactly this):
  1. <the key thing to confirm>
  2. <suite / verification result>
  3. <PR link + state>
  Final line, exactly: <Prompt name> — Completed
```

---

## Lovable prompts (app: UI, edge functions, SQL)

Rules:

1. **Header block** (Platform: Lovable). No git gate — Lovable works in its own sandbox.  
2. **Scope tightly.** Name the exact files/functions/components to touch and, just as important, what **not** to touch.  
3. **Call out the deploy trigger** (see `DEPLOY_WORKFLOW.md`):  
   - Edge function edited by the agent → auto-deploys. A VS Code → GitHub push does **not**; that needs an explicit "Redeploy `<function-name>`," verified in the logs.  
   - Migration → not applied by a push; the agent must apply it, verified with a SQL check.  
   - Frontend → visible in Preview on edit; needs **Publish → Update** to go to the live URL.  
4. **SQL:** provide **raw SQL** for any data cleanup or verification (Jim runs it in the SQL editor — cheaper than Lovable Ask mode). **Access-control SQL is never run by the agent or by Claude** — Jim runs it after a joint review.  
5. **State what "done" looks like** and how to verify it (Preview vs Published URL).

### Template (copy the whole thing)

```
Platform:    Lovable Project (paste this code into this platform)
Project:     TradingGYM Web
Repo:        jimmuell/tradinggym
Prompt:      <name>
Local path:  /Users/jameslmueller/Projects/tradinggym

TASK — <one-line summary>
  <what to build/change. Name exact files/functions/components.>
  DO NOT touch: <anything adjacent that must stay put>
  DEPLOY / PUBLISH:
    <e.g. edits edge function `run-backtest` — auto-deploys; then Publish → Update.
     OR frontend only — after the edit, Publish → Update to push to the live URL.>
REPORT BACK (exactly this):
  1. <what changed; deployed/published: y/n>
  2. <verified on Published URL https://keen-chart-clone.lovable.app — the specific check>
  3. <anything to flag>
  Final line, exactly: <Prompt name> — Completed
```

---

## Deploy & verify order

Standard order for anything spanning schema \+ backend \+ frontend:

**migration → edge function → publish frontend → verify live.**

A GitHub push is **source sync only** for `jimmuell/tradinggym` — it does not apply migrations or deploy edge functions. Those are manual steps. Full detail and the evidence behind this live in `DEPLOY_WORKFLOW.md`.

---

## Reviewing work (Claude Chat)

Before greenlighting a merge, review the **real diff**, not the self-report:

git fetch origin

git fetch origin pull/\<PR\>/head:pr\<PR\>

git diff origin/main pr\<PR\> \--stat          \# net change (two-dot after fetch)

git diff origin/main pr\<PR\> \-- \<path\>       \# per-file

Confirm the diff matches the spec, the changed files are exactly the intended ones (no strays), and the tests actually guard the fix. Approve only then.

---

## Report-back format

Three lines, every time: **what / why / next.** Plain language — no jargon that isn't explained in the same breath.

**Completion marker.** After the three lines, close with a single final line, exactly:

```
<Prompt name> — Completed
```

e.g. `Prompt C — Completed`, where the name matches the `Prompt:` header line. If the work is only partial, write `<Prompt name> — Partial: <what's left>` instead — never a bare "Completed." One done-signal per prompt keeps multi-agent handoffs scannable and auditable: Jim (and Claude Chat on review) can confirm at a glance which prompts have landed.  
