import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ExternalLink, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import GuruLayout from '@/layouts/GuruLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGuruProfile } from '@/hooks/useGuruData';
import {
  useUpdateGuruPublicProfile,
  useToggleGuruIsPublic,
} from '@/hooks/useGuruPublicProfile';

const INSTRUMENT_OPTIONS = ['MES', 'ES', 'NQ', 'MNQ', 'CL', 'GC'];
const STRATEGY_OPTIONS = ['ORB', 'ORB+VWAP', 'AMD+IFVG', 'Price Action'];

interface GuruProfileExtended {
  id: string;
  status: string;
  tagline?: string | null;
  bio?: string | null;
  primary_instrument?: string | null;
  primary_strategy?: string | null;
  is_public?: boolean | null;
}

export default function GuruPublicProfilePage() {
  const { data: profile, isLoading } = useGuruProfile();
  const updateProfile = useUpdateGuruPublicProfile();
  const toggleIsPublic = useToggleGuruIsPublic();

  const ext = profile as unknown as GuruProfileExtended | null;

  const [tagline, setTagline] = useState('');
  const [bio, setBio] = useState('');
  const [instrument, setInstrument] = useState('MES');
  const [strategy, setStrategy] = useState('ORB');
  const hydratedRef = useRef(false);

  // Hydrate form ONCE when profile first loads, to avoid clobbering
  // in-flight user edits when React Query refetches after mutations.
  useEffect(() => {
    if (!ext || hydratedRef.current) return;
    setTagline(ext.tagline ?? '');
    setBio(ext.bio ?? '');
    setInstrument(ext.primary_instrument ?? 'MES');
    setStrategy(ext.primary_strategy ?? 'ORB');
    hydratedRef.current = true;
  }, [ext]);

  const isPublic = ext?.is_public === true;
  const isActive = ext?.status === 'active';

  const handleSave = () => {
    updateProfile.mutate(
      {
        tagline: tagline.trim() || null,
        bio: bio.trim() || null,
        primary_instrument: instrument || null,
        primary_strategy: strategy || null,
      },
      {
        onSuccess: () => toast.success('Profile saved.'),
        onError: () => toast.error('Save failed — try again.'),
      },
    );
  };

  const handleToggle = (next: boolean) => {
    toggleIsPublic.mutate(next, {
      onSuccess: () =>
        toast.success(
          next
            ? "You're now listed in the coaches directory."
            : 'Your profile is now hidden.',
        ),
      onError: () => toast.error('Update failed — try again.'),
    });
  };

  if (isLoading) {
    return (
      <GuruLayout>
        <div className="mx-auto max-w-2xl space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64" />
          <Skeleton className="h-40" />
        </div>
      </GuruLayout>
    );
  }

  if (!ext) {
    return (
      <GuruLayout>
        <div className="mx-auto max-w-2xl text-center text-muted-foreground py-16">
          Guru profile not found.
        </div>
      </GuruLayout>
    );
  }

  const previewHref = `/coaches/${ext.id}`;
  const canPreview = isPublic && isActive;
  const showTaglineWarning = isPublic && tagline.trim().length === 0;

  return (
    <GuruLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Public Profile</h1>
          <p className="text-muted-foreground mt-1">
            How you appear in the public coaches directory.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="One line that describes your teaching style"
                maxLength={140}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell students about your background and approach"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Primary Instrument</Label>
                <Select value={instrument} onValueChange={setInstrument}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTRUMENT_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Primary Strategy</Label>
                <Select value={strategy} onValueChange={setStrategy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STRATEGY_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={updateProfile.isPending}>
                {updateProfile.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Save Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Directory Listing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm text-muted-foreground flex-1">
                When enabled, your profile appears in the /coaches directory.
                Students can find and view your profile.
              </p>
              <Switch
                checked={isPublic}
                disabled={toggleIsPublic.isPending}
                onCheckedChange={handleToggle}
                aria-label="Go public"
              />
            </div>

            {showTaglineWarning && (
              <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-400">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Add a tagline before going public so students know what you
                  teach.
                </span>
              </div>
            )}

            <div>
              {canPreview ? (
                <Link
                  to={previewHref}
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  Preview your public profile
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground cursor-not-allowed">
                        Preview your public profile
                        <ExternalLink className="h-3.5 w-3.5" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      Go public to preview your listing.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </GuruLayout>
  );
}
