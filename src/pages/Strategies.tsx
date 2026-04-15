import HelpSheet from '@/components/HelpSheet';
import { useState } from 'react';
import { BookOpen, Plus, Lock, ChevronRight, Clock, BarChart3, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const builtInStrategies = [
  {
    id: 'orb',
    name: 'Opening Range Breakout (ORB)',
    description: 'Trade breakouts above/below the opening range established in the first 5–30 minutes of the session.',
    tier: 'Foundation',
    steps: 5,
    winRate: '58%',
    avgRR: '1.8:1',
    tags: ['Momentum', 'Intraday'],
    locked: false,
  },
  {
    id: 'amd',
    name: 'Accumulation / Manipulation / Distribution (AMD)',
    description: 'Identify smart money phases: accumulation zones, stop hunts (manipulation), and distribution moves.',
    tier: 'Foundation',
    steps: 6,
    winRate: '62%',
    avgRR: '2.1:1',
    tags: ['Smart Money', 'Intraday'],
    locked: false,
  },
  {
    id: 'vwap-reversion',
    name: 'VWAP Mean Reversion',
    description: 'Fade extended moves away from VWAP, targeting a return to the volume-weighted average price.',
    tier: 'Tier 1',
    steps: 4,
    winRate: '55%',
    avgRR: '1.5:1',
    tags: ['Mean Reversion', 'Intraday'],
    locked: true,
  },
  {
    id: 'trend-continuation',
    name: 'Trend Continuation Pullback',
    description: 'Enter on pullbacks within a confirmed trend using moving averages and structure breaks.',
    tier: 'Tier 2',
    steps: 5,
    winRate: '52%',
    avgRR: '2.5:1',
    tags: ['Trend Following', 'Swing'],
    locked: true,
  },
];

const tierColors: Record<string, string> = {
  Foundation: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Tier 1': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'Tier 2': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  'Tier 3': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

function StrategyCard({ strategy }: { strategy: typeof builtInStrategies[0] }) {
  return (
    <Card className={`group relative transition-all hover:shadow-md ${strategy.locked ? 'opacity-60' : 'hover:border-primary/30'}`}>
      {strategy.locked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/60 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Lock className="h-6 w-6" />
            <span className="text-sm font-medium">Unlocks at {strategy.tier}</span>
          </div>
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle className="text-base leading-snug">{strategy.name}</CardTitle>
            <CardDescription className="text-sm leading-relaxed">{strategy.description}</CardDescription>
          </div>
          <Badge variant="outline" className={`shrink-0 text-xs ${tierColors[strategy.tier] || ''}`}>
            {strategy.tier}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {strategy.steps} steps
          </span>
          <span className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5" />
            {strategy.winRate} win rate
          </span>
          <span className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            {strategy.avgRR} R:R
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {strategy.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
                {tag}
              </Badge>
            ))}
          </div>
          {!strategy.locked && (
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary">
              View Details <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Strategies() {
  const [activeTab, setActiveTab] = useState('built-in');

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Strategies
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse proven trading strategies or create your own playbook.
          </p>
        </div>
        <HelpSheet pageName="Strategies" />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="built-in">Built-in Templates</TabsTrigger>
          <TabsTrigger value="my-strategies">My Strategies</TabsTrigger>
        </TabsList>

        {/* Built-in Templates */}
        <TabsContent value="built-in" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {builtInStrategies.map((strategy) => (
              <StrategyCard key={strategy.id} strategy={strategy} />
            ))}
          </div>
        </TabsContent>

        {/* My Strategies */}
        <TabsContent value="my-strategies" className="mt-4">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Custom Strategies Yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                Create your own strategy playbook by defining entry rules, exit criteria, and risk parameters. Start from scratch or customize a built-in template.
              </p>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Strategy
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
