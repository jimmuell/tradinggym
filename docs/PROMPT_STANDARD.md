# Prompt Standard

One canonical shape for every prompt that leaves Claude Chat for **Claude Code** or the **Lovable agent**. Copy the matching template from this file, fill it in, hand it to Jim. If a prompt doesn't follow this, it's off-standard — don't send it.

Companion doc: **`DEPLOY_WORKFLOW.md`** (how a change actually reaches production).

---

## Who does what

- **Claude Chat** — head engineer / PM. Writes every spec and every build prompt, reviews all work against the spec before Jim merges. Does not run access-control SQL.  
- **Claude Code** — the **engine** repo only (`jimmuell/mes-orb-strategy`).  
- **Lovable agent** — the **app**: UI, edge functions, and SQL (`jimmuell/tradinggym`).  
- **Jim** — decides, approves, merges, and runs all live/manual steps (Railway, publish, applying migrations, access-control SQL).

**Cost routing:** prefer Claude Code when a task *can* be done there (more credits than Lovable). Never leave Claude Code **and** Lovable both holding pending changes on the same repo at once — pick one owner per change.

---

## Required header block — every prompt

Every prompt opens with these four lines:

Platform:    Lovable | Claude Code | VS Code

Project:     TradingGYM Web | TradingGYM Live | TradingGYM (engine)

Repo:        jimmuell/tradinggym | jimmuell/trading-gym-live | jimmuell/mes-orb-strategy

Local path:  \<repo path\>        \# Claude Code / VS Code only; omit for Lovable-agent prompts

Known local paths:

- engine → `/Users/jameslmueller/Projects/mes-orb-strategy`  
- live → `~/Projects/trading-gym-live`

---

## Claude Code prompts (engine)

Rules, in order:

1. **STEP 0 — repo-confirmation gate.** Always first. Nothing is read, edited, run, or committed until the remote and path are confirmed.  
2. **Stage explicit paths only. Never `git add -A`.** (This is what swept a stray file into ADR-038. `git add -A` grabs anything sitting in the working tree.)  
3. **Commit subject leads with the ADR:** `ADR-0NN: <short imperative summary>`. Put the conventional-commit type/detail in the body.  
4. **One task per prompt.** Close it out (PR up, reviewed) before the next.  
5. **Report back in 3 lines.**

### Copy-paste template

Platform:    Claude Code

Project:     TradingGYM (engine)

Repo:        jimmuell/mes-orb-strategy

Local path:  /Users/jameslmueller/Projects/mes-orb-strategy

────────────────────────────────────────────────────────

STEP 0 — repo-confirmation gate (before anything else)

────────────────────────────────────────────────────────

git remote \-v

pwd

Confirm remote \= jimmuell/mes-orb-strategy AND path \= /Users/jameslmueller/Projects/mes-orb-strategy.

If either does not match, STOP and report — do not read, edit, run, or commit anything.

────────────────────────────────────────────────────────

TASK — \<one-line summary\>

────────────────────────────────────────────────────────

\<what to change, precisely. Name the files/functions. Paste target code where it helps.\>

Stage explicit paths only. Do NOT use \`git add \-A\`.

\<the git add \<paths\> / commit / push steps\>

Commit subject must start with: ADR-0NN:

────────────────────────────────────────────────────────

REPORT BACK (3 lines)

────────────────────────────────────────────────────────

1\. \<the key thing to confirm\>

2\. \<suite / verification result\>

3\. \<PR link \+ state\>

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

### Copy-paste template

Platform:    Lovable

Project:     TradingGYM Web

Repo:        jimmuell/tradinggym

────────────────────────────────────────────────────────

TASK — \<one-line summary\>

────────────────────────────────────────────────────────

\<what to build/change. Name exact files/functions/components.\>

DO NOT touch: \<anything adjacent that must stay put\>

DEPLOY / PUBLISH:

\<e.g. "This edits edge function \`run-backtest\` — after the edit, redeploy it and confirm

in the logs." OR "Frontend only — after the edit, Publish → Update to push to the live URL."\>

────────────────────────────────────────────────────────

VERIFY (how we know it worked)

────────────────────────────────────────────────────────

\- Preview URL:   https://preview--keen-chart-clone.lovable.app   (unpublished draft)

\- Published URL: https://keen-chart-clone.lovable.app            (live, after Publish → Update)

\- \<the specific thing to check on the right URL\>

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
