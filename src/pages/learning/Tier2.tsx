import { useTier } from '@/contexts/TierContext';
import TierLockedState from '@/components/learning/TierLockedState';
import TierModuleGrid, { ModuleConfig, GateConfig } from '@/components/learning/TierModuleGrid';
import GraduationGateCard from '@/components/learning/GraduationGateCard';
import { BookOpen, Filter, Play, GraduationCap } from 'lucide-react';

const MODULES: ModuleConfig[] = [
  {
    id: 'T2-1', title: 'What is VWAP?',
    description: 'The institutional reference price and why it matters for futures traders.',
    icon: BookOpen, unlocked: true, lockHint: '',
    path: '/learning/tier2/t2-1',
  },
  {
    id: 'T2-2', title: 'VWAP as a Filter',
    description: 'Only long above VWAP. Only short below. Sit on hands when context is wrong.',
    icon: Filter, unlocked: false, lockHint: 'Complete T2-1 to unlock',
    path: '/learning/tier2/t2-2',
  },
  {
    id: 'T2-3', title: 'Filtered ORB Sessions',
    description: 'Apply the VWAP filter in the simulator across 20 sessions.',
    icon: Play, unlocked: false, lockHint: 'Complete T2-2 to unlock',
    path: '/learning/tier2/t2-3',
  },
];

const GATE: GateConfig = {
  title: 'Tier 2 Graduation Gate',
  description: '20 sessions with 55%+ win rate to advance.',
  icon: GraduationCap,
  buttonText: 'View Progress',
};

export default function Tier2Learning() {
  const { isUnlocked } = useTier();

  if (!isUnlocked('tier2')) {
    return (
      <TierLockedState
        previousLevel="Tier 1"
        previousPath="/learning/tier1"
        subtext="Pass the Tier 1 graduation gate first."
      />
    );
  }

  return (
    <TierModuleGrid
      heading="Tier 2 — Confirmation Tools"
      subtitle="Add VWAP as a filter. Only trade in the direction of the market."
      modules={MODULES}
      gate={GATE}
      gateContent={
        <GraduationGateCard
          fromTier="tier2"
          targetTier="tier3"
          requiredTrades={20}
          requiredWinRate={55}
          title="Tier 2 Graduation Gate"
          completionLabel="Tier 2 Complete — you've advanced to Tier 3."
          buttonLabel="Advance to Tier 3"
        />
      }
    />
  );
}
