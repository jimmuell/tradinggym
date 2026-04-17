export default function HeroChartAnimation() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <style>{`
        @keyframes brandFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-12px) scale(1.015); }
        }
        @keyframes brandGlow {
          0%, 100% { opacity: 0.55; filter: blur(60px); }
          50% { opacity: 0.85; filter: blur(80px); }
        }
        @keyframes brandFadeIn {
          0% { opacity: 0; transform: scale(0.96); }
          100% { opacity: 0.18; transform: scale(1); }
        }
      `}</style>

      {/* Subtle grid */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.03]"
        preserveAspectRatio="none"
        viewBox="0 0 1200 600"
      >
        {[0.2, 0.4, 0.6, 0.8].map((r) => (
          <line key={`h${r}`} x1="0" y1={r * 600} x2="1200" y2={r * 600} stroke="white" strokeWidth="1" />
        ))}
        {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((r) => (
          <line key={`v${r}`} x1={r * 1200} y1="0" x2={r * 1200} y2="600" stroke="white" strokeWidth="1" />
        ))}
      </svg>

      {/* Glow halo behind brand image */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/30"
        style={{ top: '180px', animation: 'brandGlow 6s ease-in-out infinite' }}
      />

      {/* Brand mark — centered behind H1, corners masked off */}
      <img
        src="/favicon.png"
        alt=""
        className="absolute left-1/2 -translate-x-1/2 w-[480px] max-w-[55%] h-auto"
        style={{
          top: '120px',
          opacity: 0.22,
          animation:
            'brandFadeIn 1.2s ease-out forwards, brandFloat 7s ease-in-out 1.2s infinite',
          mixBlendMode: 'screen',
          WebkitMaskImage:
            'radial-gradient(circle at 50% 50%, black 42%, transparent 68%)',
          maskImage:
            'radial-gradient(circle at 50% 50%, black 42%, transparent 68%)',
        }}
      />
    </div>
  );
}
