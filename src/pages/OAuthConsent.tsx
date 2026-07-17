import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

type AuthorizationDetails = {
  client?: { name?: string; client_uri?: string; redirect_uris?: string[] } | null;
  scope?: string | null;
  redirect_url?: string | null;
  redirect_to?: string | null;
};

// Minimal typed wrapper — the beta `auth.oauth` namespace isn't in the .d.ts.
type OAuthApi = {
  getAuthorizationDetails: (
    id: string,
  ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (
    id: string,
  ) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
  denyAuthorization: (
    id: string,
  ) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
};

function oauthApi(): OAuthApi {
  return (supabase.auth as unknown as { oauth: OAuthApi }).oauth;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      setEmail(sess.session.user.email ?? null);
      const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const api = oauthApi();
    const { data, error } = approve
      ? await api.approveAuthorization(authorizationId)
      : await api.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0e13] p-6">
        <Card className="max-w-md w-full bg-[#1e222d] border-[#2a2e39] text-white">
          <CardHeader>
            <CardTitle>Authorization error</CardTitle>
            <CardDescription className="text-gray-400">
              We couldn't load this authorization request.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-gray-300">{error}</CardContent>
        </Card>
      </main>
    );
  }

  if (!details) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0e13]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </main>
    );
  }

  const clientName = details.client?.name ?? "An app";
  const scopes = (details.scope ?? "").split(/\s+/).filter(Boolean);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b0e13] p-6">
      <Card className="max-w-md w-full bg-[#1e222d] border-[#2a2e39] text-white">
        <CardHeader>
          <CardTitle>Connect {clientName} to TradingGYM</CardTitle>
          <CardDescription className="text-gray-400">
            {clientName} will be able to call TradingGYM's enabled tools while you are signed in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {email && (
            <div className="text-gray-300">
              Signed in as <span className="font-medium text-white">{email}</span>
            </div>
          )}
          <div className="text-gray-300">
            <div className="font-medium text-white mb-1">This connection will let it:</div>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>Read your basic profile</li>
              <li>Call TradingGYM tools that act as you (subject to your account's permissions)</li>
            </ul>
          </div>
          {scopes.length > 0 && (
            <div className="text-xs text-gray-500">Requested scopes: {scopes.join(", ")}</div>
          )}
          <div className="text-xs text-gray-500">
            This does not bypass TradingGYM's permissions or backend policies.
          </div>
        </CardContent>
        <CardFooter className="flex gap-2 justify-end">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => decide(false)}
            className="border-[#363a45] text-gray-300 hover:bg-[#2a2e39] hover:text-white"
          >
            Cancel connection
          </Button>
          <Button
            disabled={busy}
            onClick={() => decide(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {busy ? "Working…" : "Approve"}
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
