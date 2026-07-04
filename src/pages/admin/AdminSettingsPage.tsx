import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft, KeyRound, AlertTriangle, Flag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserRole } from '@/hooks/useUserRole';
import {
  ADMIN_SETTINGS_EVENT,
  getDevSignInPreview,
  getDevSignInProd,
  setDevSignInPreview,
  setDevSignInProd,
  isDevHost,
} from '@/lib/adminSettings';
import { COACH_CHAT_ENABLED } from '@/lib/featureFlags';

export default function AdminSettingsPage() {
  const { isAdmin, isLoading } = useUserRole();
  const [previewOn, setPreviewOn] = useState(getDevSignInPreview());
  const [prodOn, setProdOn] = useState(getDevSignInProd());

  useEffect(() => {
    const sync = () => {
      setPreviewOn(getDevSignInPreview());
      setProdOn(getDevSignInProd());
    };
    window.addEventListener(ADMIN_SETTINGS_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(ADMIN_SETTINGS_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="p-6"><Skeleton className="h-64 w-full" /></div>
    );
  }
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const env = isDevHost() ? 'preview' : 'production';

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="h-3 w-3" /> Back to Admin
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Admin Settings</h1>
        <p className="text-sm text-muted-foreground">
          Platform-wide toggles. Current environment: <span className="font-mono">{env}</span>.
        </p>
      </div>

      {/* Dev Auto Sign-in Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" /> Dev Auto Sign-in Buttons
          </CardTitle>
          <CardDescription>
            Show the quick sign-in buttons (Starter / Pro / Expert / Guru / Admin) on the
            /auth page. Only works for seeded dev accounts. Stored per-browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <Label className="text-sm font-medium">Enabled on preview / localhost</Label>
              <p className="text-xs text-muted-foreground">
                localhost, *.lovableproject.com, id-preview--*.lovable.app
              </p>
            </div>
            <Switch
              checked={previewOn}
              onCheckedChange={(v) => { setDevSignInPreview(v); setPreviewOn(v); }}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <Label className="text-sm font-medium">Enabled on published site</Label>
              <p className="text-xs text-muted-foreground">
                Your published *.lovable.app URL and any custom domain.
              </p>
            </div>
            <Switch
              checked={prodOn}
              onCheckedChange={(v) => { setDevSignInProd(v); setProdOn(v); }}
            />
          </div>

          <div className="flex items-start gap-2 rounded-md border border-yellow-600/40 bg-yellow-950/10 p-3 text-xs text-yellow-500">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              This control is temporary and will be removed prior to public launch.
              Toggles are stored in your browser's localStorage.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags (stub) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" /> Feature Flags
          </CardTitle>
          <CardDescription>
            Read-only view of build-time feature flags. Edit in{' '}
            <code className="text-xs">src/lib/featureFlags.ts</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <Label className="text-sm font-medium">Coach Chat</Label>
              <p className="text-xs text-muted-foreground">
                Interactive "Ask the coach" chat on the backtest teach panel.
              </p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-md ${COACH_CHAT_ENABLED ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {COACH_CHAT_ENABLED ? 'On' : 'Off'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance stub */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Mode</CardTitle>
          <CardDescription>Coming soon — put the app into read-only maintenance mode.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Not yet implemented.</p>
        </CardContent>
      </Card>
    </div>
  );
}
