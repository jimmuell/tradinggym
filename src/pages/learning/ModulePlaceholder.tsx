import { useParams } from 'react-router-dom';

const MODULE_TITLES: Record<string, string> = {
  't1-1': 'What is the ORB?',
  't1-2': 'Identifying the Setup',
  't1-3': 'The Retest Rule',
  't1-4': 'Setting Your Levels',
  't2-1': 'What is VWAP?',
  't2-2': 'VWAP as a Filter',
  't2-3': 'Filtered ORB Sessions',
  't3-1': 'How Markets Really Move',
  't3-2': 'The AMD Model',
  't3-3': 'The Inverse Fair Value Gap',
  't3-4': 'AMD Live Sessions',
};

export default function ModulePlaceholder() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const title = MODULE_TITLES[moduleId || ''] || moduleId || 'Module';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground">{moduleId?.toUpperCase()} · {title}</h1>
      <p className="text-muted-foreground mt-2">Module content coming soon.</p>
    </div>
  );
}
