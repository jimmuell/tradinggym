import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const datasets = [
  { value: 'ES_1min', label: 'ES 1 Minute' },
  { value: 'ES_5min', label: 'ES 5 Minute' },
  { value: 'ES_30min', label: 'ES 30 Minute' },
  { value: 'ES_1hour', label: 'ES 1 Hour' },
  { value: 'ES_1day', label: 'ES 1 Day' },
];

interface DateRangeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function DateRangeModal({ open, onClose }: DateRangeModalProps) {
  const [selectedDataset, setSelectedDataset] = useState('ES_1min');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const fileMap: Record<string, string> = {
      ES_1min: '/data/ES_1min.csv',
      ES_5min: '/data/ES_5min.csv',
      ES_30min: '/data/ES_30min.csv',
      ES_1hour: '/data/ES_1hour.csv',
      ES_1day: '/data/ES_1day.csv',
    };
    fetch(fileMap[selectedDataset])
      .then((r) => r.text())
      .then((csv) => {
        const lines = csv.trim().split('\n');
        if (lines.length < 2) return;
        const first = lines[1].split(',')[0].trim().split(' ')[0];
        const last = lines[lines.length - 1].split(',')[0].trim().split(' ')[0];
        setStartDate(first);
        setEndDate(last);
      })
      .finally(() => setLoading(false));
  }, [open, selectedDataset]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
      <div className="bg-card rounded-lg shadow-2xl w-[420px] text-foreground border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="text-[15px] font-semibold text-foreground">Select Date Range</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Dataset selector */}
          <div>
            <label className="block text-[12px] text-muted-foreground mb-1.5">Dataset</label>
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              className="w-full bg-background border border-border rounded px-3 py-2 text-[13px] text-foreground outline-none focus:border-[#2962ff]"
            >
              {datasets.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[12px] text-muted-foreground mb-1.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-background border border-border rounded px-3 py-2 text-[13px] text-foreground outline-none focus:border-[#2962ff] dark:[color-scheme:dark]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[12px] text-muted-foreground mb-1.5">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-background border border-border rounded px-3 py-2 text-[13px] text-foreground outline-none focus:border-[#2962ff] dark:[color-scheme:dark]"
              />
            </div>
          </div>

          {/* Data info */}
          {loading ? (
            <p className="text-[12px] text-muted-foreground">Loading data range...</p>
          ) : (
            <p className="text-[12px] text-muted-foreground">
              Data available from <span className="text-foreground">{startDate}</span> to <span className="text-foreground">{endDate}</span>
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded text-[13px] text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded text-[13px] bg-[#2962ff] text-white font-medium hover:bg-[#1e53e5]"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
