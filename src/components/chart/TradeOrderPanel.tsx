import { useState, useEffect } from 'react';
import { X, Settings2, MoreHorizontal, ChevronDown, ChevronUp, HelpCircle, ArrowUpDown } from 'lucide-react';
import { InstrumentKey, INSTRUMENTS } from '@/lib/instruments';

export interface SLTPConfig {
  slEnabled: boolean;
  tpEnabled: boolean;
  slTicks: number;
  tpTicks: number;
}

interface TradeOrderPanelProps {
  onClose: () => void;
  lastPrice: number;
  onBuy: (config: SLTPConfig) => void;
  onSell: (config: SLTPConfig) => void;
  externalSlTicks?: number | null;
  externalTpTicks?: number | null;
  instrument: InstrumentKey;
}

export default function TradeOrderPanel({ onClose, lastPrice, onBuy, onSell, externalSlTicks, externalTpTicks, instrument }: TradeOrderPanelProps) {
  const [activeTab, setActiveTab] = useState<'Order' | 'DOM'>('Order');
  const [tradeSide, setTradeSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'Market' | 'Limit' | 'Stop'>('Market');
  const [units, setUnits] = useState(3);
  const [exitsOpen, setExitsOpen] = useState(true);
  const [tpEnabled, setTpEnabled] = useState(() => localStorage.getItem('trade_tp_enabled') !== 'false');
  const [slEnabled, setSlEnabled] = useState(() => localStorage.getItem('trade_sl_enabled') !== 'false');
  const [tpTicks, setTpTicks] = useState(() => Number(localStorage.getItem('trade_tp_ticks')) || 75);
  const [slTicks, setSlTicks] = useState(() => Number(localStorage.getItem('trade_sl_ticks')) || 25);

  const inst = INSTRUMENTS[instrument];

  useEffect(() => {
    localStorage.setItem('trade_tp_ticks', tpTicks.toString());
    localStorage.setItem('trade_sl_ticks', slTicks.toString());
    localStorage.setItem('trade_tp_enabled', tpEnabled.toString());
    localStorage.setItem('trade_sl_enabled', slEnabled.toString());
  }, [tpTicks, slTicks, tpEnabled, slEnabled]);

  useEffect(() => {
    if (externalSlTicks != null) setSlTicks(externalSlTicks);
  }, [externalSlTicks]);
  useEffect(() => {
    if (externalTpTicks != null) setTpTicks(externalTpTicks);
  }, [externalTpTicks]);

  const sellPrice = lastPrice;
  const buyPrice = lastPrice + inst.tickSize;
  const spread = inst.tickSize;
  const totalTickValue = inst.tickValue * units;

  const tpPrice = tradeSide === 'buy'
    ? (lastPrice + tpTicks * inst.tickSize).toFixed(2)
    : (lastPrice - tpTicks * inst.tickSize).toFixed(2);
  const slPrice = tradeSide === 'buy'
    ? (lastPrice - slTicks * inst.tickSize).toFixed(2)
    : (lastPrice + slTicks * inst.tickSize).toFixed(2);

  const tpDollar = (tpTicks * inst.tickValue * units).toFixed(2);
  const slDollar = (slTicks * inst.tickValue * units).toFixed(2);

  const tradeValue = (lastPrice * units * inst.pointValue).toFixed(2);
  const margin = (units * 68.21).toFixed(2);
  const totalMargin = '2,208.75';

  const contractLabel = `${instrument}M2026`;

  return (
    <div className="w-[340px] flex-shrink-0 bg-card border-l border-border flex flex-col h-full overflow-y-auto text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#2962ff] rounded flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">TV</span>
          </div>
          <span className="text-foreground font-semibold text-sm">{contractLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-accent rounded text-muted-foreground"><Settings2 size={16} /></button>
          <button className="p-1 hover:bg-accent rounded text-muted-foreground"><MoreHorizontal size={16} /></button>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded text-muted-foreground"><X size={16} /></button>
        </div>
      </div>

      {/* Order / DOM tabs */}
      <div className="flex border-b border-border">
        {(['Order', 'DOM'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium text-center ${
              activeTab === tab
                ? 'text-foreground border-b-2 border-[#2962ff]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Sell / Buy bar */}
      <div className="flex mx-3 mt-3 rounded overflow-hidden cursor-pointer">
        <div
          onClick={() => setTradeSide('sell')}
          className={`flex-1 py-2 px-3 transition-opacity ${tradeSide === 'sell' ? 'bg-[#ef5350]' : 'bg-[#ef5350]/40'}`}
        >
          <div className="text-[10px] text-white/80">Sell</div>
          <div className="text-white font-bold text-lg">{sellPrice.toFixed(2)}</div>
        </div>
        <div className="flex items-center bg-muted px-2">
          <span className="text-[10px] text-foreground">{spread.toFixed(2)}</span>
        </div>
        <div
          onClick={() => setTradeSide('buy')}
          className={`flex-1 py-2 px-3 text-right transition-opacity ${tradeSide === 'buy' ? 'bg-[#2962ff]' : 'bg-[#2962ff]/40'}`}
        >
          <div className="text-[10px] text-white/80">Buy</div>
          <div className="text-white font-bold text-lg">{buyPrice.toFixed(2)}</div>
        </div>
      </div>

      {/* Market / Limit / Stop */}
      <div className="flex mx-3 mt-3 border-b border-border">
        {(['Market', 'Limit', 'Stop'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setOrderType(type)}
            className={`flex-1 pb-2 text-sm font-medium text-center ${
              orderType === type
                ? 'text-foreground border-b-2 border-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Units */}
      <div className="mx-3 mt-3">
        <div className="flex items-center gap-1 text-[12px] text-muted-foreground mb-1">
          Units <ChevronDown size={10} />
        </div>
        <div className="flex items-center border border-muted rounded bg-background">
          <input
            type="number"
            value={units}
            onChange={(e) => setUnits(Number(e.target.value))}
            className="flex-1 bg-transparent text-foreground text-sm px-3 py-2 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button className="px-2 text-muted-foreground hover:text-foreground"><ArrowUpDown size={14} /></button>
          <div className="border-l border-muted px-3 py-2 text-sm text-muted-foreground">
            {margin} USD <ChevronDown size={10} className="inline" />
          </div>
        </div>
      </div>

      {/* Exits */}
      <div className="mx-3 mt-4">
        <button
          onClick={() => setExitsOpen(!exitsOpen)}
          className="flex items-center justify-between w-full text-foreground font-semibold text-sm"
        >
          Exits
          {exitsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {exitsOpen && (
          <div className="mt-2 space-y-3">
            {/* Take profit */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] text-muted-foreground">Take profit, price <ChevronDown size={10} className="inline" /></span>
                <button
                  onClick={() => setTpEnabled(!tpEnabled)}
                  className={`w-8 h-4 rounded-full relative transition-colors ${tpEnabled ? 'bg-[#2962ff]' : 'bg-muted'}`}
                >
                  <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${tpEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center border border-muted rounded bg-background">
                <input
                  type="text"
                  value={tpPrice}
                  readOnly
                  className={`flex-1 bg-transparent text-sm px-3 py-2 outline-none ${tpEnabled ? 'text-foreground' : 'text-muted-foreground'}`}
                />
                <div className="flex flex-col border-l border-muted">
                  <button onClick={() => setTpTicks(tpTicks + 1)} className="px-2 py-0.5 text-muted-foreground hover:text-foreground"><ChevronUp size={12} /></button>
                  <button onClick={() => setTpTicks(Math.max(1, tpTicks - 1))} className="px-2 py-0.5 text-muted-foreground hover:text-foreground"><ChevronDown size={12} /></button>
                </div>
                <div className="border-l border-muted px-3 py-2 text-sm text-muted-foreground flex items-center gap-1">
                  <input
                    type="number"
                    value={tpTicks}
                    onChange={(e) => setTpTicks(Number(e.target.value))}
                    className="w-8 bg-transparent text-foreground outline-none text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  ticks <ChevronDown size={10} className="inline" />
                </div>
              </div>
              <div className="text-[11px] text-[#26a69a] mt-1 text-right">
                {tpTicks} ticks / +${tpDollar} ({instrument})
              </div>
            </div>

            {/* Stop loss */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] text-muted-foreground">Stop loss, price <ChevronDown size={10} className="inline" /></span>
                <button
                  onClick={() => setSlEnabled(!slEnabled)}
                  className={`w-8 h-4 rounded-full relative transition-colors ${slEnabled ? 'bg-[#2962ff]' : 'bg-muted'}`}
                >
                  <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${slEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center border border-muted rounded bg-background">
                <input
                  type="text"
                  value={slPrice}
                  readOnly
                  className={`flex-1 bg-transparent text-sm px-3 py-2 outline-none ${slEnabled ? 'text-foreground' : 'text-muted-foreground'}`}
                />
                <div className="flex flex-col border-l border-muted">
                  <button onClick={() => setSlTicks(slTicks + 1)} className="px-2 py-0.5 text-muted-foreground hover:text-foreground"><ChevronUp size={12} /></button>
                  <button onClick={() => setSlTicks(Math.max(1, slTicks - 1))} className="px-2 py-0.5 text-muted-foreground hover:text-foreground"><ChevronDown size={12} /></button>
                </div>
                <div className="border-l border-muted px-3 py-2 text-sm text-muted-foreground flex items-center gap-1">
                  <input
                    type="number"
                    value={slTicks}
                    onChange={(e) => setSlTicks(Number(e.target.value))}
                    className="w-8 bg-transparent text-foreground outline-none text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  ticks <ChevronDown size={10} className="inline" />
                </div>
              </div>
              <div className="text-[11px] text-[#ef5350] mt-1 text-right">
                {slTicks} ticks / -${slDollar} ({instrument})
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order info */}
      <div className="mx-3 mt-4 space-y-2">
        <div className="text-foreground font-semibold text-sm">Order info</div>
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-muted-foreground flex items-center gap-1">Margin <HelpCircle size={10} /></span>
          <span className="text-foreground">{margin} / {totalMargin}</span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full">
          <div className="h-full bg-[#2962ff] rounded-full" style={{ width: '9%' }} />
        </div>
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-muted-foreground">Leverage</span>
          <span className="text-foreground font-semibold">500:1</span>
        </div>
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-muted-foreground">Tick value</span>
          <span className="text-foreground">{inst.tickValue.toFixed(2)} × {units} = {totalTickValue.toFixed(2)} <span className="text-muted-foreground">USD</span></span>
        </div>
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-muted-foreground">Trade value</span>
          <span className="text-foreground font-semibold">{tradeValue} <span className="text-muted-foreground">USD</span></span>
        </div>
      </div>

      {/* Buy button */}
      <div className="mx-3 mt-4 mb-4">
        <button
          onClick={() => {
            const config = { slEnabled, tpEnabled, slTicks, tpTicks };
            if (tradeSide === 'buy') {
              onBuy(config);
            } else {
              onSell(config);
            }
          }}
          className={`w-full font-semibold py-3 rounded-lg text-base text-white ${
            tradeSide === 'buy' ? 'bg-[#2962ff] hover:bg-[#1e53e5]' : 'bg-[#ef5350] hover:bg-[#d42f3d]'
          }`}
        >
          {tradeSide === 'buy' ? 'Buy' : 'Sell'}
          <div className="text-[11px] font-normal opacity-80">{units} {contractLabel} MARKET</div>
        </button>
      </div>
    </div>
  );
}
