import { useState } from 'react';
import { ChevronUp, ChevronDown, Maximize2, Minimize2, Settings, ChevronRight } from 'lucide-react';
import DateRangeModal from './DateRangeModal';

const timeframes = ['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y', 'All'];

const mainTabs = ['Strategy Report', 'Paper Trading', 'Trade'] as const;
type MainTab = typeof mainTabs[number];

const tradingSubTabs = ['Positions', 'Orders', 'Order History', 'Balance History', 'Trading Journal'] as const;
type TradingSubTab = typeof tradingSubTabs[number];

const orderFilters = ['All', 'Working', 'Inactive', 'Filled', 'Cancelled', 'Rejected'] as const;

const accountStats = [
  { label: 'Account balance', value: '2,363.75' },
  { label: 'Equity', value: '2,363.75' },
  { label: 'Realized P&L', value: '+1,863.75', color: '#26a69a' },
  { label: 'Unrealized P&L', value: '0.00' },
  { label: 'Account margin', value: '0.00' },
  { label: 'Available funds', value: '2,363.75' },
  { label: 'Orders margin', value: '0.00' },
  { label: 'Margin buffer', value: '100.00%' },
];

const positionColumns = ['Symbol', 'Side', 'Qty ↑', 'Avg Fill Price', 'Take Profit', 'Stop Loss', 'Last Price', 'Unrealized P&L', 'Unrealized P&L %', 'Trade Value', 'Market Value', 'Leverage', 'Margin', 'Expiration Date'];
const orderColumns = ['Symbol', 'Side', 'Type', 'Qty', 'Limit Price', 'Stop Price', 'Fill Price', 'Take Profit', 'Stop Loss', 'Instruction', 'Status', 'Commission', 'Placing Time', 'Order ID ↑', 'Level ID', 'Expiry', 'Leverage', 'Margin'];
const historyColumns = ['Symbol', 'Side', 'Type', 'Qty', 'Limit Price', 'Stop Price', 'Fill Price', 'Take Profit', 'Stop Loss', 'Instruction', 'Status', 'Commission', 'Placing Time', 'Order ID', 'Level ID'];
const balanceColumns = ['Date', 'Type', 'Amount', 'Balance', 'Description'];
const journalColumns = ['Date', 'Symbol', 'Side', 'Qty', 'Entry Price', 'Exit Price', 'P&L', 'Duration', 'Notes'];

function getColumnsForSubTab(subTab: TradingSubTab): string[] {
  switch (subTab) {
    case 'Positions': return positionColumns;
    case 'Orders': return orderColumns;
    case 'Order History': return historyColumns;
    case 'Balance History': return balanceColumns;
    case 'Trading Journal': return journalColumns;
  }
}

function getEmptyMessage(subTab: TradingSubTab): string {
  switch (subTab) {
    case 'Positions': return 'There are no open positions in your trading account yet';
    case 'Orders': return 'There is no trading data here yet';
    case 'Order History': return 'There is no order history yet';
    case 'Balance History': return 'There is no balance history yet';
    case 'Trading Journal': return 'There are no journal entries yet';
  }
}

// TV logo small icon
const TVIcon = () => (
  <svg width="16" height="12" viewBox="0 0 40 28" className="inline-block">
    <path d="M8 0h24L40 28H0z" fill="#2962ff" />
  </svg>
);

// Strategy report icon
const StrategyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#787b86" strokeWidth="1.5" className="inline-block">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12l3 3 5-5" />
  </svg>
);

export default function BottomBar() {
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('Paper Trading');
  const [activeSubTab, setActiveSubTab] = useState<TradingSubTab>('Positions');
  const [expanded, setExpanded] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [activeOrderFilter, setActiveOrderFilter] = useState('All');

  const panelHeight = maximized ? 'h-[60vh]' : expanded ? 'h-[280px]' : 'h-0';
  const columns = getColumnsForSubTab(activeSubTab);
  const emptyMessage = getEmptyMessage(activeSubTab);

  return (
    <>
      <DateRangeModal open={dateModalOpen} onClose={() => setDateModalOpen(false)} />

      {/* Row 1: Timeframe bar */}
      <div className="flex items-center h-[26px] bg-[#1e222d] border-t border-[#2a2e39] px-2 text-[11px] text-[#787b86] shrink-0">
        <div className="flex items-center gap-0.5">
          {timeframes.map((tf) => (
            <button
              key={tf}
              className="px-1.5 py-0.5 rounded hover:bg-[#2a2e39] hover:text-[#d1d4dc]"
            >
              {tf}
            </button>
          ))}
          <button onClick={() => setDateModalOpen(true)} className="px-1 py-0.5 rounded hover:bg-[#2a2e39] text-[13px]">📅</button>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <span>15:07:23 UTC-5</span>
          <span>ETH</span>
          <span>B-ADJ</span>
        </div>
      </div>

      {/* Row 2: Main tabs bar */}
      <div className="flex items-center h-[30px] bg-[#1e222d] border-t border-[#2a2e39] px-2 text-[12px] text-[#787b86] shrink-0">
        <div className="flex items-center gap-1">
          {/* Strategy Report tab */}
          <button
            onClick={() => { setActiveMainTab('Strategy Report'); if (!expanded) setExpanded(true); }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] ${
              activeMainTab === 'Strategy Report'
                ? 'text-[#d1d4dc] bg-[#2a2e39]'
                : 'hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
            }`}
          >
            <StrategyIcon />
            Strategy Report
          </button>

          {/* Paper Trading tab */}
          <button
            onClick={() => { setActiveMainTab('Paper Trading'); if (!expanded) setExpanded(true); }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] ${
              activeMainTab === 'Paper Trading'
                ? 'text-[#d1d4dc] bg-[#2a2e39]'
                : 'hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
            }`}
          >
            <TVIcon />
            Paper Trading
          </button>

          {/* Trade tab */}
          <button
            onClick={() => { setActiveMainTab('Trade'); if (!expanded) setExpanded(true); }}
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded border text-[12px] ${
              activeMainTab === 'Trade'
                ? 'text-[#d1d4dc] border-[#d1d4dc]'
                : 'text-[#787b86] border-[#787b86] hover:text-[#d1d4dc] hover:border-[#d1d4dc]'
            }`}
          >
            Trade
          </button>
        </div>

        <div className="flex-1" />

        {/* Collapse / Maximize buttons */}
        <button
          onClick={() => { if (maximized) { setMaximized(false); } else { setExpanded(!expanded); } }}
          className="p-1 hover:text-[#d1d4dc]"
        >
          {expanded || maximized ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
        <button
          onClick={() => { if (!expanded) setExpanded(true); setMaximized(!maximized); }}
          className="p-1 hover:text-[#d1d4dc]"
        >
          {maximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>

      {/* Expandable panel */}
      <div className={`${panelHeight} bg-[#131722] border-t border-[#2a2e39] overflow-hidden transition-all duration-200 flex flex-col shrink-0`}>
        {(expanded || maximized) && (
          <>
            {/* Panel header: broker info + account stats */}
            <div className="flex items-center h-[36px] px-3 border-b border-[#2a2e39] shrink-0">
              <div className="flex items-center gap-2 text-[12px] text-[#d1d4dc]">
                <span className="flex items-center gap-1 cursor-pointer hover:text-white">
                  Paper Trading <ChevronRight size={12} className="rotate-90" />
                </span>
                <span className="flex items-center gap-1 text-[#787b86] cursor-pointer hover:text-[#d1d4dc]">
                  mueller USD <ChevronRight size={12} className="rotate-90" />
                </span>
                <Settings size={14} className="text-[#787b86] hover:text-[#d1d4dc] cursor-pointer" />
              </div>
              <div className="flex-1" />
              <div className="flex items-center gap-5 text-[11px]">
                {accountStats.map(({ label, value, color }) => (
                  <div key={label} className="flex flex-col items-end">
                    <span className="text-[#787b86] text-[10px]">{label}</span>
                    <span className={color ? '' : 'text-[#d1d4dc]'} style={color ? { color } : undefined}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub-tabs row */}
            <div className="flex items-center h-[32px] px-3 border-b border-[#2a2e39] shrink-0">
              <div className="flex items-center gap-4 text-[12px]">
                {tradingSubTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveSubTab(tab)}
                    className={`pb-1 border-b-2 transition-colors ${
                      tab === activeSubTab
                        ? 'text-[#d1d4dc] border-[#2962ff]'
                        : 'text-[#787b86] border-transparent hover:text-[#d1d4dc]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Order filter row (only for Orders tab) */}
            {activeSubTab === 'Orders' && (
              <div className="flex items-center h-[28px] px-3 gap-1 shrink-0">
                {orderFilters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveOrderFilter(filter)}
                    className={`px-2 py-0.5 rounded text-[11px] ${
                      filter === activeOrderFilter
                        ? 'text-[#d1d4dc] bg-[#2a2e39]'
                        : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            )}

            {/* Table header */}
            <div className="flex items-center h-[28px] px-3 border-b border-[#2a2e39] text-[11px] text-[#787b86] shrink-0 overflow-x-auto">
              {columns.map((col) => (
                <span key={col} className="min-w-[100px] flex-shrink-0">{col}</span>
              ))}
              <span className="ml-auto text-[#787b86] cursor-pointer">☰</span>
            </div>

            {/* Empty state */}
            <div className="flex-1 flex items-center justify-center text-[13px] text-[#787b86]">
              {emptyMessage}
            </div>
          </>
        )}
      </div>
    </>
  );
}
