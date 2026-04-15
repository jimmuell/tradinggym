import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ExternalLink, BookOpen, Calculator, Globe, FileText, Video, Newspaper, Wrench } from "lucide-react";

const tools = [
  { name: "Position Size Calculator", description: "Calculate optimal position sizes based on account balance and risk tolerance.", icon: Calculator, tag: "Essential" },
  { name: "Economic Calendar", description: "Track upcoming market-moving events, FOMC meetings, and earnings reports.", icon: Globe, tag: "Daily Use" },
  { name: "Correlation Matrix", description: "View real-time correlations between major futures contracts and indices.", icon: Wrench, tag: "Analysis" },
  { name: "Tick Value Reference", description: "Quick reference for tick sizes, point values, and margin requirements across contracts.", icon: FileText, tag: "Reference" },
];

const readingList = [
  { title: "Trading in the Zone", author: "Mark Douglas", category: "Psychology", description: "Master the mental game of trading with disciplined thinking." },
  { title: "Market Wizards", author: "Jack Schwager", category: "Interviews", description: "Lessons from top traders on strategy, risk, and mindset." },
  { title: "Reminiscences of a Stock Operator", author: "Edwin Lefèvre", category: "Classic", description: "Timeless lessons on speculation and market behavior." },
  { title: "The Art and Science of Technical Analysis", author: "Adam Grimes", category: "Technical", description: "Evidence-based approach to chart patterns and price action." },
];

const videos = [
  { title: "Understanding Order Flow", duration: "18 min", category: "Order Flow", description: "How institutional orders move price and create opportunities." },
  { title: "Building a Trading Routine", duration: "12 min", category: "Habits", description: "Structure your day for consistent performance and review." },
  { title: "Reading the DOM", duration: "22 min", category: "Execution", description: "Depth of Market interpretation for precise entries and exits." },
  { title: "Backtesting Best Practices", duration: "15 min", category: "Strategy", description: "Avoid common pitfalls when validating your trading edge." },
];

const links = [
  { name: "CME Group — MES Specs", url: "#", description: "Official Micro E-mini S&P 500 contract specifications." },
  { name: "TradingView", url: "#", description: "Advanced charting and community-driven analysis platform." },
  { name: "Futures.io Forum", url: "#", description: "Active community for futures traders sharing strategies and insights." },
  { name: "Investopedia — Futures Guide", url: "#", description: "Comprehensive educational content on futures trading fundamentals." },
];

export default function Resources() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Resources</h1>
        <p className="text-muted-foreground">Tools, references, and curated materials to support your trading journey.</p>
      </div>

      <Tabs defaultValue="tools">
        <TabsList>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="reading">Reading List</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="links">Useful Links</TabsTrigger>
        </TabsList>

        <TabsContent value="tools" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <tool.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{tool.name}</CardTitle>
                  </div>
                  <Badge variant="secondary">{tool.tag}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{tool.description}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="reading" className="space-y-3">
          {readingList.map((book, i) => (
            <Card key={i}>
              <CardContent className="pt-4 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{book.title}</p>
                    <p className="text-xs text-muted-foreground">by {book.author} · {book.description}</p>
                  </div>
                </div>
                <Badge variant="outline">{book.category}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="videos" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videos.map((video, i) => (
            <Card key={i} className="cursor-pointer hover:bg-accent/50 transition-colors">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    <Video className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{video.title}</p>
                      <Badge variant="outline">{video.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{video.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">{video.duration}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="links" className="space-y-3">
          {links.map((link, i) => (
            <Card key={i}>
              <CardContent className="pt-4 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Newspaper className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{link.name}</p>
                    <p className="text-xs text-muted-foreground">{link.description}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost"><ExternalLink className="h-4 w-4" /></Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
