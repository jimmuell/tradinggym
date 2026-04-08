import { useState, useEffect } from 'react';
import { X, Settings2, MoreHorizontal, ChevronDown, ChevronUp, HelpCircle, ArrowUpDown } from 'lucide-react';

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
  externalSlTicks?: number | null;
  externalTpTicks?: number | null;
}

export default function TradeOrderPanel({ onClose, lastPrice, onBuy, externalSlTicks, externalTpTicks }: TradeOrderPanelProps) {
  const [activeTab, setActiveTab] = useState<'Order' | 'DOM'>('Order');
  const [orderType, setOrderType] = useState<'Market' | 'Limit' | 'Stop'>('Market');
  const [units, setUnits] = useState(3);
  const [exitsOpen, setExitsOpen] = useState(true);
  const [tpEnabled, setTpEnabled] = useState(true);
  const [slEnabled, setSlEnabled] = useState(true);
  const [tpTicks, setTpTicks] = useState(75);
  const [slTicks, setSlTicks] = useState(25);

  // Sync from external drag updates
  useEffect(() => {
    if (externalSlTicks != null) setSlTicks(externalSlTicks);
  }, [externalSlTicks]);
  useEffect(() => {
    if (externalTpTicks != null) setTpTicks(externalTpTicks);
  }, [externalTpTicks]);

  const sellPrice = lastPrice;
  const buyPrice = lastPrice + 0.25;
  const spread = 0.25;
  const tickSize = 0.25;
  const tpPrice = (lastPrice + tpTicks * tickSize).toFixed(2);
  const slPrice = (lastPrice - slTicks * tickSize).toFixed(2);
  const tickValue = 3.75;
  const tradeValue = (lastPrice * units * 5).toFixed(2);
  const margin = (units * 68.21).toFixed(2);
  const totalMargin = '2,208.75';

  return (
    <div className="w-[340px] flex-shrink-0 bg-[#1e222d] border-l border-[#2a2e39] flex flex-col h-full overflow-y-auto text-[#d1d4dc]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2e39]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#2962ff] rounded flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">TV</span>
          </div>
          <span className="text-white font-semibold text-sm">MESM2026</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-[#2a2e39] rounded text-[#787b86]"><Settings2 size={16} /></button>
          <button className="p-1 hover:bg-[#2a2e39] rounded text-[#787b86]"><MoreHorizontal size={16} /></button>
          <button onClick={onClose} className="p-1 hover:bg-[#2a2e39] rounded text-[#787b86]"><X size={16} /></button>
        </div>
      </div>

      {/* Order / DOM tabs */}
      <div className="flex border-b border-[#2a2e39]">
        {(['Order', 'DOM'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium text-center ${
              activeTab === tab
                ? 'text-white border-b-2 border-[#2962ff]'
                : 'text-[#787b86] hover:text-[#d1d4dc]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Sell / Buy bar */}
      <div className="flex mx-3 mt-3 rounded overflow-hidden">
        <div className="flex-1 bg-[#ef5350] py-2 px-3">
          <div className="text-[10px] text-white/80">Sell</div>
          <div className="text-white font-bold text-lg">{sellPrice.toFixed(2)}</div>
        </div>
        <div className="flex items-center bg-[#363a45] px-2">
          <span className="text-[10px] text-[#d1d4dc]">{spread.toFixed(2)}</span>
        </div>
        <div className="flex-1 bg-[#2962ff] py-2 px-3 text-right">
          <div className="text-[10px] text-white/80">Buy</div>
          <div className="text-white font-bold text-lg">{buyPrice.toFixed(2)}</div>
        </div>
      </div>

      {/* Market / Limit / Stop */}
      <div className="flex mx-3 mt-3 border-b border-[#2a2e39]">
        {(['Market', 'Limit', 'Stop'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setOrderType(type)}
            className={`flex-1 pb-2 text-sm font-medium text-center ${
              orderType === type
                ? 'text-white border-b-2 border-white'
                : 'text-[#787b86] hover:text-[#d1d4dc]'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Units */}
      <div className="mx-3 mt-3">
        <div className="flex items-center gap-1 text-[12px] text-[#787b86] mb-1">
          Units <ChevronDown size={10} />
        </div>
        <div className="flex items-center border border-[#363a45] rounded bg-[#131722]">
          <input
            type="number"
            value={units}
            onChange={(e) => setUnits(Number(e.target.value))}
            className="flex-1 bg-transparent text-white text-sm px-3 py-2 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button className="px-2 text-[#787b86] hover:text-[#d1d4dc]"><ArrowUpDown size={14} /></button>
          <div className="border-l border-[#363a45] px-3 py-2 text-sm text-[#787b86]">
            {margin} USD <ChevronDown size={10} className="inline" />
          </div>
        </div>
      </div>

      {/* Exits */}
      <div className="mx-3 mt-4">
        <button
          onClick={() => setExitsOpen(!exitsOpen)}
          className="flex items-center justify-between w-full text-white font-semibold text-sm"
        >
          Exits
          {exitsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {exitsOpen && (
          <div className="mt-2 space-y-3">
            {/* Take profit */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] text-[#787b86]">Take profit, price <ChevronDown size={10} className="inline" /></span>
                <button
                  onClick={() => setTpEnabled(!tpEnabled)}
                  className={`w-8 h-4 rounded-full relative transition-colors ${tpEnabled ? 'bg-[#2962ff]' : 'bg-[#363a45]'}`}
                >
                  <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${tpEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center border border-[#363a45] rounded bg-[#131722]">
                <input
                  type="text"
                  value={tpPrice}
                  readOnly
                  className={`flex-1 bg-transparent text-sm px-3 py-2 outline-none ${tpEnabled ? 'text-[#d1d4dc]' : 'text-[#787b86]'}`}
                />
                <button className="px-2 text-[#787b86]"><ArrowUpDown size={14} /></button>
                <div className="border-l border-[#363a45] px-3 py-2 text-sm text-[#787b86] flex items-center gap-1">
                  <input
                    type="number"
                    value={tpTicks}
                    onChange={(e) => setTpTicks(Number(e.target.value))}
                    className="w-8 bg-transparent text-[#d1d4dc] outline-none text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  ticks <ChevronDown size={10} className="inline" />
                </div>
              </div>
            </div>

            {/* Stop loss */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] text-[#787b86]">Stop loss, price <ChevronDown size={10} className="inline" /></span>
                <button
                  onClick={() => setSlEnabled(!slEnabled)}
                  className={`w-8 h-4 rounded-full relative transition-colors ${slEnabled ? 'bg-[#2962ff]' : 'bg-[#363a45]'}`}
                >
                  <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${slEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center border border-[#363a45] rounded bg-[#131722]">
                <input
                  type="text"
                  value={slPrice}
                  readOnly
                  className={`flex-1 bg-transparent text-sm px-3 py-2 outline-none ${slEnabled ? 'text-[#d1d4dc]' : 'text-[#787b86]'}`}
                />
                <button className="px-2 text-[#787b86]"><ArrowUpDown size={14} /></button>
                <div className="border-l border-[#363a45] px-3 py-2 text-sm text-[#787b86] flex items-center gap-1">
                  <input
                    type="number"
                    value={slTicks}
                    onChange={(e) => setSlTicks(Number(e.target.value))}
                    className="w-8 bg-transparent text-[#d1d4dc] outline-none text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  ticks <ChevronDown size={10} className="inline" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order info */}
      <div className="mx-3 mt-4 space-y-2">
        <div className="text-white font-semibold text-sm">Order info</div>
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-[#787b86] flex items-center gap-1">Margin <HelpCircle size={10} /></span>
          <span className="text-[#d1d4dc]">{margin} / {totalMargin}</span>
        </div>
        <div className="w-full h-1.5 bg-[#363a45] rounded-full">
          <div className="h-full bg-[#2962ff] rounded-full" style={{ width: '9%' }} />
        </div>
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-[#787b86]">Leverage</span>
          <span className="text-[#d1d4dc] font-semibold">500:1</span>
        </div>
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-[#787b86]">Tick value</span>
          <span className="text-[#d1d4dc]">{tickValue.toFixed(2)} <span className="text-[#787b86]">USD</span></span>
        </div>
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-[#787b86]">Trade value</span>
          <span className="text-[#d1d4dc] font-semibold">{tradeValue} <span className="text-[#787b86]">USD</span></span>
        </div>
      </div>

      {/* Buy button */}
      <div className="mx-3 mt-4 mb-4">
        <button onClick={() => onBuy({ slEnabled, tpEnabled, slTicks, tpTicks })} className="w-full bg-[#2962ff] hover:bg-[#1e53e5] text-white font-semibold py-3 rounded-lg text-base">
          Buy
          <div className="text-[11px] font-normal opacity-80">{units} MESM2026 MARKET</div>
        </button>
      </div>
    </div>
  );
}
