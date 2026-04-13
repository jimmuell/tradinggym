import { useState } from 'react';
import { X } from 'lucide-react';

interface ChartSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const tabs = ['Symbol', 'Status line', 'Scales', 'Appearance', 'Trading', 'Events'] as const;
type Tab = typeof tabs[number];

export default function ChartSettingsModal({ open, onClose }: ChartSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Appearance');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-card text-foreground rounded-lg shadow-2xl w-[680px] max-h-[520px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="text-[15px] font-semibold text-foreground">Chart settings</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-accent">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Tab sidebar */}
          <div className="flex flex-col w-[160px] border-r border-border py-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-left px-4 py-2 text-[13px] hover:bg-accent ${
                  activeTab === tab ? 'text-foreground bg-accent font-medium' : 'text-muted-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === 'Appearance' && <AppearanceTab />}
            {activeTab === 'Symbol' && <SymbolTab />}
            {activeTab === 'Status line' && <StatusLineTab />}
            {activeTab === 'Scales' && <ScalesTab />}
            {activeTab === 'Trading' && <TradingTab />}
            {activeTab === 'Events' && <EventsTab />}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <button className="text-[13px] text-muted-foreground hover:text-foreground">Reset to defaults</button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-1.5 text-[13px] rounded bg-accent text-foreground hover:bg-muted">
              Cancel
            </button>
            <button onClick={onClose} className="px-4 py-1.5 text-[13px] rounded bg-[#2962ff] text-white font-medium hover:bg-[#1e53e5]">
              Ok
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[13px] text-foreground">{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function Toggle({ defaultChecked = false }: { defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <button
      onClick={() => setOn(!on)}
      className={`w-9 h-5 rounded-full transition-colors ${on ? 'bg-[#2962ff]' : 'bg-muted'}`}
    >
      <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform mx-0.5 ${on ? 'translate-x-4' : ''}`} />
    </button>
  );
}

function ColorSwatch({ color }: { color: string }) {
  return <div className="w-6 h-6 rounded border border-muted cursor-pointer hover:border-muted-foreground" style={{ backgroundColor: color }} />;
}

function SelectBox({ options, defaultValue }: { options: string[]; defaultValue?: string }) {
  return (
    <select className="bg-accent text-foreground text-[12px] rounded px-2 py-1 border border-muted outline-none" defaultValue={defaultValue}>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function AppearanceTab() {
  return (
    <div className="space-y-1">
      <h3 className="text-[13px] text-muted-foreground font-medium mb-2">Candles</h3>
      <SettingRow label="Body"><div className="flex gap-1"><ColorSwatch color="#26a69a" /><ColorSwatch color="#ef5350" /></div></SettingRow>
      <SettingRow label="Borders"><div className="flex gap-1"><ColorSwatch color="#26a69a" /><ColorSwatch color="#ef5350" /></div></SettingRow>
      <SettingRow label="Wicks"><div className="flex gap-1"><ColorSwatch color="#26a69a" /><ColorSwatch color="#ef5350" /></div></SettingRow>

      <div className="border-t border-border my-3" />
      <h3 className="text-[13px] text-muted-foreground font-medium mb-2">Background</h3>
      <SettingRow label="Type"><SelectBox options={['Solid', 'Gradient']} defaultValue="Solid" /></SettingRow>
      <SettingRow label="Color"><ColorSwatch color="#ffffff" /></SettingRow>

      <div className="border-t border-border my-3" />
      <h3 className="text-[13px] text-muted-foreground font-medium mb-2">Grid</h3>
      <SettingRow label="Vertical lines"><Toggle defaultChecked /></SettingRow>
      <SettingRow label="Horizontal lines"><Toggle defaultChecked /></SettingRow>
      <SettingRow label="Grid color"><ColorSwatch color="#e1ecf2" /></SettingRow>

      <div className="border-t border-border my-3" />
      <h3 className="text-[13px] text-muted-foreground font-medium mb-2">Crosshair</h3>
      <SettingRow label="Style"><SelectBox options={['Dashed', 'Solid', 'Dotted']} defaultValue="Dashed" /></SettingRow>
      <SettingRow label="Color"><ColorSwatch color="#9598a1" /></SettingRow>

      <div className="border-t border-border my-3" />
      <h3 className="text-[13px] text-muted-foreground font-medium mb-2">Watermark</h3>
      <SettingRow label="Show watermark"><Toggle /></SettingRow>
    </div>
  );
}

function SymbolTab() {
  return (
    <div className="space-y-1">
      <h3 className="text-[13px] text-muted-foreground font-medium mb-2">Price line</h3>
      <SettingRow label="Show price line"><Toggle defaultChecked /></SettingRow>
      <SettingRow label="Line style"><SelectBox options={['Dashed', 'Solid', 'Dotted']} defaultValue="Dashed" /></SettingRow>
      <SettingRow label="Line width"><SelectBox options={['1', '2', '3', '4']} defaultValue="1" /></SettingRow>

      <div className="border-t border-border my-3" />
      <h3 className="text-[13px] text-muted-foreground font-medium mb-2">Previous close</h3>
      <SettingRow label="Show previous close"><Toggle /></SettingRow>

      <div className="border-t border-border my-3" />
      <h3 className="text-[13px] text-muted-foreground font-medium mb-2">Session breaks</h3>
      <SettingRow label="Show session breaks"><Toggle /></SettingRow>
    </div>
  );
}

function StatusLineTab() {
  return (
    <div className="space-y-1">
      <h3 className="text-[13px] text-muted-foreground font-medium mb-2">Values</h3>
      <SettingRow label="Show OHLC values"><Toggle defaultChecked /></SettingRow>
      <SettingRow label="Show bar change"><Toggle defaultChecked /></SettingRow>
      <SettingRow label="Show volume"><Toggle defaultChecked /></SettingRow>

      <div className="border-t border-border my-3" />
      <h3 className="text-[13px] text-muted-foreground font-medium mb-2">Indicator values</h3>
      <SettingRow label="Show indicator name"><Toggle defaultChecked /></SettingRow>
      <SettingRow label="Show indicator values"><Toggle defaultChecked /></SettingRow>

      <div className="border-t border-border my-3" />
      <h3 className="text-[13px] text-muted-foreground font-medium mb-2">Title</h3>
      <SettingRow label="Show symbol name"><Toggle defaultChecked /></SettingRow>
      <SettingRow label="Show exchange"><Toggle defaultChecked /></SettingRow>
    </div>
  );
}

function ScalesTab() {
  return (
    <div className="space-y-1">
      <h3 className="text-[13px] text-muted-foreground font-medium mb-2">Price scale</h3>
      <SettingRow label="Position"><SelectBox options={['Right', 'Left', 'None']} defaultValue="Right" /></SettingRow>
      <SettingRow label="Mode"><SelectBox options={['Regular', 'Percentage', 'Logarithmic']} defaultValue="Regular" /></SettingRow>
      <SettingRow label="Auto scale"><Toggle defaultChecked /></SettingRow>

      <div className="border-t border-border my-3" />
      <h3 className="text-[13px] text-muted-foreground font-medium mb-2">Time scale</h3>
      <SettingRow label="Show time"><Toggle defaultChecked /></SettingRow>
      <SettingRow label="Show seconds"><Toggle /></SettingRow>
      <SettingRow label="Bar spacing"><SelectBox options={['4', '6', '8', '10', '12', '14']} defaultValue="10" /></SettingRow>

      <div className="border-t border-border my-3" />
      <h3 className="text-[13px] text-muted-foreground font-medium mb-2">Labels</h3>
      <SettingRow label="Show labels on price scale"><Toggle defaultChecked /></SettingRow>
      <SettingRow label="Countdown to bar close"><Toggle /></SettingRow>
    </div>
  );
}

function TradingTab() {
  return (
    <div className="space-y-1">
      <h3 className="text-[13px] text-muted-foreground font-medium mb-2">Order panel</h3>
      <SettingRow label="Show buy/sell panel"><Toggle defaultChecked /></SettingRow>
      <SettingRow label="Show spread"><Toggle defaultChecked /></SettingRow>

      <div className="border-t border-border my-3" />
      <h3 className="text-[13px] text-muted-foreground font-medium mb-2">Positions</h3>
      <SettingRow label="Show positions"><Toggle defaultChecked /></SettingRow>
      <SettingRow label="Show P&L"><Toggle defaultChecked /></SettingRow>

      <div className="border-t border-border my-3" />
      <h3 className="text-[13px] text-muted-foreground font-medium mb-2">Orders</h3>
      <SettingRow label="Show orders"><Toggle defaultChecked /></SettingRow>
      <SettingRow label="Show order price"><Toggle defaultChecked /></SettingRow>
    </div>
  );
}

function EventsTab() {
  return (
    <div className="space-y-1">
      <h3 className="text-[13px] text-muted-foreground font-medium mb-2">Dividends</h3>
      <SettingRow label="Show dividends"><Toggle /></SettingRow>

      <div className="border-t border-border my-3" />
      <h3 className="text-[13px] text-muted-foreground font-medium mb-2">Splits</h3>
      <SettingRow label="Show splits"><Toggle /></SettingRow>

      <div className="border-t border-border my-3" />
      <h3 className="text-[13px] text-muted-foreground font-medium mb-2">Earnings</h3>
      <SettingRow label="Show earnings"><Toggle /></SettingRow>
      <SettingRow label="Show revenue"><Toggle /></SettingRow>
    </div>
  );
}
