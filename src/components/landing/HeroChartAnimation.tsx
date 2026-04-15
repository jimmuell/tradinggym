import { useEffect, useRef } from 'react';

const POINTS = [
  10, 35, 25, 45, 30, 55, 40, 38, 60, 50, 70, 55, 65, 80, 68, 75, 85, 72, 90, 78,
  65, 70, 85, 95, 80, 88, 75, 92, 100, 88, 95, 82, 90, 98, 85, 92, 78, 88, 95, 105,
];

export default function HeroChartAnimation() {
  const pathRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
    path.animate(
      [{ strokeDashoffset: `${length}` }, { strokeDashoffset: '0' }],
      { duration: 3000, easing: 'ease-out', fill: 'forwards' }
    );

    const glow = glowRef.current;
    if (!glow) {
      return;
    }
    glow.style.strokeDasharray = `${length}`;
    glow.style.strokeDashoffset = `${length}`;
    glow.animate(
      [{ strokeDashoffset: `${length}` }, { strokeDashoffset: '0' }],
      { duration: 3000, easing: 'ease-out', fill: 'forwards' }
    );
  }, []);

  const w = 1200;
  const h = 300;
  const stepX = w / (POINTS.length - 1);
  const maxY = Math.max(...POINTS);
  const minY = Math.min(...POINTS);
  const rangeY = maxY - minY || 1;
  const pad = 20;

  const d = POINTS.map((p, i) => {
    const x = i * stepX;
    const y = h - pad - ((p - minY) / rangeY) * (h - pad * 2);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  // Area fill path
  const lastX = (POINTS.length - 1) * stepX;
  const areaD = `${d} L${lastX.toFixed(1)},${h} L0,${h} Z`;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" preserveAspectRatio="none" viewBox="0 0 1200 300">
        {[0.2, 0.4, 0.6, 0.8].map((r) => (
          <line key={r} x1="0" y1={r * 300} x2="1200" y2={r * 300} stroke="white" strokeWidth="1" />
        ))}
        {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((r) => (
          <line key={r} x1={r * 1200} y1="0" x2={r * 1200} y2="300" stroke="white" strokeWidth="1" />
        ))}
      </svg>

      {/* Chart */}
      <svg
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl h-[60%] opacity-30"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity="0" />
          </linearGradient>
          <filter id="chartGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Area fill - fades in after line draws */}
        <path d={areaD} fill="url(#chartGrad)" opacity="0">
          <animate attributeName="opacity" from="0" to="1" begin="2s" dur="1.5s" fill="freeze" />
        </path>

        {/* Glow line */}
        <path
          ref={glowRef}
          d={d}
          fill="none"
          stroke="hsl(217, 91%, 60%)"
          strokeWidth="3"
          filter="url(#chartGlow)"
          opacity="0.4"
        />

        {/* Main line */}
        <path
          ref={pathRef}
          d={d}
          fill="none"
          stroke="hsl(217, 91%, 60%)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
