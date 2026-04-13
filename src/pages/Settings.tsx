import { Moon, Bell, Monitor, Lock, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Settings() {
  return (
    <div className="min-h-screen bg-[#131722] p-6 md:p-10">
      <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

      <div className="grid gap-6 max-w-2xl">
        {/* Appearance */}
        <Card className="bg-[#1e222d] border-[#2a2e39]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Monitor className="h-5 w-5" /> Appearance
            </CardTitle>
            <CardDescription className="text-gray-400">
              Customize how TradingGym looks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="h-4 w-4 text-gray-400" />
                <Label className="text-gray-300">Dark Mode</Label>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="bg-[#2a2e39]" />
            <div className="flex items-center justify-between">
              <Label className="text-gray-300">Chart Theme</Label>
              <Select defaultValue="dark">
                <SelectTrigger className="w-[140px] bg-[#131722] border-[#2a2e39] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
                  <SelectItem value="dark" className="text-white">Dark</SelectItem>
                  <SelectItem value="light" className="text-white">Light</SelectItem>
                  <SelectItem value="trading" className="text-white">TradingView</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-[#1e222d] border-[#2a2e39]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bell className="h-5 w-5" /> Notifications
            </CardTitle>
            <CardDescription className="text-gray-400">
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
                  <p className="text-sm text-white">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <Switch />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="bg-[#1e222d] border-[#2a2e39]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Lock className="h-5 w-5" /> Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="border-[#2a2e39] text-gray-300 hover:text-white hover:bg-[#2a2e39]">
              Change Password
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-[#1e222d] border-red-900/50">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400 mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
