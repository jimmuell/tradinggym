import { useTier } from '@/contexts/TierContext';
import TierLockedState from '@/components/learning/TierLockedState';
import TierModuleGrid, { ModuleConfig, GateConfig } from '@/components/learning/TierModuleGrid';
import { BookOpen, Layers, BarChart3, Play, GraduationCap } from 'lucide-react';

const MODULES: ModuleConfig[] = [
  {
    id: 'T3-1', title: 'How Markets Really Move',
    description: 'Liquidity, stop sweeps, and why retail traders get trapped.',
    icon: BookOpen, unlocked: true, lockHint: '',
    path: '/learning/tier3/t3-1',
  },
  {
    id: 'T3-2', title: 'The AMD Model',
    description: 'Accumulation, Manipulation, Distribution — the institutional playbook.',
    icon: Layers, unlocked: false, lockHint: 'Complete T3-1 to unlock',
    path: '/learning/tier3/t3-2',
  },
  {
    id: 'T3-3', title: 'The Inverse Fair Value Gap',
    description: 'Identify the IFVG left by the manipulation candle. This is your entry trigger.',
    icon: BarChart3, unlocked: false, lockHint: 'Complete T3-2 to unlock',
    path: '/learning/tier3/t3-3',
  },
  {
    id: 'T3-4', title: 'AMD Live Sessions',
    description: 'Practice the full 7-step AMD blueprint in the simulator.',
    icon: Play, unlocked: false, lockHint: 'Complete T3-3 to unlock',
    path: '/learning/tier3/t3-4',
  },
];

const GATE: GateConfig = {
  title: 'Tier 3 Gate',
  description: '20 sessions with 55%+ win rate and at least 30 completed backtest trades.',
  icon: GraduationCap,
  buttonText: 'View Progress',
};

export default function Tier3Learning() {
  const { isUnlocked } = useTier();

  if (!isUnlocked('tier3')) {
    return (
      <TierLockedState
        previousLevel="Tier 2"
        previousPath="/learning/tier2"
        subtext="Pass the Tier 2 graduation gate first."
      />
    );
  }

  return (
    <TierModuleGrid
      heading="Tier 3 — Institutional Concepts"
      subtitle="Understand how institutions move price. AMD model and the Inverse Fair Value Gap."
      modules={MODULES}
      gate={GATE}
    />
  );
}
