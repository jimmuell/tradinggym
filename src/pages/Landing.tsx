import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import HeroChartAnimation from "@/components/landing/HeroChartAnimation";
import {
  BarChart3,
  Brain,
  Sparkles,
  Clapperboard,
  FileText,
  Repeat,
  LineChart,
  Play,
  Target,
  Users,
  Zap,
  Check,
  ArrowRight,
} from "lucide-react";

const spotlight = [
  {
    icon: Sparkles,
    title: "AI Strategy Builder",
    desc: "Paste any trading idea — a TikTok transcript, YouTube breakdown, or your own rules. AI extracts a structured, tradeable strategy in seconds.",
  },
  {
    icon: Clapperboard,
    title: "Strategy Playback",
    desc: "Watch your strategy execute step-by-step on real MES futures data. See the setup, confirmation, entry, and exit — then try it yourself.",
  },
  {
    icon: BarChart3,
    title: "Data-Driven Validation",
    desc: "Track win rates, R-multiples, and performance across every strategy. Know what works before you risk real capital.",
  },
];

const howItWorks = [
  {
    num: "01",
    icon: FileText,
    title: "Describe Your Strategy",
    desc: "Paste a video transcript, type your rules, or describe your setup in plain English.",
  },
  {
    num: "02",
    icon: Brain,
    title: "AI Extracts It",
    desc: "AI identifies indicators, entry method, exit rules, risk parameters, and direction bias — structured and ready to save.",
  },
  {
    num: "03",
    icon: Play,
    title: "Watch the Demo",
    desc: "See your strategy play out step-by-step on real MES data with annotations showing setup, confirmation, entry, and exit.",
  },
  {
    num: "04",
    icon: Repeat,
    title: "Practice Until You Own It",
    desc: "Switch to the Simulator and trade the same chart yourself. Repeat until the pattern is second nature.",
  },
];

const features = [
  {
    icon: LineChart,
    title: "Trading Simulator",
    desc: "Replay real MES futures data bar-by-bar. Place trades, set stops and targets, fast-forward time. Zero risk, maximum reps.",
  },
  {
    icon: Brain,
    title: "AI Strategy Ingestion",
    desc: "Paste a YouTube transcript, TikTok breakdown, or describe your setup in plain English. AI extracts indicators, entry rules, exit rules, and risk parameters into a structured strategy.",
  },
  {
    icon: Play,
    title: "Strategy Playback Trainer",
    desc: "Watch your saved strategy play out step-by-step on a real chart — setup, confirmation, entry, exit — with annotations, labels, and arrows. Then click 'Try It Yourself' to practice.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Performance",
    desc: "Track win rate, R-multiples, equity curves, and per-strategy performance. Identify what's working and what needs adjustment with data, not gut feel.",
  },
  {
    icon: Users,
    title: "Guru Platform",
    desc: "Run your trading education business inside TradingGYM. Create classes, publish content, host live sessions, track student progress, and earn 20–50% of student subscriptions via Stripe Connect.",
  },
  {
    icon: Zap,
    title: "Live Session Companion",
    desc: "Launch a compact trading companion window alongside your broker. Session-aware with resume capability. Your strategy checklist and execution reference in one click.",
  },
];

const stats = [
  { value: "18+", label: "Historical Data (Years)" },
  { value: "5", label: "Strategy Phases" },
  { value: "20+", label: "Database Tables" },
  { value: "$0", label: "Risk While Learning" },
];

const pricing: Array<{
  name: string;
  planKey: string | null;
  price: string;
  period: string;
  highlight: boolean;
  badge: string | null;
  features: string[];
  callout?: string;
}> = [
  {
    name: "Free",
    planKey: null,
    price: "$0",
    period: "/forever",
    highlight: false,
    badge: null,
    features: [
      "Trading Simulator",
      "Foundation learning modules",
      "1 saved strategy",
      "Basic equity tracking",
      "MES 5-minute data",
    ],
  },
  {
    name: "Starter",
    planKey: "starter",
    price: "$9",
    period: "/mo",
    highlight: false,
    badge: null,
    features: [
      "Everything in Free",
      "3 saved strategies",
      "ORB Blueprint checklist",
      "Strategy history & badges",
      "Basic analytics",
    ],
  },
  {
    name: "Pro",
    planKey: "pro",
    price: "$29",
    period: "/mo",
    highlight: true,
    badge: "Most Popular",
    features: [
      "Everything in Starter",
      "Unlimited strategies",
      "AI Strategy Ingestion",
      "Strategy Playback Trainer",
      "Advanced analytics & R-multiples",
      "All entry methods & filters",
      "Trailing stop management",
      "Multiple timeframes",
      "Live Session companion",
    ],
  },
  {
    name: "Expert",
    planKey: "expert",
    price: "$49",
    period: "/mo",
    highlight: false,
    badge: null,
    features: [
      "Everything in Pro",
      "Automated execution (coming soon)",
      "Broker integration (coming soon)",
      "Risk controls & kill switch (coming soon)",
      "Monte Carlo validation (coming soon)",
      "Priority support",
    ],
  },
  {
    name: "Guru",
    planKey: "guru",
    price: "$99",
    period: "/mo",
    highlight: false,
    badge: "For Coaches",
    features: [
      "Everything in Pro",
      "Guru dashboard",
      "Cohort & student management",
      "Publish educational content",
      "Student progress tracking",
      "Live session broadcasting",
      "Stripe Connect payouts",
    ],
    callout: "Earn 20–50% of student subscriptions",
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
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">Start Free</Button>
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
            MES • MNQ • ES • NQ • YM Futures
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Build&nbsp;Test&nbsp;Master
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Paste any trading strategy — from a TikTok, YouTube video, or your own rules — and watch AI turn it into a structured plan. Then see it play out step-by-step on real market data. <span className="text-white font-medium">Practice until you own it.</span>
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 text-base">
                Start Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
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

      {/* Feature Spotlight Strip */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {spotlight.map((s, i) => (
              <Card
                key={s.title}
                className="bg-[#131722] border-white/5 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10 transition-all group animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <s.icon className="h-7 w-7 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 border-y border-white/5 bg-[#0d1117]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                {s.value}
              </div>
              <p className="text-gray-500 text-xs uppercase tracking-widest mt-2">{s.label}</p>
            </div>
          ))}
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

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-[#0d1117]">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-medium text-blue-400 text-center mb-3 tracking-widest uppercase">How It Works</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">From idea to instinct in four steps</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {howItWorks.map((s, i) => (
              <div
                key={s.title}
                className="relative animate-fade-in"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                {i < howItWorks.length - 1 && (
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

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm font-medium text-blue-400 text-center mb-3 tracking-widest uppercase">Pricing</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Start free. Upgrade when ready.</h2>
          <p className="text-gray-400 text-center max-w-xl mx-auto mb-16">
            No credit card required. Practice with real data from day one.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-5">
            {pricing.map((p) => {
              const isGuru = p.name === "Guru";
              return (
                <div key={p.name} className="relative pt-4">
                  {p.badge && (
                    <div
                      className={`absolute top-0 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest ${
                        isGuru
                          ? "bg-amber-500 text-black"
                          : p.highlight
                          ? "bg-blue-500 text-white"
                          : "bg-white/10 text-gray-300"
                      }`}
                    >
                      {p.badge}
                    </div>
                  )}
                  <Card
                    className={`bg-[#131722] border transition-all h-full ${
                      isGuru
                        ? "border-amber-500/40 shadow-lg shadow-amber-500/10"
                        : p.highlight
                        ? "border-blue-500/50 shadow-xl shadow-blue-500/20 ring-1 ring-blue-500/30"
                        : "border-white/5"
                    }`}
                  >
                    <CardContent className="p-6 flex flex-col h-full">
                      <h3 className="text-lg font-semibold text-white">{p.name}</h3>
                      <div className="mt-3 mb-6">
                        <span className="text-4xl font-bold text-white">{p.price}</span>
                        <span className="text-gray-500 text-sm">{p.period}</span>
                      </div>
                      <ul className="space-y-2.5 mb-6 flex-1">
                        {p.features.map((f) => {
                          const isComingSoon = f.includes("(coming soon)");
                          const cleanText = isComingSoon ? f.replace(" (coming soon)", "") : f;
                          return (
                            <li
                              key={f}
                              className={`flex items-start gap-2 text-sm ${
                                isComingSoon ? "text-gray-500" : "text-gray-300"
                              }`}
                            >
                              <Check
                                className={`h-4 w-4 shrink-0 mt-0.5 ${
                                  isComingSoon
                                    ? "text-gray-600"
                                    : isGuru
                                    ? "text-amber-400"
                                    : "text-blue-400"
                                }`}
                              />
                              <span className="flex-1">
                                {cleanText}
                                {isComingSoon && (
                                  <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-white/5 text-gray-400 border border-white/10">
                                    Soon
                                  </span>
                                )}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                      {p.callout && (
                        <div className="mb-4 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium text-center">
                          {p.callout}
                        </div>
                      )}
                      <Link to={p.planKey ? `/auth?plan=${p.planKey}` : "/auth"}>
                        <Button
                          className={`w-full ${
                            isGuru
                              ? "bg-amber-500 hover:bg-amber-600 text-black"
                              : p.highlight
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10"
                          }`}
                        >
                          Get Started
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Guru CTA Band */}
      <section className="py-20 px-6 bg-gradient-to-r from-amber-500/[0.04] via-amber-500/[0.08] to-amber-500/[0.04] border-y border-amber-500/20 animate-fade-in">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 items-center justify-center mb-6">
            <Users className="h-7 w-7 text-amber-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Run Your Trading Education Business</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            Create classes, publish content, host live sessions, and earn revenue — all inside TradingGYM. No separate website needed.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <span className="px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-medium">
              Earn 20–50% of student subscriptions
            </span>
            <span className="px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-medium">
              Stripe Connect payouts
            </span>
            <span className="px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-medium">
              Student progress tracking
            </span>
          </div>
          <Link to="/auth">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black px-10 h-12 text-base font-semibold">
              Start Teaching <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Logo + tagline */}
            <div className="flex items-center gap-2.5 justify-center md:justify-start">
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

            {/* Links */}
            <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <span className="text-gray-700">·</span>
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            </div>

            {/* Copyright */}
            <p className="text-gray-600 text-xs text-center md:text-right">
              © {new Date().getFullYear()} TradingGYM
            </p>
          </div>

          {/* Disclaimers */}
          <div className="mt-10 pt-6 border-t border-white/5 space-y-2 text-center">
            <p className="text-gray-500 text-xs">
              Focused exclusively on MES (Micro E-mini S&P 500) futures.
            </p>
            <p className="text-gray-600 text-xs max-w-3xl mx-auto leading-relaxed">
              TradingGYM is an independent educational platform. For simulation and educational purposes only. Not financial advice. Past performance does not guarantee future results.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
