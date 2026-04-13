import { Bell, Monitor, Lock, Trash2, Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings, type AppTheme, type ChartTheme } from '@/contexts/SettingsContext';

export default function Settings() {
  const { theme, setTheme, chartTheme, setChartTheme } = useSettings();

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <h1 className="text-3xl font-bold text-foreground mb-8">Settings</h1>

      <div className="grid gap-6 max-w-2xl">
        {/* Appearance */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Monitor className="h-5 w-5" /> Appearance
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Customize how TradingGym looks
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
            <Separator className="bg-border" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <Label className="text-foreground">Chart Theme</Label>
              </div>
              <Select value={chartTheme} onValueChange={(v) => setChartTheme(v as ChartTheme)}>
                <SelectTrigger className="w-[140px] bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="dark" className="text-foreground">Dark</SelectItem>
                  <SelectItem value="light" className="text-foreground">Light</SelectItem>
                  <SelectItem value="trading" className="text-foreground">TradingView</SelectItem>
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
