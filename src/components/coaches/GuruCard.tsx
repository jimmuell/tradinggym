import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import type { PublicGuru } from '@/hooks/usePublicGurus';

export function GuruCard({ guru }: { guru: PublicGuru }) {
  const initials = (guru.display_name ?? '?').trim().charAt(0).toUpperCase();
  const showFreeMonth = guru.referral_discount_pct === 100 && !!guru.referral_code;

  return (
    <Card className="flex flex-col">
      <CardContent className="p-5 flex flex-col gap-4 flex-1">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 shrink-0">
            {guru.avatar_url && <AvatarImage src={guru.avatar_url} alt={guru.display_name ?? 'Coach'} />}
            <AvatarFallback className="bg-muted text-muted-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base text-foreground truncate">
              {guru.display_name ?? 'Unnamed Coach'}
            </h3>
            {guru.tagline && (
              <p className="text-sm text-muted-foreground truncate mt-0.5">{guru.tagline}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {guru.primary_instrument && (
            <Badge variant="secondary" className="text-xs">{guru.primary_instrument}</Badge>
          )}
          {guru.primary_strategy && (
            <Badge variant="secondary" className="text-xs">{guru.primary_strategy}</Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
          <div>
            <div className="text-xs text-muted-foreground">Win Rate</div>
            <div className="font-semibold text-foreground">
              {guru.win_rate !== null ? `${guru.win_rate}%` : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Students</div>
            <div className="font-semibold text-foreground">{guru.active_students}</div>
          </div>
        </div>

        {showFreeMonth && (
          <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            First month free
          </div>
        )}

        <Button asChild className="mt-auto w-full">
          <Link to={`/coaches/${guru.id}`}>View Profile</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
