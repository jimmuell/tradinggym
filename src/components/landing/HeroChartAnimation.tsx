
const OHLC = [
  { o: 20, h: 28, l: 18, c: 26 },
  { o: 26, h: 32, l: 24, c: 30 },
  { o: 30, h: 34, l: 26, c: 27 },
  { o: 27, h: 33, l: 25, c: 32 },
  { o: 32, h: 38, l: 30, c: 36 },
  { o: 36, h: 40, l: 33, c: 34 },
  { o: 34, h: 42, l: 32, c: 41 },
  { o: 41, h: 45, l: 38, c: 39 },
  { o: 39, h: 46, l: 37, c: 45 },
  { o: 45, h: 50, l: 43, c: 48 },
  { o: 48, h: 52, l: 44, c: 45 },
  { o: 45, h: 49, l: 42, c: 47 },
  { o: 47, h: 55, l: 46, c: 54 },
  { o: 54, h: 58, l: 50, c: 51 },
  { o: 51, h: 56, l: 49, c: 55 },
  { o: 55, h: 62, l: 53, c: 60 },
  { o: 60, h: 64, l: 56, c: 57 },
  { o: 57, h: 63, l: 55, c: 62 },
  { o: 62, h: 68, l: 60, c: 66 },
  { o: 66, h: 70, l: 62, c: 63 },
  { o: 63, h: 69, l: 61, c: 68 },
  { o: 68, h: 74, l: 66, c: 72 },
  { o: 72, h: 76, l: 68, c: 69 },
  { o: 69, h: 75, l: 67, c: 74 },
  { o: 74, h: 80, l: 72, c: 78 },
  { o: 78, h: 82, l: 74, c: 75 },
  { o: 75, h: 81, l: 73, c: 80 },
  { o: 80, h: 86, l: 78, c: 84 },
  { o: 84, h: 90, l: 82, c: 88 },
  { o: 88, h: 92, l: 84, c: 86 },
];

export default function HeroChartAnimation() {
  const w = 1200;
  const h = 300;
  const pad = 20;
  const allValues = OHLC.flatMap((d) => [d.h, d.l]);
  const maxV = Math.max(...allValues);
  const minV = Math.min(...allValues);
  const rangeV = maxV - minV || 1;

  const candleWidth = 16;
  const gap = (w - pad * 2) / OHLC.length;
  const toY = (v: number) => h - pad - ((v - minV) / rangeV) * (h - pad * 2);

  const delayPerCandle = 100; // ms

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <style>{`
        @keyframes candleIn {
          0% { opacity: 0; transform: scaleY(0); }
          100% { opacity: 1; transform: scaleY(1); }
        }
      `}</style>

      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" preserveAspectRatio="none" viewBox="0 0 1200 300">
        {[0.2, 0.4, 0.6, 0.8].map((r) => (
          <line key={r} x1="0" y1={r * 300} x2="1200" y2={r * 300} stroke="white" strokeWidth="1" />
        ))}
        {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((r) => (
          <line key={r} x1={r * 1200} y1="0" x2={r * 1200} y2="300" stroke="white" strokeWidth="1" />
        ))}
      </svg>

      {/* Candlestick chart */}
      <svg
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl h-[60%] opacity-30"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
      >
        {OHLC.map((d, i) => {
          const x = pad + i * gap + gap / 2;
          const bullish = d.c >= d.o;
          const color = bullish ? 'hsl(142, 71%, 45%)' : 'hsl(0, 72%, 51%)';
          const bodyTop = toY(Math.max(d.o, d.c));
          const bodyBot = toY(Math.min(d.o, d.c));
          const bodyH = Math.max(bodyBot - bodyTop, 1);

          return (
            <g
              key={i}
              style={{
                animation: `candleIn 0.4s ease-out ${i * delayPerCandle}ms both`,
                transformOrigin: `${x}px ${toY((d.o + d.c) / 2)}px`,
              }}
            >
              {/* Wick */}
              <line
                x1={x} y1={toY(d.h)}
                x2={x} y2={toY(d.l)}
                stroke={color}
                strokeWidth="1.5"
              />
              {/* Body */}
              <rect
                x={x - candleWidth / 2}
                y={bodyTop}
                width={candleWidth}
                height={bodyH}
                fill={color}
                rx="1"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
