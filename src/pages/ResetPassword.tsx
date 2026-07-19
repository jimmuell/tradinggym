import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

type Mode = 'loading' | 'recovery' | 'change' | 'error';

const MIN_PW = 8;
const REAUTH_CAP = 3;
const REAUTH_KEY = (uid: string) => `pw_reauth_attempts:${uid}`;

// Parse token / error from both the ?query and the #hash of the current URL.
function readAuthParams() {
  const out: Record<string, string> = {};
  try {
    const q = new URLSearchParams(window.location.search);
    q.forEach((v, k) => { out[k] = v; });
  } catch { /* ignore */ }
  try {
    const raw = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
    const h = new URLSearchParams(raw);
    h.forEach((v, k) => { if (!out[k]) out[k] = v; });
  } catch { /* ignore */ }
  return out;
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const [mode, setMode] = useState<Mode>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [accountEmail, setAccountEmail] = useState<string>('');

  // Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Guard against React 18 StrictMode double-invoke consuming the token twice.
  const bootedRef = useRef(false);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    (async () => {
      const params = readAuthParams();

      // 1. URL error takes precedence (Supabase returns errors on hash for
      //    already-consumed / expired recovery links via the /verify redirect).
      if (params.error || params.error_description || params.error_code) {
        setErrorMessage(
          decodeURIComponent(params.error_description || params.error || 'This reset link is invalid or has expired.').replace(/\+/g, ' ')
        );
        setMode('error');
        return;
      }

      const tokenHash = params.token_hash;
      const type = params.type;

      if (tokenHash && type === 'recovery') {
        // Capture BOTH tokens so a restore is functionally complete.
        const prev = await supabase.auth.getSession();
        const prevPair = prev.data.session
          ? {
              access_token: prev.data.session.access_token,
              refresh_token: prev.data.session.refresh_token,
            }
          : null;

        const { data, error } = await supabase.auth.verifyOtp({
          type: 'recovery',
          token_hash: tokenHash,
        });

        if (error || !data.session) {
          // Bad / consumed / expired token. Restore the previous session if
          // verifyOtp mutated it.
          if (prevPair) {
            const restore = await supabase.auth.setSession(prevPair);
            if (restore.error) {
              setErrorMessage(
                "Your reset link is invalid or already used, and we couldn't restore your previous sign-in. Please sign in again."
              );
              setMode('error');
              return;
            }
          }
          setErrorMessage(error?.message || 'This reset link is invalid or has expired.');
          setMode('error');
          return;
        }

        // Token valid — verifyOtp has swapped local session to the recovery user.
        // Correction 1 ships the "no extra signOut" branch by default; the
        // cross-browser probe (report item 17) decides whether to add
        // `signOut({ scope: 'local' })` explicitly. Never global here.
        setAccountEmail(data.session.user.email ?? '');
        setMode('recovery');
        return;
      }

      // 2. No token — fall through to in-session change.
      const cur = await supabase.auth.getSession();
      if (cur.data.session) {
        setAccountEmail(cur.data.session.user.email ?? '');
        // Load persisted attempt cap.
        try {
          const raw = sessionStorage.getItem(REAUTH_KEY(cur.data.session.user.id));
          if (raw) setAttempts(Math.min(REAUTH_CAP, parseInt(raw, 10) || 0));
        } catch { /* ignore */ }
        setMode('change');
        return;
      }

      // 3. No token, no session.
      setErrorMessage('This password reset link is missing or invalid.');
      setMode('error');
    })().catch((e) => {
      setErrorMessage(e instanceof Error ? e.message : 'Something went wrong loading this page.');
      setMode('error');
    });
  }, []);

  const canSubmitNew = useMemo(
    () => password.length >= MIN_PW && password === confirm && !submitting,
    [password, confirm, submitting]
  );

  const bumpAttempts = async () => {
    const next = attempts + 1;
    setAttempts(next);
    try {
      const s = await supabase.auth.getSession();
      const uid = s.data.session?.user.id;
      if (uid) sessionStorage.setItem(REAUTH_KEY(uid), String(next));
    } catch { /* ignore */ }
  };

  const clearAttempts = async () => {
    try {
      const s = await supabase.auth.getSession();
      const uid = s.data.session?.user.id;
      if (uid) sessionStorage.removeItem(REAUTH_KEY(uid));
    } catch { /* ignore */ }
    setAttempts(0);
  };

  const friendlyPasswordError = (msg: string): string => {
    const m = msg.toLowerCase();
    if (m.includes('different from the old password') || m.includes('same_password')) {
      return 'Your new password must be different from your current password.';
    }
    if (m.includes('rate limit') || m.includes('too many')) {
      return 'Too many attempts, please wait a minute and try again.';
    }
    return msg;
  };

  const handleRecoverySubmit = async () => {
    if (!canSubmitNew) {
      if (password.length < MIN_PW) toast.error(`Password must be at least ${MIN_PW} characters`);
      else if (password !== confirm) toast.error('Passwords do not match');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setSubmitting(false);
      toast.error(friendlyPasswordError(error.message));
      return;
    }
    // Owner-driven end of all sessions. Global scope.
    try { await signOut(); } catch { /* signOut already toasts on failure */ }
    setSubmitting(false);
    toast.success('Password updated — please sign in.');
    navigate('/auth', { replace: true });
  };

  const handleChangeSubmit = async () => {
    if (attempts >= REAUTH_CAP) return; // UI already blocks
    if (!currentPassword) {
      toast.error('Enter your current password');
      return;
    }
    if (!canSubmitNew) {
      if (password.length < MIN_PW) toast.error(`Password must be at least ${MIN_PW} characters`);
      else if (password !== confirm) toast.error('Passwords do not match');
      return;
    }
    setSubmitting(true);

    // Re-authenticate. Note: signInWithPassword replaces the session on success
    // (same user) — that's fine. On failure the SDK leaves the current session
    // in place; probe evidence recorded in report item 13.
    const reauth = await supabase.auth.signInWithPassword({
      email: accountEmail,
      password: currentPassword,
    });
    if (reauth.error) {
      const raw = (reauth.error.message || '').toLowerCase();
      if (raw.includes('rate limit') || raw.includes('too many') || (reauth.error as { status?: number }).status === 429) {
        setSubmitting(false);
        toast.error("Too many incorrect attempts. Use 'Forgot password?' to reset by email instead.");
        // Force cap so the UI locks even before a fourth click.
        setAttempts(REAUTH_CAP);
        try {
          const s = await supabase.auth.getSession();
          const uid = s.data.session?.user.id;
          if (uid) sessionStorage.setItem(REAUTH_KEY(uid), String(REAUTH_CAP));
        } catch { /* ignore */ }
        return;
      }
      await bumpAttempts();
      setSubmitting(false);
      toast.error('Current password is incorrect.');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setSubmitting(false);
      toast.error(friendlyPasswordError(error.message));
      return;
    }
    await clearAttempts();
    // ADD 2: end every other session belonging to this account.
    try { await signOut(); } catch { /* signOut already toasts on failure */ }
    setSubmitting(false);
    toast.success("Password updated. You've been signed out everywhere — please sign in again.");
    navigate('/auth', { replace: true });
  };

  const capped = attempts >= REAUTH_CAP;

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#131722]">
      <div className="w-full max-w-md px-4">
        <h1 className="text-3xl font-bold text-white text-center mb-8">
          {mode === 'change' ? 'Change your TradingGYM password' : 'Reset your TradingGYM password'}
        </h1>

        {mode === 'loading' && (
          <Card className="bg-[#1e222d] border-[#2a2e39]">
            <CardHeader>
              <CardTitle className="text-white">Just a moment</CardTitle>
              <CardDescription className="text-gray-400">Validating your reset link…</CardDescription>
            </CardHeader>
          </Card>
        )}

        {mode === 'error' && (
          <Card className="bg-[#1e222d] border-[#2a2e39]">
            <CardHeader>
              <CardTitle className="text-white">This link can't be used</CardTitle>
              <CardDescription className="text-gray-400">{errorMessage}</CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col gap-2">
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <Link to="/auth">Request a new reset link</Link>
              </Button>
            </CardFooter>
          </Card>
        )}

        {(mode === 'recovery' || mode === 'change') && (
          <Card className="bg-[#1e222d] border-[#2a2e39]">
            <CardHeader>
              <CardTitle className="text-white">
                {mode === 'recovery' ? 'Set a new password' : 'Change your password'}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {accountEmail ? <>for <span className="text-gray-200">{accountEmail}</span></> : 'for your account'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mode === 'change' && (
                <div className="space-y-2">
                  <Label className="text-gray-300">Current password</Label>
                  <div className="relative">
                    <Input
                      type={showCurrent ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={submitting || capped}
                      className="bg-[#2a2e39] border-[#363a45] text-white placeholder:text-gray-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      aria-label={showCurrent ? 'Hide password' : 'Show password'}
                    >
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {attempts > 0 && !capped && (
                    <p className="text-xs text-yellow-500">
                      {REAUTH_CAP - attempts} attempt{REAUTH_CAP - attempts === 1 ? '' : 's'} left before this form locks.
                    </p>
                  )}
                  {capped && (
                    <p className="text-xs text-red-400">
                      Too many incorrect attempts.{' '}
                      <Link to="/auth" className="underline text-blue-400 hover:text-blue-300">
                        Use "Forgot password?" to reset by email instead.
                      </Link>
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-gray-300">New password</Label>
                <div className="relative">
                  <Input
                    type={showNew ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting || capped}
                    className="bg-[#2a2e39] border-[#363a45] text-white placeholder:text-gray-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    aria-label={showNew ? 'Hide password' : 'Show password'}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Confirm new password</Label>
                <div className="relative">
                  <Input
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    disabled={submitting || capped}
                    className="bg-[#2a2e39] border-[#363a45] text-white placeholder:text-gray-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={mode === 'recovery' ? handleRecoverySubmit : handleChangeSubmit}
                disabled={submitting || capped || !canSubmitNew || (mode === 'change' && !currentPassword)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {submitting
                  ? 'Updating…'
                  : mode === 'recovery'
                    ? 'Set new password'
                    : 'Change password'}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
