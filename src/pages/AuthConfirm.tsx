import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type Status = "verifying" | "error";

/**
 * /auth/confirm — handles token_hash links from auth-email-hook for:
 *   signup, invite, magiclink, email_change
 * (recovery uses /reset-password directly.)
 */
export default function AuthConfirm() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("verifying");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const tokenHash = params.get("token_hash");
  const type = (params.get("type") || "").toLowerCase();
  const next = params.get("next") || "";

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!tokenHash || !type) {
        setErrorMsg("This confirmation link is missing required information. Please request a new email.");
        setStatus("error");
        return;
      }

      const otpType = type as
        | "signup"
        | "invite"
        | "magiclink"
        | "email"
        | "email_change"
        | "recovery";

      // Supabase verifyOtp uses "email" for email_change confirmations
      const verifyType = otpType === "email_change" ? "email" : otpType;

      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: verifyType as any,
      });

      if (cancelled) return;

      if (error) {
        setErrorMsg(error.message || "We could not verify this link. It may have expired or already been used.");
        setStatus("error");
        return;
      }

      // Success — route by type
      if (type === "recovery") {
        navigate("/reset-password", { replace: true });
        return;
      }

      if (type === "email_change" || type === "email") {
        toast.success("Email address updated");
        navigate("/settings", { replace: true });
        return;
      }

      // signup / invite / magiclink
      const dest = next && next.startsWith("/") ? next : "/dashboard";
      if (type === "signup" || type === "invite") {
        toast.success("Email confirmed — welcome!");
      }
      navigate(dest, { replace: true });
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [tokenHash, type, next, navigate]);

  if (status === "verifying") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Confirming your link…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Link couldn't be verified</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{errorMsg}</p>
          <div className="flex gap-2">
            <Button asChild variant="default">
              <Link to="/auth">Back to sign in</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
