import {
  Crosshair, TrendingUp, AlignJustify, GitFork, Waypoints,
  Shuffle, Type, Smile,
  Brush, ZoomIn, Magnet,
  Ruler, Lock, Eye,
  Link, Trash2, Star
} from 'lucide-react';

const Divider = () => <div className="w-6 h-px bg-border my-1" />;

const groups = [
  [{ icon: Crosshair, label: 'Cursor' }],
  [
    { icon: TrendingUp, label: 'Trend Line' },
    { icon: AlignJustify, label: 'Horizontal Lines' },
    { icon: GitFork, label: 'Pitchfork' },
    { icon: Waypoints, label: 'Fib Tools' },
  ],
  [
    { icon: Shuffle, label: 'Patterns' },
    { icon: Type, label: 'Text' },
    { icon: Smile, label: 'Stickers' },
  ],
  [
    { icon: Brush, label: 'Highlighter' },
    { icon: ZoomIn, label: 'Zoom In' },
    { icon: Magnet, label: 'Magnet' },
  ],
  [
    { icon: Ruler, label: 'Measure' },
    { icon: Lock, label: 'Lock' },
    { icon: Eye, label: 'Eye' },
  ],
  [
    { icon: Link, label: 'Link' },
    { icon: Trash2, label: 'Remove' },
  ],
];

export default function LeftToolbar() {
  return (
    <div className="flex flex-col items-center w-[44px] bg-card border-r border-border py-1">
      {groups.map((group, gi) => (
        <div key={gi}>
          {gi > 0 && <Divider />}
          {group.map(({ icon: Icon, label }) => (
            <button
              key={label}
              title={label}
              className="flex items-center justify-center w-full p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              <Icon size={18} />
            </button>
          ))}
        </div>
      ))}
      <div className="mt-auto">
        <button title="Favorites" className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
          <Star size={18} />
        </button>
      </div>
    </div>
  );
}
