import { useState, useEffect, useRef } from 'react';
import { UserCircle, Mail, Calendar, Shield, Upload, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useTier } from '@/contexts/TierContext';
import { getTierDisplayName } from '@/lib/tierUtils';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export default function Profile() {
  const { user } = useAuth();
  const { currentTier } = useTier();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Initialize displayName from fetched profile — only when null (not yet set or after reset)
  useEffect(() => {
    if (profile !== undefined && displayName === null) {
      setDisplayName(profile?.display_name ?? '');
    }
  }, [profile, displayName]);

  const mutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.rpc('update_own_profile', {
        p_display_name: name,
      });
      if (error) throw error;
      return name;
    },
    onSuccess: (savedName) => {
      setDisplayName(savedName);
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast.success('Profile saved');
    },
    onError: () => {
      toast.error('Failed to save profile — please try again');
    },
  });

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('Not authenticated');
      if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
        throw new Error('Please choose a PNG, JPEG, WEBP, or GIF image');
      }
      if (file.size > MAX_AVATAR_BYTES) {
        throw new Error('Image must be 2MB or smaller');
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { cacheControl: '3600', upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = publicUrlData.publicUrl;

      const { error: rpcError } = await supabase.rpc('update_own_profile', {
        p_avatar_url: publicUrl,
      });
      if (rpcError) throw rpcError;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast.success('Avatar updated');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to upload avatar');
    },
  });

  const handleAvatarFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input so picking the same file again still triggers change
    e.target.value = '';
    if (file) avatarMutation.mutate(file);
  };

  const currentValue = displayName ?? '';
  const hasChanged = displayName !== null && currentValue !== (profile?.display_name ?? '');
  const avatarUrl = profile?.avatar_url ?? null;

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <h1 className="text-3xl font-bold text-foreground mb-8">Profile</h1>

      <div className="grid gap-6 max-w-2xl">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Account Information</CardTitle>
            <CardDescription className="text-muted-foreground">
              Manage your personal details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserCircle className="h-10 w-10 text-muted-foreground" />
                )}
                {avatarMutation.isPending && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-foreground font-medium">{user?.email ?? 'trader@example.com'}</p>
                <p className="text-sm text-muted-foreground">Starter Plan</p>
                <div className="mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleAvatarFileSelected}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarMutation.isPending || !user}
                    className="border-border text-foreground hover:bg-accent"
                  >
                    <Upload className="h-3.5 w-3.5 mr-2" />
                    {avatarMutation.isPending ? 'Uploading…' : avatarUrl ? 'Change avatar' : 'Upload avatar'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPEG, WEBP or GIF · max 2MB</p>
                </div>
              </div>
            </div>

            <Separator className="bg-border" />

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="displayName" className="text-foreground">Display Name</Label>
                {isLoading || displayName === null ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Input
                    id="displayName"
                    placeholder="Enter your display name"
                    value={currentValue}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                  />
                )}
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

            <Button
              onClick={() => mutation.mutate(currentValue)}
              disabled={mutation.isPending || isLoading || !hasChanged}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {mutation.isPending ? 'Saving…' : 'Save Changes'}
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
