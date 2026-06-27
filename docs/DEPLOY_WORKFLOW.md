# Deploy Workflow

How code changes reach production for this project, by surface. This doc records
**confirmed** behavior only — earlier speculation has been removed.

## Confirmed deploy / apply triggers

Only these are known to deploy code or apply migrations:

1. **The Lovable agent edits a file in the sandbox.** Edge-function changes auto-deploy; migration files written through the agent are applied after approval.
2. **The agent explicitly calls `supabase--deploy_edge_functions` (for functions) or `supabase--migration` (for schema changes).**

Everything else — including a VS Code → GitHub push — must be treated as **source sync only**, not a deploy.

## Edge functions (`supabase/functions/**`) — manual redeploy MANDATORY

**Verdict:** A VS Code → GitHub push does **NOT** auto-deploy the function.

**Evidence (2026-06-27):** A `console.log("DEPLOY_PROBE_20260627")` line was placed
as the first statement in `run-backtest`'s `serve` handler and pushed to `main`.
The string never appeared in the edge function logs across multiple invocations
until the agent ran `supabase--deploy_edge_functions`. The function kept running
the previously deployed code.

**Rule:** After any push that touches `supabase/functions/**`, ask the agent:
**"Redeploy `<function-name>`."** Then verify by tailing the function logs for a
known marker from the new code.

## Database migrations (`supabase/migrations/**`) — manual apply MANDATORY

**Verdict:** A VS Code → GitHub push does **NOT** auto-apply the migration.

**Evidence (2026-06-27):** `20260627160000_backtest_runs_signal_hash.sql` was
merged to `main`, but `backtest_runs.signal_hash` did not exist in the live
database until the migration was applied manually through the agent.

**Rule:** After any push that touches `supabase/migrations/**`, ask the agent
to apply it. Verify by querying the live schema (e.g., `information_schema.columns`
or `supabase_migrations.schema_migrations`).

## Frontend (`src/**`, `index.html`, styles, etc.)

- **Lovable agent edits** — visible in the preview immediately. Click **Update** in the Publish dialog to push to the public URL.
- **VS Code → GitHub push** — syncs into the project. Still requires **Update** in the Publish dialog to go live.

## Two deploys close together?

If you see two edge-function deploys land back-to-back, one of them is the
agent's explicit `supabase--deploy_edge_functions` call. The second's cause is
**unconfirmed** — but both deploy the same source, so it is harmless.

## Quick reference

- Pushed an edge-function change from VS Code? → Ask: **"Redeploy `<function-name>`."** Verify via logs.
- Pushed a migration from VS Code? → Ask the agent to apply it. Verify via a SQL check.
- Pushed a frontend change from VS Code? → Click **Update** in the Publish dialog.
- Edited anything through the Lovable agent? → Backend is live; click **Update** for frontend.
