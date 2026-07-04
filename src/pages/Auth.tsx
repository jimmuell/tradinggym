import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import LegalModal from '@/components/LegalModal';
import PageSeo from '@/components/seo/PageSeo';
import { shouldShowDevSignIn, ADMIN_SETTINGS_EVENT } from '@/lib/adminSettings';

export default function Auth() {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();
  const [searchParams] = useSearchParams();
  const intendedPlan = searchParams.get('plan');

  useEffect(() => {
    if (session) {
      if (intendedPlan && ['pro', 'expert', 'guru'].includes(intendedPlan)) {
        navigate(`/pricing?highlight=${intendedPlan}`, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [session, navigate, intendedPlan]);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!loginEmail) {
      toast.error('Please enter your email above first');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password reset email sent. Check your inbox.');
    }
  };

  const handleSignup = async () => {
    if (!tosAccepted) {
      toast.error('You must accept the Terms of Service and Privacy Policy');
      return;
    }
    if (!ageConfirmed) {
      toast.error('You must confirm you are at least 18 years old');
      return;
    }
    if (signupPassword !== signupConfirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      await supabase.rpc('accept_terms', {
        p_tos_accepted: true,
        p_age_verified: true,
      });
      toast.success('Account created successfully!');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message || 'Google sign-in failed');
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    setLoading(false);
  };

  const [showDevSignIn, setShowDevSignIn] = useState(shouldShowDevSignIn());
  useEffect(() => {
    const sync = () => setShowDevSignIn(shouldShowDevSignIn());
    window.addEventListener(ADMIN_SETTINGS_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(ADMIN_SETTINGS_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const handleDevLogin = async (email: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: 'password123',
    });
    setLoading(false);
    if (error) toast.error(error.message);
  };

  const DEV_ACCOUNTS: Array<{ label: string; email: string }> = [
    { label: 'Starter', email: 'starter@gmail.com' },
    { label: 'Pro', email: 'pro@gmail.com' },
    { label: 'Expert', email: 'expert@gmail.com' },
    { label: 'Guru', email: 'guru@gmail.com' },
    { label: 'Admin', email: 'admin@gmail.com' },
  ];

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#131722]">
      <PageSeo
        title="Sign in or Sign up — TradingGYM"
        description="Create a free TradingGYM account or log in to access the trading simulator, structured lessons, and Guru-led classes."
        path="/auth"
      />
      <div className="w-full max-w-md px-4">
        <h1 className="text-3xl font-bold text-white text-center mb-8">Sign in to TradingGYM</h1>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#1e222d]">
            <TabsTrigger value="login" className="data-[state=active]:bg-[#2a2e39] data-[state=active]:text-white text-gray-400">
              Log In
            </TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-[#2a2e39] data-[state=active]:text-white text-gray-400">
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="bg-[#1e222d] border-[#2a2e39]">
              <CardHeader>
                <CardTitle className="text-white">Welcome back</CardTitle>
                <CardDescription className="text-gray-400">Enter your credentials to access your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Email</Label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="bg-[#2a2e39] border-[#363a45] text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Password</Label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={loading}
                      className="text-xs text-blue-400 hover:text-blue-300 hover:underline disabled:opacity-50"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      type={showLoginPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="bg-[#2a2e39] border-[#363a45] text-white placeholder:text-gray-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button onClick={handleLogin} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  {loading ? 'Signing in...' : 'Log In'}
                </Button>
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[#363a45]" /></div>
                  <div className="relative flex justify-center text-xs"><span className="bg-[#1e222d] px-2 text-gray-500">or</span></div>
                </div>
                <Button onClick={handleGoogleLogin} disabled={loading} variant="outline" className="w-full border-[#363a45] text-gray-300 hover:bg-[#2a2e39] hover:text-white">
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Continue with Google
                </Button>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to home
                </Link>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card className="bg-[#1e222d] border-[#2a2e39]">
              <CardHeader>
                <CardTitle className="text-white">Create account</CardTitle>
                <CardDescription className="text-gray-400">Get started with TradingGYM</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Email</Label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="bg-[#2a2e39] border-[#363a45] text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Password</Label>
                  <div className="relative">
                    <Input
                      type={showSignupPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="bg-[#2a2e39] border-[#363a45] text-white placeholder:text-gray-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                    >
                      {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      type={showSignupConfirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={signupConfirm}
                      onChange={(e) => setSignupConfirm(e.target.value)}
                      className="bg-[#2a2e39] border-[#363a45] text-white placeholder:text-gray-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupConfirm((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      aria-label={showSignupConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showSignupConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-2 text-xs text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tosAccepted}
                      onChange={(e) => setTosAccepted(e.target.checked)}
                      className="mt-0.5 rounded border-[#363a45] bg-[#2a2e39] text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setLegalModal('terms'); }}
                        className="text-blue-400 underline hover:text-blue-300"
                      >
                        Terms of Service
                      </button>
                      {' '}and{' '}
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setLegalModal('privacy'); }}
                        className="text-blue-400 underline hover:text-blue-300"
                      >
                        Privacy Policy
                      </button>
                    </span>
                  </label>
                  <label className="flex items-start gap-2 text-xs text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ageConfirmed}
                      onChange={(e) => setAgeConfirmed(e.target.checked)}
                      className="mt-0.5 rounded border-[#363a45] bg-[#2a2e39] text-blue-600 focus:ring-blue-500"
                    />
                    <span>I confirm that I am at least 18 years old</span>
                  </label>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button onClick={handleSignup} disabled={loading || !tosAccepted || !ageConfirmed} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  {loading ? 'Creating account...' : 'Sign Up'}
                </Button>
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[#363a45]" /></div>
                  <div className="relative flex justify-center text-xs"><span className="bg-[#1e222d] px-2 text-gray-500">or</span></div>
                </div>
                <Button onClick={handleGoogleLogin} disabled={loading} variant="outline" className="w-full border-[#363a45] text-gray-300 hover:bg-[#2a2e39] hover:text-white">
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Continue with Google
                </Button>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to home
                </Link>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        {showDevSignIn && (
          <div className="mt-6 rounded-md border border-dashed border-yellow-600/50 bg-yellow-950/20 p-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-yellow-500 mb-2">
              DEV ONLY · preview/localhost
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {DEV_ACCOUNTS.map((acct) => (
                <Button
                  key={acct.email}
                  onClick={() => handleDevLogin(acct.email)}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="border-yellow-600/50 bg-yellow-950/30 text-yellow-200 hover:bg-yellow-900/40 hover:text-yellow-100"
                >
                  {acct.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
      <LegalModal
        open={legalModal !== null}
        onOpenChange={(open) => { if (!open) setLegalModal(null); }}
        type={legalModal ?? 'terms'}
      />
    </div>
  );
}
