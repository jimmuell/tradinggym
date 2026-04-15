import { useTier, TierState } from '@/contexts/TierContext';

const TIERS: { label: string; value: TierState }[] = [
  { label: 'Foundation', value: 'foundation' },
  { label: 'Tier 1', value: 'tier1' },
  { label: 'Tier 2', value: 'tier2' },
  { label: 'Tier 3', value: 'tier3' },
  { label: 'Coach', value: 'coach' },
];

function DevTierSwitcherInner() {
  const { currentTier, setTierState } = useTier();

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-700 rounded-full px-4 py-2 flex items-center gap-2 text-xs shadow-lg">
      <span className="text-blue-400 font-bold mr-1">DEV</span>
      {TIERS.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => setTierState(value)}
          className={
            currentTier === value
              ? 'bg-blue-600 text-white px-3 py-1 rounded-full font-medium'
              : 'text-slate-400 px-3 py-1 rounded-full hover:text-white hover:bg-slate-700 cursor-pointer'
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function DevTierSwitcher() {
  if (!import.meta.env.DEV) return null;
  return <DevTierSwitcherInner />;
}
