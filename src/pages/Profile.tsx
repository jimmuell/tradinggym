import { UserCircle, Mail, Calendar, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#131722] p-6 md:p-10">
      <h1 className="text-3xl font-bold text-white mb-8">Profile</h1>

      <div className="grid gap-6 max-w-2xl">
        {/* Avatar & Info */}
        <Card className="bg-[#1e222d] border-[#2a2e39]">
          <CardHeader>
            <CardTitle className="text-white">Account Information</CardTitle>
            <CardDescription className="text-gray-400">
              Manage your personal details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-[#2a2e39] flex items-center justify-center">
                <UserCircle className="h-10 w-10 text-gray-400" />
              </div>
              <div>
                <p className="text-white font-medium">{user?.email ?? 'trader@example.com'}</p>
                <p className="text-sm text-gray-500">Free Plan</p>
              </div>
            </div>

            <Separator className="bg-[#2a2e39]" />

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="displayName" className="text-gray-300">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="Enter your display name"
                  className="bg-[#131722] border-[#2a2e39] text-white placeholder:text-gray-600"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  value={user?.email ?? ''}
                  disabled
                  className="bg-[#131722] border-[#2a2e39] text-gray-400"
                />
              </div>
            </div>

            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="bg-[#1e222d] border-[#2a2e39]">
          <CardHeader>
            <CardTitle className="text-white">Trading Stats</CardTitle>
            <CardDescription className="text-gray-400">
              Your practice trading overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Total Trades', value: '0' },
                { label: 'Win Rate', value: '—' },
                { label: 'Avg P&L', value: '—' },
                { label: 'Best Trade', value: '—' },
                { label: 'Worst Trade', value: '—' },
                { label: 'Sessions', value: '0' },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#131722] rounded-lg p-3 border border-[#2a2e39]">
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className="text-lg font-semibold text-white mt-1">{stat.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card className="bg-[#1e222d] border-[#2a2e39]">
          <CardHeader>
            <CardTitle className="text-white">Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-gray-400">
              <Mail className="h-4 w-4" />
              <span className="text-sm">{user?.email ?? 'Not set'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <Shield className="h-4 w-4" />
              <span className="text-sm">Email authentication</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
