import { useTier } from '@/contexts/TierContext';
import TierLockedState from '@/components/learning/TierLockedState';
import TierModuleGrid, { ModuleConfig, GateConfig } from '@/components/learning/TierModuleGrid';
import { BookOpen, Search, Clock, Target, GraduationCap } from 'lucide-react';

const MODULES: ModuleConfig[] = [
  {
    id: 'T1-1', title: 'What is the ORB?',
    description: 'The Opening Range Breakout explained and why it works.',
    icon: BookOpen, unlocked: true, lockHint: '',
    path: '/learning/tier1/t1-1',
  },
  {
    id: 'T1-2', title: 'Identifying the Setup',
    description: 'How to spot valid breakout candles and invalid ones.',
    icon: Search, unlocked: false, lockHint: 'Complete T1-1 to unlock',
    path: '/learning/tier1/t1-2',
  },
  {
    id: 'T1-3', title: 'The Retest Rule',
    description: 'Why waiting for the retest is the most important habit you will build.',
    icon: Clock, unlocked: false, lockHint: 'Complete T1-2 to unlock',
    path: '/learning/tier1/t1-3',
  },
  {
    id: 'T1-4', title: 'Setting Your Levels',
    description: 'Stop at the midpoint. Target at 2:1 R:R. Set both before entering.',
    icon: Target, unlocked: false, lockHint: 'Complete T1-3 to unlock',
    path: '/learning/tier1/t1-4',
  },
];

const GATE: GateConfig = {
  title: 'Tier 1 Gate',
  description: 'Complete 20 simulator sessions with a 50%+ win rate and 70%+ step accuracy to advance.',
  icon: GraduationCap,
  buttonText: 'View Progress',
};

export default function Tier1Learning() {
  const { isUnlocked } = useTier();

  if (!isUnlocked('tier1')) {
    return (
      <TierLockedState
        previousLevel="Starter"
        previousPath="/learning/foundation"
        subtext="Complete Starter and pass the quiz first."
      />
    );
  }

  return (
    <TierModuleGrid
      heading="Tier 1 — Pure Price Action"
      subtitle="Master the ORB strategy using price action only. No indicators."
      modules={MODULES}
      gate={GATE}
    />
  );
}
