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
    <div className="min-h-screen bg-background p-6 md:p-10">
      <h1 className="text-3xl font-bold text-foreground mb-8">Profile</h1>

      <div className="grid gap-6 max-w-2xl">
        {/* Avatar & Info */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Account Information</CardTitle>
            <CardDescription className="text-muted-foreground">
              Manage your personal details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
                <UserCircle className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <p className="text-foreground font-medium">{user?.email ?? 'trader@example.com'}</p>
                <p className="text-sm text-muted-foreground">Free Plan</p>
              </div>
            </div>

            <Separator className="bg-border" />

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="displayName" className="text-foreground">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="Enter your display name"
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  value={user?.email ?? ''}
                  disabled
                  className="bg-background border-border text-muted-foreground"
                />
              </div>
            </div>

            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Trading Stats</CardTitle>
            <CardDescription className="text-muted-foreground">
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
                <div key={stat.label} className="bg-background rounded-lg p-3 border border-border">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-semibold text-foreground mt-1">{stat.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span className="text-sm">{user?.email ?? 'Not set'}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span className="text-sm">Email authentication</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
