import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoamiTool from "./tools/whoami";
import listStrategiesTool from "./tools/list-strategies";
import listBacktestRunsTool from "./tools/list-backtest-runs";

// Build the OAuth issuer from the project ref (inlined at build time).
// Never derive it from SUPABASE_URL — that may be a proxy host that fails
// RFC 8414 §3.3 issuer matching against the discovery document.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "tradinggym-mcp",
  title: "TradingGYM",
  version: "0.1.0",
  instructions:
    "Tools for a TradingGYM user. Use `whoami` to verify the connection, `list_strategies` to read the user's trading strategies, and `list_backtest_runs` to read their most recent backtest results with summary KPIs.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoamiTool, listStrategiesTool, listBacktestRunsTool],
});
