import {
  Crosshair, TrendingUp, AlignJustify, GitFork, Waypoints,
  Shuffle, Type, Smile,
  Brush, ZoomIn, Magnet,
  Ruler, Lock, Eye,
  Link, Trash2, Star, Square
} from 'lucide-react';
import { DrawingTool } from '@/lib/drawingTypes';
import { toast } from 'sonner';

const Divider = () => <div className="w-6 h-px bg-border my-1" />;

interface LeftToolbarProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  drawingCount?: number;
  onClearAll?: () => void;
}

const toolMap: Record<string, DrawingTool> = {
  'Horizontal Lines': 'horizontal',
  'Trend Line': 'trendline',
  'Rectangle': 'rectangle',
  'Text': 'text',
};

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
    { icon: Square, label: 'Rectangle' },
    { icon: Ruler, label: 'Measure' },
    { icon: Lock, label: 'Lock' },
    { icon: Eye, label: 'Eye' },
  ],
  [
    { icon: Link, label: 'Link' },
  ],
];

export default function LeftToolbar({ activeTool, onToolChange, drawingCount = 0, onClearAll }: LeftToolbarProps) {
  const handleClick = (label: string) => {
    const tool = toolMap[label] || null;
    if (label === 'Cursor') {
      onToolChange(null);
      return;
    }
    if (!tool) return;
    onToolChange(activeTool === tool ? null : tool);
  };

  const handleClearAll = () => {
    if (drawingCount === 0) return;
    toast('Clear all drawings? This cannot be undone.', {
      action: {
        label: 'Confirm',
        onClick: () => onClearAll?.(),
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
      duration: 8000,
    });
  };

  return (
    <div className="flex flex-col items-center w-[44px] bg-card border-r border-border py-1">
      {groups.map((group, gi) => (
        <div key={gi}>
          {gi > 0 && <Divider />}
          {group.map(({ icon: Icon, label }) => {
            const tool = toolMap[label] || null;
            const isActive = tool != null && activeTool === tool;
            return (
              <button
                key={label}
                title={label}
                onClick={() => handleClick(label)}
                className={`flex items-center justify-center w-full p-1.5 rounded text-muted-foreground hover:text-foreground ${
                  isActive
                    ? 'bg-blue-600/30 border border-blue-400 text-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <Icon size={18} />
              </button>
            );
          })}
        </div>
      ))}
      <div className="mt-auto flex flex-col items-center gap-1">
        {drawingCount > 0 && (
          <span className="text-[10px] text-muted-foreground font-mono">({drawingCount})</span>
        )}
        <button
          title="Clear All Drawings"
          onClick={handleClearAll}
          className={`p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground ${
            drawingCount === 0 ? 'opacity-30 pointer-events-none' : ''
          }`}
        >
          <Trash2 size={18} />
        </button>
        <button title="Favorites" className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
          <Star size={18} />
        </button>
      </div>
    </div>
  );
}
