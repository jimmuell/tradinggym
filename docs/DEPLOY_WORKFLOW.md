# Deploy Workflow

How code changes reach production for this project, by surface.

## Frontend (`src/**`, `index.html`, styles, etc.)

- **Lovable chat edits** — written into the sandbox and shown in the live preview immediately. They go live on the public URL only when you click **Update** in the Publish dialog.
- **VS Code → GitHub push** — syncs into the Lovable project automatically. Still requires **Update** in the Publish dialog to go live.

## Edge functions (`supabase/functions/**`)

The Supabase deploy pipeline runs in response to **in-sandbox file writes**, not inbound GitHub syncs.

| How the function was edited | Auto-deploys to Supabase? | Action required |
| --- | --- | --- |
| Lovable agent edits in chat | ✅ Yes | None |
| You edit in VS Code, push to GitHub | ⚠️ Source syncs into the project, but the function on Supabase keeps running the old code | Ask the Lovable agent: **"Redeploy `<function-name>`"** |
| You ask the agent to redeploy | ✅ Yes (via `supabase--deploy_edge_functions`) | None |

### Why the deploy counter sometimes jumps by 2

When you push from VS Code and then immediately ask the agent to redeploy, you can see **two** deploys land close together:

1. The agent's explicit `supabase--deploy_edge_functions` call.
2. A second deploy triggered by the sandbox finishing the GitHub sync.

These are two real deploys of the same source, not a double-counted single deploy. It is harmless — the second one is a no-op from the function's perspective.

## Database migrations (`supabase/migrations/**`)

- **Lovable chat edits** — migration runs against the project's database immediately.
- **VS Code → GitHub push** — the migration file is synced into the project but is **not** auto-applied. Ask the agent to apply it.

## Quick reference

- Pushed an edge-function change from VS Code? → Ask: **"Redeploy `<function-name>`."**
- Pushed a frontend change from VS Code? → Click **Update** in the Publish dialog.
- Pushed a migration from VS Code? → Ask the agent to apply it.
- Edited anything through Lovable chat? → Nothing extra to do for backend; click **Update** for frontend.
