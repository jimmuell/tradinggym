import {
  List, BarChart2, Bell, MessageSquare, ShieldCheck,
  Calendar, Flame, Grid3X3, HelpCircle
} from 'lucide-react';

const tools = [
  List, BarChart2, Bell, MessageSquare, ShieldCheck,
  Calendar, Flame, Grid3X3, HelpCircle
];

export default function RightToolbar() {
  return (
    <div className="flex flex-col items-center w-[38px] bg-[#1e222d] border-l border-[#2a2e39] py-2 gap-1">
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
