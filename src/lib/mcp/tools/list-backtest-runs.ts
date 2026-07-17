import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function clientFor(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_backtest_runs",
  title: "List backtest runs",
  description:
    "List the signed-in user's most recent backtest runs with summary KPIs (net PnL, win rate, drawdown, trades).",
  inputSchema: {
    limit: z.number().int().min(1).max(50).default(10).describe("Max runs to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await clientFor(ctx)
      .from("backtest_runs")
      .select(
        "id, created_at, start_date, end_date, net_pnl, win_rate, max_drawdown, total_trades, profit_factor, engine_version",
      )
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { runs: data ?? [] },
    };
  },
});
