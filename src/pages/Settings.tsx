import { Bell, Monitor, Lock, Trash2, CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings, type AppTheme } from '@/contexts/SettingsContext';
import { useTier } from '@/contexts/TierContext';
import { useCustomerPortal } from '@/hooks/useCustomerPortal';
import { getPlanDisplayName } from '@/lib/tierUtils';

export default function Settings() {
  const { theme, setTheme } = useSettings();
  const { planState } = useTier();
  const portal = useCustomerPortal();

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <h1 className="text-3xl font-bold text-foreground mb-8">Settings</h1>

      <div className="grid gap-6 max-w-2xl">
        {/* Billing & Subscription */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <CreditCard className="h-5 w-5" /> Billing & Subscription
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Manage your plan and payment details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-foreground font-medium">
                Current Plan: {getPlanDisplayName(planState)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {planState === 'starter'
                  ? 'Upgrade to unlock advanced features.'
                  : 'Manage your subscription, payment method, or download invoices.'}
              </p>
            </div>
            <div>
              {planState === 'starter' ? (
                <Button asChild variant="outline" className="border-border text-foreground hover:bg-accent">
                  <Link to="/pricing">View Plans</Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => portal.mutate(`${window.location.origin}/settings`)}
                  disabled={portal.isPending}
                  className="border-border text-foreground hover:bg-accent"
                >
                  {portal.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Opening…
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Manage Subscription
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Monitor className="h-5 w-5" /> Appearance
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Customize how TradingGYM looks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-foreground">Theme</Label>
              <Select value={theme} onValueChange={(v) => setTheme(v as AppTheme)}>
                <SelectTrigger className="w-[140px] bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="dark" className="text-foreground">Dark</SelectItem>
                  <SelectItem value="light" className="text-foreground">Light</SelectItem>
                  <SelectItem value="system" className="text-foreground">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Bell className="h-5 w-5" /> Notifications
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Control what alerts you receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Trade Alerts', desc: 'Get notified on simulated trade results' },
              { label: 'Session Reminders', desc: 'Daily practice reminders' },
              { label: 'Performance Reports', desc: 'Weekly performance summaries' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Lock className="h-5 w-5" /> Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="border-border text-muted-foreground hover:text-foreground hover:bg-accent">
              Change Password
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-card border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button variant="destructive">
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
