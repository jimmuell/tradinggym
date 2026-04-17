import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Lock, Check } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { TierState } from '@/contexts/TierContext';
import { toast } from 'sonner';

import { getTierDisplayName } from '@/lib/tierUtils';

const TIERS: { key: TierState; path: string }[] = [
  { key: 'foundation', path: '/learning/foundation' },
  { key: 'tier1', path: '/learning/tier1' },
  { key: 'tier2', path: '/learning/tier2' },
  { key: 'tier3', path: '/learning/tier3' },
];

const TIER_ORDER: TierState[] = ['foundation', 'tier1', 'tier2', 'tier3', 'coach'];

function tierIndex(t: TierState) {
  return TIER_ORDER.indexOf(t);
}

export default function TierProgressCard({ currentTier }: { currentTier: TierState }) {
  const navigate = useNavigate();
  const currentIdx = tierIndex(currentTier);

  const currentTierData = TIERS.find(t => t.key === currentTier) || TIERS[0];

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Tier Progress</CardTitle>
        <Link to="/learning/foundation" className="text-xs text-primary hover:underline">
          View Learning Path →
        </Link>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          {TIERS.map((tier, i) => {
            const idx = tierIndex(tier.key);
            const isCompleted = idx < currentIdx;
            const isCurrent = tier.key === currentTier || (currentTier === 'coach' && idx <= 3);
            const isLocked = !isCompleted && !isCurrent;

            return (
              <div key={tier.key} className="flex items-center gap-2">
                <Badge
                  className={`cursor-pointer select-none ${
                    isCompleted
                      ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                      : isCurrent
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                      : 'bg-transparent border-muted-foreground/30 text-muted-foreground'
                  }`}
                  variant={isLocked ? 'outline' : 'default'}
                  onClick={() => {
                    if (isLocked) {
                      const prev = TIERS[idx - 1];
                      toast(`Complete ${prev ? getTierDisplayName(prev.key) : 'previous tier'} to unlock`);
                    } else {
                      navigate(tier.path);
                    }
                  }}
                >
                  {isCompleted && <Check className="h-3 w-3 mr-1" />}
                  {getTierDisplayName(tier.key)}
                  {isLocked && <Lock className="h-3 w-3 ml-1" />}
                </Badge>
                {i < TIERS.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            );
          })}
        </div>
        <Progress value={0} className="mt-4 h-2" />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">
            0% complete — Start your {getTierDisplayName(currentTierData.key)} modules
          </p>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => navigate(currentTierData.path)}
          >
            Continue
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
