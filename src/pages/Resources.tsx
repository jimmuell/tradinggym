import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import HelpSheet from "@/components/HelpSheet";

type ResourceItem = {
  title: string;
  byline?: string;
  description: string;
  url: string;
};

type ResourceSection = {
  heading: string;
  subtitle: string;
  items: ResourceItem[];
  cols: "3" | "2";
};

const sections: ResourceSection[] = [
  {
    heading: "📚 Books",
    subtitle: "Essential reading for serious traders.",
    cols: "3",
    items: [
      { title: "Trading in the Zone", byline: "Mark Douglas", description: "The definitive book on trading psychology and discipline.", url: "https://www.amazon.com/dp/0735201447" },
      { title: "The Disciplined Trader", byline: "Mark Douglas", description: "Build the mindset needed to execute a trading plan consistently.", url: "https://www.amazon.com/dp/0132157578" },
      { title: "Market Wizards", byline: "Jack Schwager", description: "Interviews with the world's greatest traders — timeless lessons.", url: "https://www.amazon.com/dp/0887306101" },
      { title: "How to Day Trade for a Living", byline: "Andrew Aziz", description: "Practical entry-level guide to day trading setups and risk management.", url: "https://www.amazon.com/dp/1535585951" },
    ],
  },
  {
    heading: "🎥 YouTube Channels",
    subtitle: "Free education from active traders.",
    cols: "3",
    items: [
      { title: "SMB Capital", byline: "SMB Capital", description: "Professional trading firm sharing live trade reviews, psychology, and setups.", url: "https://www.youtube.com/@smbcapital" },
      { title: "Warrior Trading", byline: "Ross Cameron", description: "Day trading education with a focus on momentum and risk management.", url: "https://www.youtube.com/@WarriorTrading" },
      { title: "The Chart Guys", byline: "The Chart Guys", description: "Technical analysis, chart reading, and market structure from experienced traders.", url: "https://www.youtube.com/@TheChartGuys" },
      { title: "ICT Mentorship", byline: "The Inner Circle Trader", description: "Deep institutional concepts — AMD model, fair value gaps, liquidity. Tier 3 prerequisite.", url: "https://www.youtube.com/@InnerCircleTrader" },
    ],
  },
  {
    heading: "🛠️ Tools",
    subtitle: "The platforms serious futures traders rely on.",
    cols: "2",
    items: [
      { title: "TradingView", description: "Industry-standard charting platform. Use for chart analysis, replay, and strategy building.", url: "https://www.tradingview.com" },
      { title: "AMP Futures", description: "Low-cost futures broker with MES support and excellent platform options.", url: "https://www.ampfutures.com" },
      { title: "Tradovate", description: "Commission-free futures trading platform with a clean interface and replay mode.", url: "https://www.tradovate.com" },
      { title: "Quantified Strategies", description: "Backtested strategy research and trading system ideas for retail traders.", url: "https://www.quantifiedstrategies.com" },
    ],
  },
  {
    heading: "💬 Communities",
    subtitle: "Learn alongside other traders who are doing the work.",
    cols: "2",
    items: [
      { title: "r/Daytrading", description: "Reddit community for day traders — strategy discussion, journaling, accountability.", url: "https://www.reddit.com/r/Daytrading" },
      { title: "r/FuturesTrading", description: "Reddit community focused on futures markets — MES, ES, NQ discussion.", url: "https://www.reddit.com/r/FuturesTrading" },
      { title: "Elite Trader Forums", description: "Long-running professional trading forum covering futures, systems, and psychology.", url: "https://www.elitetrader.com/et" },
      { title: "Trade2Win", description: "Active UK-based trading community with futures and technical analysis discussion.", url: "https://www.trade2win.com" },
    ],
  },
];

const gridClass = (cols: "3" | "2") =>
  cols === "3"
    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    : "grid grid-cols-1 md:grid-cols-2 gap-4";

export default function Resources() {
  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Resources</h1>
          <p className="text-muted-foreground">
            Curated tools, books, and communities to accelerate your trading education.
          </p>
        </div>
        <HelpSheet pageName="Resources" />
      </div>

      {sections.map((section) => (
        <section key={section.heading} className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{section.heading}</h2>
            <p className="text-sm text-muted-foreground">{section.subtitle}</p>
          </div>

          <div className={gridClass(section.cols)}>
            {section.items.map((item) => (
              <a
                key={item.url}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <Card className="h-full hover:border-primary/50 transition-colors">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        {item.byline && (
                          <p className="text-xs text-muted-foreground">{item.byline}</p>
                        )}
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
