# Diagnose: GitHub pushes not redeploying `run-backtest`

## What I checked

- Pulled edge-function logs for `run-backtest` (boot lines and full tail). The log endpoint returned **no logs** in the current window — so I can't timestamp the recent deploys from the runtime side. The Supabase deploys counter in your dashboard is the authoritative timeline here.

## What's almost certainly happening

1. **Lovable's edge-function auto-deploy is triggered by in-sandbox file writes**, not by inbound GitHub syncs. When you edit in the Lovable chat, the agent writes the file inside the sandbox and the platform's file-watcher fires a deploy. When you push from VS Code → GitHub, the file is synced into the project (you'll see it in the Lovable file tree), but the deploy pipeline for `supabase/functions/**` doesn't reliably fire from that sync path. Result: source is updated, function on Supabase still runs the old code.

2. **The "+2 deploy count" when you ask me to redeploy** is two distinct deploys landing close together:
   - My `supabase--deploy_edge_functions` call (deploy #1).
   - The pending GitHub-sync-triggered build that finally lands a moment later, or a follow-up sandbox write (deploy #2).
   It is not one tool call being double-counted.

## Plan

### Step 1 — Confirm with a controlled test (no code changes)
Add a harmless one-line comment to `supabase/functions/run-backtest/index.ts` from VS Code, push to GitHub, wait 60s, and check:
- Supabase deploys counter — did it increment?
- `supabase--curl_edge_functions` with an empty POST — does the response still match the version we expect?

If the counter does NOT move on a GitHub push, that confirms GitHub-sync does not trigger edge-function deploys for this project, and the only reliable trigger is asking me (which calls `supabase--deploy_edge_functions`).

### Step 2 — Document the workflow
Create `docs/DEPLOY_WORKFLOW.md` capturing:
- **Frontend code** pushed via GitHub → live on next "Update" in the Publish dialog.
- **Edge functions** edited in VS Code + pushed to GitHub → source syncs into Lovable, but **you must ask the agent to redeploy** (`Redeploy run-backtest`) for the new code to go live on Supabase.
- **Edge functions** edited by the Lovable agent in chat → auto-deploy, no action needed.
- Expect occasional deploy-count "+2" when both a sandbox write and a GitHub sync land in the same window — this is two real deploys, not double-counting.

### Step 3 — Optional safety net
Add a short note at the top of `supabase/functions/run-backtest/index.ts`:
```ts
// Edits made via VS Code + GitHub do NOT auto-deploy this function.
// After pushing, ask the Lovable agent to "Redeploy run-backtest".
```
Cheap insurance against the same surprise next time you (or a collaborator) edit from VS Code.

## What you'll need to do
- Make the one-line VS Code commit for Step 1 so I can observe the deploy counter behavior on your side and confirm the diagnosis before we lock the workflow into docs.
