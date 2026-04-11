import {
  Crosshair, TrendingUp, Pen, Type, Ruler, Magnet,
  Brush, Grid3X3, Lock, Eye, Trash2, Camera, Link, Settings
} from 'lucide-react';

const tools = [
  { icon: Crosshair, label: 'Crosshair' },
  { icon: TrendingUp, label: 'Trend Line' },
  { icon: Pen, label: 'Fib Retracement' },
  { icon: Brush, label: 'Brush' },
  { icon: Type, label: 'Text' },
  { icon: Ruler, label: 'Measure' },
  { icon: Magnet, label: 'Magnet' },
  { icon: Grid3X3, label: 'Zoom In' },
  { icon: Lock, label: 'Lock' },
  { icon: Eye, label: 'Eye' },
  { icon: Trash2, label: 'Remove' },
  { icon: Camera, label: 'Screenshot' },
  { icon: Link, label: 'Link' },
  { icon: Settings, label: 'Settings' },
];

export default function LeftToolbar() {
  return (
    <div className="flex flex-col items-center w-[44px] bg-[#1e222d] border-r border-[#2a2e39] py-1 gap-0.5">
      {tools.map(({ icon: Icon, label }, i) => (
        <button
          key={i}
          title={label}
          className="p-1.5 rounded hover:bg-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc]"
        >
          <Icon size={18} />
        </button>
      ))}
    </div>
  );
}
