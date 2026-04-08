import {
  Crosshair, TrendingUp, Pen, Type, Ruler, Magnet,
  Brush, Grid3X3, Lock, Eye, Trash2, Camera, Link, Settings
} from 'lucide-react';

const tools = [
  Crosshair, TrendingUp, Pen, Type, Ruler, Magnet,
  Brush, Grid3X3, Lock, Eye, Trash2, Camera, Link, Settings
];

export default function LeftToolbar() {
  return (
    <div className="flex flex-col items-center w-[38px] bg-[#1e222d] border-r border-[#2a2e39] py-2 gap-1">
      {tools.map((Icon, i) => (
        <button
          key={i}
          className="p-1.5 rounded hover:bg-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc]"
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
