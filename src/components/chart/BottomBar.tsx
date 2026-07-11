import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Settings, ChevronRight } from 'lucide-react';
import DateRangeModal from './DateRangeModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { usePracticeAccount, type PracticeTrade } from '@/hooks/usePracticeAccount';
import { PRACTICE_STARTING_BALANCE, formatMoney } from '@/lib/practiceAccount';

const timeframes = ['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y', 'All'];

const mainTabs = ['Strategy Report', 'Paper Trading', 'Trade'] as const;
type MainTab = typeof mainTabs[number];

const tradingSubTabs = ['Positions', 'Orders', 'Order History', 'Balance History', 'Trading Journal'] as const;
type TradingSubTab = typeof tradingSubTabs[number];

const orderFilters = ['All', 'Working', 'Inactive', 'Filled', 'Cancelled', 'Rejected'] as const;

const positionColumns = ['Symbol', 'Side', 'Qty', 'Avg Fill Price', 'Take Profit', 'Stop Loss', 'Last Price', 'Unrealized P&L', 'Unrealized P&L %', 'Trade Value', 'Market Value', 'Leverage', 'Margin', 'Expiration Date'];
const orderColumns = ['Symbol', 'Side', 'Type', 'Qty', 'Limit Price', 'Stop Price', 'Fill Price', 'Take Profit', 'Stop Loss', 'Instruction', 'Status', 'Commission', 'Placing Time', 'Order ID', 'Level ID', 'Expiry', 'Leverage', 'Margin'];
const historyColumns = ['Symbol', 'Side', 'Qty', 'Entry Price', 'Exit Price', 'Stop Loss', 'Take Profit', 'Result', 'P&L', 'Opened', 'Closed'];
const balanceColumns = ['Date', 'Type', 'Amount', 'Balance', 'Description'];
const journalColumns = ['Date', 'Symbol', 'Side', 'Qty', 'Entry Price', 'Exit Price', 'P&L', 'Result', 'Notes'];

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

const StrategyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="inline-block text-muted-foreground">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12l3 3 5-5" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M5 11l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M5 7l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground" />
  </svg>
);

const MaximizeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="4" y="4" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground" />
  </svg>
);

const MinimizeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="3" y="6" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground" />
    <path d="M7 6V4.5a1 1 0 011-1h5.5a1 1 0 011 1V10a1 1 0 01-1 1H12" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground" />
  </svg>
);

const MIN_PANEL_HEIGHT = 0;
const DEFAULT_PANEL_HEIGHT = 280;
const MAX_PANEL_RATIO = 0.6;

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function pnlColor(v: number): string | undefined {
  if (v > 0) return '#26a69a';
  if (v < 0) return '#ef5350';
  return undefined;
}

export default function BottomBar() {
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('Paper Trading');
  const [activeSubTab, setActiveSubTab] = useState<TradingSubTab>('Positions');
  const [panelHeight, setPanelHeight] = useState(0);
  const [maximized, setMaximized] = useState(false);
  const [activeOrderFilter, setActiveOrderFilter] = useState('All');
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const preMaximizeHeight = useRef(DEFAULT_PANEL_HEIGHT);

  const { user } = useAuth();
  const practice = usePracticeAccount();

  const { data: profile } = useQuery({
    queryKey: ['profile-display-name', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user!.id)
        .maybeSingle();
      return data;
    },
  });

  const accountLabel = useMemo(() => {
    const name =
      profile?.display_name?.trim() ||
      user?.email?.split('@')[0] ||
      'Trader';
    return `${name} USD`;
  }, [profile?.display_name, user?.email]);

  const accountStats = useMemo(() => {
    const rp = practice.realizedPnl;
    return [
      { label: 'Account balance', value: formatMoney(practice.balance) },
      { label: 'Equity', value: formatMoney(practice.equity) },
      { label: 'Realized P&L', value: `${rp >= 0 ? '+' : '-'}${formatMoney(Math.abs(rp))}`, color: pnlColor(rp) },
      { label: 'Unrealized P&L', value: '0.00' },
      { label: 'Account margin', value: '0.00' },
      { label: 'Available funds', value: formatMoney(practice.balance) },
      { label: 'Orders margin', value: '0.00' },
      { label: 'Margin buffer', value: '100.00%' },
    ];
  }, [practice.balance, practice.equity, practice.realizedPnl]);

  const balanceHistory = useMemo(() => {
    // oldest -> newest
    const closedAsc = [...practice.closedTrades].sort((a, b) => {
      const ta = a.closed_at ? new Date(a.closed_at).getTime() : 0;
      const tb = b.closed_at ? new Date(b.closed_at).getTime() : 0;
      return ta - tb;
    });
    let running = PRACTICE_STARTING_BALANCE;
    const rows = closedAsc.map((t) => {
      const amt = Number(t.pnl) || 0;
      running += amt;
      return {
        id: t.id,
        date: t.closed_at,
        type: amt >= 0 ? 'Trade P&L' : 'Trade Loss',
        amount: amt,
        balance: running,
        description: `${t.symbol ?? 'MES'} ${t.direction ?? ''} ${t.result ?? ''}`.trim(),
      };
    });
    return rows.reverse(); // newest first for display
  }, [practice.closedTrades]);

  const expanded = panelHeight > 0;

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartHeight.current = maximized
      ? window.innerHeight * MAX_PANEL_RATIO
      : panelHeight;
  }, [panelHeight, maximized]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = dragStartY.current - e.clientY;
      const newHeight = Math.max(MIN_PANEL_HEIGHT, Math.min(
        window.innerHeight * MAX_PANEL_RATIO,
        dragStartHeight.current + delta
      ));
      if (maximized) setMaximized(false);
      setPanelHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setPanelHeight(prev => prev < 40 ? 0 : prev);
    };

    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, maximized]);

  const toggleExpand = () => {
    if (maximized) {
      setMaximized(false);
      setPanelHeight(preMaximizeHeight.current);
    } else if (expanded) {
      setPanelHeight(0);
    } else {
      setPanelHeight(DEFAULT_PANEL_HEIGHT);
    }
  };

  const toggleMaximize = () => {
    if (maximized) {
      setMaximized(false);
      setPanelHeight(preMaximizeHeight.current);
    } else {
      if (expanded) preMaximizeHeight.current = panelHeight;
      else preMaximizeHeight.current = DEFAULT_PANEL_HEIGHT;
      setMaximized(true);
      setPanelHeight(0);
    }
  };

  const openPanel = () => {
    if (!expanded && !maximized) setPanelHeight(DEFAULT_PANEL_HEIGHT);
  };

  const effectiveHeight = maximized
    ? `${Math.floor(window.innerHeight * MAX_PANEL_RATIO)}px`
    : `${panelHeight}px`;

  const columns = getColumnsForSubTab(activeSubTab);
  const emptyMessage = getEmptyMessage(activeSubTab);

  const renderPositions = () => {
    if (practice.openPositions.length === 0) return null;
    return practice.openPositions.map((t: PracticeTrade) => (
      <div key={t.id} className="flex items-center h-[28px] px-3 text-[11px] text-foreground border-b border-border/50">
        <span className="min-w-[100px] flex-shrink-0">{t.symbol ?? 'MES'}</span>
        <span className="min-w-[100px] flex-shrink-0 capitalize">{t.direction ?? '—'}</span>
        <span className="min-w-[100px] flex-shrink-0">{t.contracts ?? 1}</span>
        <span className="min-w-[100px] flex-shrink-0">{t.entry_price ?? '—'}</span>
        <span className="min-w-[100px] flex-shrink-0">{t.take_profit ?? '—'}</span>
        <span className="min-w-[100px] flex-shrink-0">{t.stop_loss ?? '—'}</span>
        <span className="min-w-[100px] flex-shrink-0">—</span>
        <span className="min-w-[100px] flex-shrink-0">—</span>
        <span className="min-w-[100px] flex-shrink-0">—</span>
        <span className="min-w-[100px] flex-shrink-0">—</span>
        <span className="min-w-[100px] flex-shrink-0">—</span>
        <span className="min-w-[100px] flex-shrink-0">1x</span>
        <span className="min-w-[100px] flex-shrink-0">—</span>
        <span className="min-w-[100px] flex-shrink-0">—</span>
      </div>
    ));
  };

  const renderOrderHistory = () => {
    if (practice.closedTrades.length === 0) return null;
    return practice.closedTrades.map((t) => {
      const pnl = Number(t.pnl) || 0;
      return (
        <div key={t.id} className="flex items-center h-[28px] px-3 text-[11px] text-foreground border-b border-border/50">
          <span className="min-w-[100px] flex-shrink-0">{t.symbol ?? 'MES'}</span>
          <span className="min-w-[100px] flex-shrink-0 capitalize">{t.direction ?? '—'}</span>
          <span className="min-w-[100px] flex-shrink-0">{t.contracts ?? 1}</span>
          <span className="min-w-[100px] flex-shrink-0">{t.entry_price ?? '—'}</span>
          <span className="min-w-[100px] flex-shrink-0">{t.exit_price ?? '—'}</span>
          <span className="min-w-[100px] flex-shrink-0">{t.stop_loss ?? '—'}</span>
          <span className="min-w-[100px] flex-shrink-0">{t.take_profit ?? '—'}</span>
          <span className="min-w-[100px] flex-shrink-0 capitalize">{t.result ?? '—'}</span>
          <span className="min-w-[100px] flex-shrink-0" style={{ color: pnlColor(pnl) }}>
            {pnl >= 0 ? '+' : '-'}${formatMoney(Math.abs(pnl))}
          </span>
          <span className="min-w-[100px] flex-shrink-0">{formatDateTime(t.opened_at)}</span>
          <span className="min-w-[100px] flex-shrink-0">{formatDateTime(t.closed_at)}</span>
        </div>
      );
    });
  };

  const renderJournal = () => {
    if (practice.closedTrades.length === 0) return null;
    return practice.closedTrades.map((t) => {
      const pnl = Number(t.pnl) || 0;
      return (
        <div key={t.id} className="flex items-center h-[28px] px-3 text-[11px] text-foreground border-b border-border/50">
          <span className="min-w-[100px] flex-shrink-0">{formatDateTime(t.closed_at)}</span>
          <span className="min-w-[100px] flex-shrink-0">{t.symbol ?? 'MES'}</span>
          <span className="min-w-[100px] flex-shrink-0 capitalize">{t.direction ?? '—'}</span>
          <span className="min-w-[100px] flex-shrink-0">{t.contracts ?? 1}</span>
          <span className="min-w-[100px] flex-shrink-0">{t.entry_price ?? '—'}</span>
          <span className="min-w-[100px] flex-shrink-0">{t.exit_price ?? '—'}</span>
          <span className="min-w-[100px] flex-shrink-0" style={{ color: pnlColor(pnl) }}>
            {pnl >= 0 ? '+' : '-'}${formatMoney(Math.abs(pnl))}
          </span>
          <span className="min-w-[100px] flex-shrink-0 capitalize">{t.result ?? '—'}</span>
          <span className="min-w-[100px] flex-shrink-0 truncate">{t.notes ?? ''}</span>
        </div>
      );
    });
  };

  const renderBalanceHistory = () => {
    if (balanceHistory.length === 0) return null;
    return balanceHistory.map((row) => (
      <div key={row.id} className="flex items-center h-[28px] px-3 text-[11px] text-foreground border-b border-border/50">
        <span className="min-w-[100px] flex-shrink-0">{formatDateTime(row.date)}</span>
        <span className="min-w-[100px] flex-shrink-0">{row.type}</span>
        <span className="min-w-[100px] flex-shrink-0" style={{ color: pnlColor(row.amount) }}>
          {row.amount >= 0 ? '+' : '-'}${formatMoney(Math.abs(row.amount))}
        </span>
        <span className="min-w-[100px] flex-shrink-0">${formatMoney(row.balance)}</span>
        <span className="min-w-[100px] flex-shrink-0 truncate">{row.description}</span>
      </div>
    ));
  };

  const renderTableBody = () => {
    let rows: React.ReactNode = null;
    switch (activeSubTab) {
      case 'Positions': rows = renderPositions(); break;
      case 'Order History': rows = renderOrderHistory(); break;
      case 'Trading Journal': rows = renderJournal(); break;
      case 'Balance History': rows = renderBalanceHistory(); break;
      case 'Orders': rows = null; break;
    }
    if (!rows) {
      return (
        <div className="flex-1 flex items-center justify-center text-[13px] text-muted-foreground">
          {emptyMessage}
        </div>
      );
    }
    return <div className="flex-1 overflow-auto">{rows}</div>;
  };

  return (
    <>
      <DateRangeModal open={dateModalOpen} onClose={() => setDateModalOpen(false)} />

      {/* Row 1: Timeframe bar */}
      <div className="flex items-center h-[26px] bg-card border-t border-border px-2 text-[11px] text-muted-foreground shrink-0">
        <div className="flex items-center gap-0.5">
          {timeframes.map((tf) => (
            <button
              key={tf}
              className="px-1.5 py-0.5 rounded hover:bg-accent hover:text-foreground"
            >
              {tf}
            </button>
          ))}
          <button onClick={() => setDateModalOpen(true)} className="px-1 py-0.5 rounded hover:bg-accent text-[13px]">📅</button>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <span>15:07:23 UTC-5</span>
          <span>ETH</span>
          <span>B-ADJ</span>
        </div>
      </div>

      {/* Draggable separator */}
      <div
        onMouseDown={handleDragStart}
        className={`relative h-[4px] shrink-0 group cursor-ns-resize ${isDragging ? 'bg-[#2962ff]' : 'bg-border hover:bg-muted'}`}
        style={{ transition: isDragging ? 'none' : 'background-color 0.15s' }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-8 h-[2px] rounded-full ${isDragging ? 'bg-[#5b8def]' : 'bg-muted group-hover:bg-muted-foreground/30'}`} />
        </div>
      </div>

      {/* Row 2: Main tabs bar */}
      <div className="flex items-center h-[30px] bg-card px-2 text-[12px] text-muted-foreground shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setActiveMainTab('Strategy Report'); openPanel(); }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] ${
              activeMainTab === 'Strategy Report'
                ? 'text-foreground bg-accent'
                : 'hover:text-foreground hover:bg-accent'
            }`}
          >
            <StrategyIcon />
            Strategy Report
          </button>

          <button
            onClick={() => { setActiveMainTab('Paper Trading'); openPanel(); }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] ${
              activeMainTab === 'Paper Trading'
                ? 'text-foreground bg-accent'
                : 'hover:text-foreground hover:bg-accent'
            }`}
          >
            Paper Trading
          </button>

          <button
            onClick={() => { setActiveMainTab('Trade'); openPanel(); }}
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded border text-[12px] ${
              activeMainTab === 'Trade'
                ? 'text-foreground border-foreground'
                : 'text-muted-foreground border-muted-foreground hover:text-foreground hover:border-foreground'
            }`}
          >
            Trade
          </button>
        </div>

        <div className="flex-1" />

        <button
          onClick={toggleExpand}
          className="p-1 hover:text-foreground transition-colors"
          title={expanded || maximized ? 'Collapse' : 'Expand'}
        >
          {expanded || maximized ? <ChevronDownIcon /> : <ChevronUpIcon />}
        </button>
        <button
          onClick={toggleMaximize}
          className="p-1 hover:text-foreground transition-colors"
          title={maximized ? 'Restore' : 'Maximize'}
        >
          {maximized ? <MinimizeIcon /> : <MaximizeIcon />}
        </button>
      </div>

      {/* Expandable panel */}
      <div
        className="bg-background overflow-hidden flex flex-col shrink-0"
        style={{
          height: effectiveHeight,
          transition: isDragging ? 'none' : 'height 0.2s ease',
        }}
      >
        {(expanded || maximized) && (
          <>
            {/* Panel header: broker info + account stats */}
            <div className="flex items-center h-[36px] px-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2 text-[12px] text-foreground">
                <span className="flex items-center gap-1 cursor-pointer hover:text-foreground">
                  Paper Trading <ChevronRight size={12} className="rotate-90" />
                </span>
                <span className="flex items-center gap-1 text-muted-foreground cursor-pointer hover:text-foreground">
                  {accountLabel} <ChevronRight size={12} className="rotate-90" />
                </span>
                <Settings size={14} className="text-muted-foreground hover:text-foreground cursor-pointer" />
              </div>
              <div className="flex-1" />
              <div className="flex items-center gap-5 text-[11px]">
                {accountStats.map(({ label, value, color }) => (
                  <div key={label} className="flex flex-col items-end">
                    <span className="text-muted-foreground text-[10px]">{label}</span>
                    <span className={color ? '' : 'text-foreground'} style={color ? { color } : undefined}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub-tabs row */}
            <div className="flex items-center h-[32px] px-3 border-b border-border shrink-0">
              <div className="flex items-center gap-4 text-[12px]">
                {tradingSubTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveSubTab(tab)}
                    className={`pb-1 border-b-2 transition-colors ${
                      tab === activeSubTab
                        ? 'text-foreground border-[#2962ff]'
                        : 'text-muted-foreground border-transparent hover:text-foreground'
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
                        ? 'text-foreground bg-accent'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            )}

            {/* Table header */}
            <div className="flex items-center h-[28px] px-3 border-b border-border text-[11px] text-muted-foreground shrink-0 overflow-x-auto">
              {columns.map((col) => (
                <span key={col} className="min-w-[100px] flex-shrink-0">{col}</span>
              ))}
              <span className="ml-auto text-muted-foreground cursor-pointer">☰</span>
            </div>

            {/* Body */}
            {renderTableBody()}
          </>
        )}
      </div>
    </>
  );
}
