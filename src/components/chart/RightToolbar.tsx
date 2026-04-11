import {
  List, Clock, Layers, MessageSquare,
  Target, AlertTriangle, Calendar, Wifi, Grid3X3, HelpCircle
} from 'lucide-react';

const topIcons = [List, Clock, Layers, MessageSquare];
const bottomIcons = [Target, AlertTriangle, Calendar, Wifi, Grid3X3, HelpCircle];

export default function RightToolbar() {
  return (
    <div className="flex flex-col items-center w-[44px] bg-[#1e222d] border-l border-[#2a2e39] py-2 gap-1">
      {topIcons.map((Icon, i) => (
        <button key={i} className="p-1.5 rounded hover:bg-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc]">
          <Icon size={18} />
        </button>
      ))}
      <div className="mt-auto flex flex-col items-center gap-1">
        {bottomIcons.map((Icon, i) => (
          <button key={i} className="p-1.5 rounded hover:bg-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc]">
            <Icon size={18} />
          </button>
        ))}
      </div>
    </div>
  );
}
