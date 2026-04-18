import { useState } from 'react';
import { Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ReferralCodeCardProps {
  referralCode: string | null;
}

export function ReferralCodeCard({ referralCode }: ReferralCodeCardProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'generate-referral-code',
      );
      if (error) throw error;
      if (!data?.referral_code) throw new Error('No referral code returned');
      await qc.invalidateQueries({ queryKey: ['guru_profile', user?.id] });
      toast.success('Referral code generated!');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to generate code';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const referralLink = referralCode
    ? `https://tradinggym.app/join?ref=${referralCode}`
    : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Could not copy link');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Referral Link</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!referralCode && (
          <>
            <p className="text-sm text-muted-foreground">
              Generate your unique referral link to share with students. They get
              their first month free.
            </p>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-amber-500 text-amber-950 hover:bg-amber-400"
            >
              {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate My Referral Code
            </Button>
          </>
        )}

        {referralCode && (
          <>
            <div className="rounded-md bg-muted px-4 py-3 font-mono text-sm tracking-wider">
              {referralCode}
            </div>
            <div className="flex items-center gap-2">
              <Input readOnly value={referralLink} className="font-mono text-xs" />
              <Button
                variant="secondary"
                onClick={handleCopy}
                className="shrink-0"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Students who use your link get their first month free. You earn 50%
              of their subscription from month 2 onwards.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
