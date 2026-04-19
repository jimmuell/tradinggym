import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import HeroChartAnimation from "@/components/landing/HeroChartAnimation";
import {
  BarChart3,
  BookOpen,
  Bot,
  BrainCircuit,
  ChevronRight,
  LineChart,
  Play,
  Shield,
  Target,
  TrendingUp,
  Users,
  Zap,
  Check,
  ArrowRight,
} from "lucide-react";

const problems = [
  {
    icon: Target,
    title: "No System or Validation",
    desc: "Most traders lose because they trade on impulse, chasing setups without a repeatable process or any data to back them up.",
  },
  {
    icon: BrainCircuit,
    title: "Information Overload",
    desc: "Conflicting gurus, hundreds of indicators, and no way to know what actually works for you.",
  },
  {
    icon: Shield,
    title: "No Discipline",
    desc: "Without structured rules and accountability, even great strategies fail. Emotion replaces execution, and losses compound.",
  },
];

const steps = [
  {
    num: "01",
    icon: BookOpen,
    title: "Learn",
    desc: "Foundation modules teach candlestick patterns, market structure, and risk management.",
  },
  {
    num: "02",
    icon: Play,
    title: "Practice",
    desc: "Bar-by-bar simulator with real MES data and strategy blueprint overlay.",
  },
  {
    num: "03",
    icon: LineChart,
    title: "Validate",
    desc: "Backtest against 18 years of historical data with walk-forward analysis.",
  },
  {
    num: "04",
    icon: Zap,
    title: "Execute",
    desc: "Automate validated strategies with broker integration and risk controls.",
  },
];

const features = [
  {
    icon: LineChart,
    title: "Trading Simulator",
    desc: "Professional charting with MES futures replay, real-time P&L, and position tracking.",
  },
  {
    icon: Target,
    title: "Strategy Blueprints",
    desc: "Step-by-step execution checklists that enforce discipline and eliminate guesswork.",
  },
  {
    icon: Bot,
    title: "AI Strategy Ingestion",
    desc: "Upload a YouTube video or article and get a structured, testable strategy blueprint.",
  },
  {
    icon: BarChart3,
    title: "Backtesting Engine",
    desc: "Walk-forward validation, Monte Carlo simulation, and win-rate graduation gates.",
  },
  {
    icon: Users,
    title: "Guru Platform",
    desc: "Run your entire trading education business inside TradingGYM — classes, content, live sessions, and Stripe payouts.",
  },
  {
    icon: Shield,
    title: "Automated Execution",
    desc: "Expert-tier broker connection with position sizing, drawdown limits, and kill switches.",
  },
];

const tiers = [
  { name: "Foundation", focus: "Candle reading, structure, risk basics", gate: "Complete all modules" },
  { name: "Tier 1 — ORB", focus: "Opening Range Breakout strategy", gate: "55% win rate, 100+ trades" },
  { name: "Tier 2 — VWAP", focus: "VWAP Bounce / Rejection strategy", gate: "55% win rate, 100+ trades" },
  { name: "Tier 3 — AMD", focus: "Accumulation-Manipulation-Distribution", gate: "55% win rate, 100+ trades" },
];

const pricing = [
  {
    name: "Starter",
    price: "$0",
    period: "/forever",
    highlight: false,
    guru: false,
    features: [
      "Trading Simulator",
      "Foundation learning modules",
      "1-minute MES data",
      "Basic equity tracking",
    ],
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    highlight: true,
    guru: false,
    features: [
      "Everything in Starter",
      "All strategy tiers (ORB, VWAP, AMD)",
      "AI strategy ingestion",
      "Advanced analytics",
      "Multiple timeframes",
      "Backtesting (engine coming soon)",
    ],
  },
  {
    name: "Expert",
    price: "$49",
    period: "/mo",
    highlight: false,
    guru: false,
    features: [
      "Everything in Pro",
      "Automated execution",
      "Broker integration",
      "Risk controls & kill switch",
      "Monte Carlo validation",
      "Priority support",
      "30-day Guru trial included",
    ],
  },
  {
    name: "Guru",
    price: "$99",
    period: "/mo",
    highlight: false,
    guru: true,
    features: [
      "Everything in Expert",
      "Guru dashboard & class management",
      "Publish educational content",
      "Student progress tracking",
      "Live session broadcasting",
      "Stripe Connect payouts",
      "Keep 80% of student revenue",
    ],
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0b0e13] text-gray-100 overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0b0e13]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-3 rounded-lg -mx-2 px-2 py-1 hover:opacity-90 transition-opacity"
            aria-label="Back to top"
          >
            <img
              src="/favicon.png"
              alt="TradingGYM logo"
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg shrink-0"
            />
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold tracking-tight text-white leading-none">
                Trading<span className="text-blue-500">GYM</span>
              </span>
              <span className="text-[9px] tracking-[0.2em] uppercase font-medium text-center mt-1">
                <span className="text-blue-500">No Pain</span> <span className="text-white">No Gain</span>
              </span>
            </div>
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/5">
                Log In
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />
        <HeroChartAnimation />
        <div className="relative max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/15">
            MES Futures • Micro E-mini S&P 500
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Build Your Trading<br />
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Muscle Memory
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Like any champion, trading demands <span className="text-white font-medium">discipline</span>. Build structure, validate with data, and train until execution becomes instinct.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 text-base">
                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button
                size="lg"
                variant="outline"
                className="border-white/10 text-gray-300 hover:bg-white/5 hover:text-white px-8 h-12 text-base"
              >
                See How It Works
              </Button>
            </a>
          </div>
          <p className="text-xs text-gray-600 mt-6">
            For educational and simulation purposes only. Not financial advice. Paper trading only — no real money at risk.
          </p>
        </div>
      </section>

      {/* Guru Callout Banner */}
      <section className="py-8 px-6 bg-gradient-to-r from-blue-500/[0.03] via-blue-500/[0.06] to-blue-500/[0.03] border-y border-white/5">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Are you a trading educator?</p>
              <p className="text-gray-400 text-sm">
                Run your entire coaching business inside TradingGYM — classes, live sessions, and Stripe payouts.{" "}
                <span className="text-blue-400 font-medium">You keep 80%.</span>
              </p>
            </div>
          </div>
          <a href="#pricing" className="shrink-0">
            <Button
              variant="outline"
              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/50 whitespace-nowrap"
            >
              Start Teaching <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </div>
      </section>

      {/* Problem */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-medium text-blue-400 text-center mb-3 tracking-widest uppercase">The Problem</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Why 90% of traders fail</h2>
          <p className="text-gray-400 text-center max-w-xl mx-auto mb-16">
            It's not about intelligence. It's about <span className="text-white font-medium">discipline</span>.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {problems.map((p) => (
              <Card key={p.title} className="bg-[#131722] border-white/5 hover:border-white/10 transition-colors">
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-5">
                    <p.icon className="h-6 w-6 text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{p.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{p.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-gray-300 mt-12 text-lg font-medium">
            TradingGYM builds <span className="text-blue-400">discipline</span> — the one edge that separates winners from the 90%.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-[#0d1117]">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-medium text-blue-400 text-center mb-3 tracking-widest uppercase">How It Works</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Four steps to consistent trading</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <div key={s.title} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+40px)] right-[-40px] h-px bg-gradient-to-r from-blue-500/30 to-transparent" />
                )}
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-5">
                    <s.icon className="h-7 w-7 text-blue-400" />
                  </div>
                  <span className="text-xs font-mono text-blue-500/60 block mb-2">{s.num}</span>
                  <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-medium text-blue-400 text-center mb-3 tracking-widest uppercase">Features</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Everything you need to trade with an edge</h2>
          <p className="text-gray-400 text-center max-w-xl mx-auto mb-16">
            Built for MES futures traders who are serious about improvement.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="bg-[#131722] border-white/5 hover:border-blue-500/20 transition-all group">
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-5 group-hover:bg-blue-500/20 transition-colors">
                    <f.icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tier Progress */}
      <section className="py-24 px-6 bg-[#0d1117]">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-medium text-blue-400 text-center mb-3 tracking-widest uppercase">Progression</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Structured trader development</h2>
          <p className="text-gray-400 text-center max-w-xl mx-auto mb-16">
            Graduate through proven strategy tiers. Each level unlocks after demonstrating consistent performance.
          </p>
          <div className="space-y-4">
            {tiers.map((t, i) => (
              <div key={t.name} className="flex items-start gap-5 p-6 rounded-xl bg-[#131722] border border-white/5">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${i === 0 ? "bg-blue-500 text-white" : "bg-white/5 text-gray-400 border border-white/10"}`}
                >
                  {i === 0 ? <Check className="h-5 w-5" /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold">{t.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">{t.focus}</p>
                </div>
                <Badge variant="outline" className="hidden sm:flex border-white/10 text-gray-500 text-xs shrink-0">
                  Gate: {t.gate}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-medium text-blue-400 text-center mb-3 tracking-widest uppercase">Pricing</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Start free. Upgrade when ready.</h2>
          <p className="text-gray-400 text-center max-w-xl mx-auto mb-16">
            No credit card required. Practice with real data from day one.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricing.map((p) => (
              <Card
                key={p.name}
                className={`bg-[#131722] border transition-all ${
                  p.guru
                    ? "border-amber-500/40 shadow-lg shadow-amber-500/10"
                    : p.highlight
                    ? "border-blue-500/40 shadow-lg shadow-blue-500/10"
                    : "border-white/5"
                }`}
              >
                <CardContent className="p-8 flex flex-col h-full">
                  {p.guru && (
                    <Badge className="self-start bg-amber-500/10 text-amber-400 border-amber-500/20 mb-4">
                      For Educators
                    </Badge>
                  )}
                  {p.highlight && !p.guru && (
                    <Badge className="self-start bg-blue-500/10 text-blue-400 border-blue-500/20 mb-4">
                      Most Popular
                    </Badge>
                  )}
                  <h3 className="text-lg font-semibold text-white">{p.name}</h3>
                  <div className="mt-3 mb-6">
                    <span className="text-4xl font-bold text-white">{p.price}</span>
                    <span className="text-gray-500 text-sm">{p.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                        <Check
                          className={`h-4 w-4 shrink-0 mt-0.5 ${
                            p.guru ? "text-amber-400" : "text-blue-400"
                          }`}
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/auth">
                    <Button
                      className={`w-full ${
                        p.guru
                          ? "bg-amber-500 hover:bg-amber-600 text-white"
                          : p.highlight
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-white/5 hover:bg-white/10 text-gray-300"
                      }`}
                    >
                      {p.guru ? "Start Teaching" : "Get Started"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-[#0d1117]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to trade with discipline?</h2>
          <p className="text-gray-400 text-lg mb-8">Champions aren't born — they're built through discipline and repetition.</p>
          <Link to="/auth">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-10 h-12 text-base">
              Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/favicon.png"
              alt="TradingGYM logo"
              width={28}
              height={28}
              loading="lazy"
              className="h-7 w-7 rounded-md shrink-0"
            />
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white leading-none">
                Trading<span className="text-blue-500">GYM</span>
              </span>
              <span className="text-[9px] tracking-[0.2em] uppercase font-medium mt-1">
                <span className="text-blue-500">No Pain</span> <span className="text-white">No Gain</span>
              </span>
            </div>
          </div>
          <p className="text-gray-500 text-sm">Focused exclusively on MES (Micro E-mini S&P 500) futures.</p>
          <p className="text-gray-600 text-xs">© {new Date().getFullYear()} TradingGYM. All rights reserved.</p>
          <p className="text-gray-600 text-xs text-center w-full mt-2">
            TradingGYM is an independent educational platform. For simulation and educational purposes only. Not financial advice. Past performance does not guarantee future results.
          </p>
        </div>
      </footer>
    </div>
  );
}
