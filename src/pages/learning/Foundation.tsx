import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Lock, ArrowRight, BookOpen, TrendingUp, Clock, Shield, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MODULES = [
  {
    id: 'F1',
    title: 'Reading Candles',
    description: 'Learn to read what price is doing through candlestick anatomy and patterns.',
    icon: BookOpen,
    unlocked: true,
    lockHint: '',
    path: '/learning/foundation/f1',
  },
  {
    id: 'F2',
    title: 'Market Structure',
    description: 'Understand trends, support, resistance, and break of structure.',
    icon: TrendingUp,
    unlocked: false,
    lockHint: 'Complete F1 to unlock',
    path: '/learning/foundation/f2',
  },
  {
    id: 'F3',
    title: 'Sessions & Time',
    description: 'Know when to trade, when the market moves, and when to stay out.',
    icon: Clock,
    unlocked: false,
    lockHint: 'Complete F2 to unlock',
    path: '/learning/foundation/f3',
  },
  {
    id: 'F4',
    title: 'Risk Management',
    description: 'Position sizing, risk/reward ratio, and the math behind drawdown.',
    icon: Shield,
    unlocked: false,
    lockHint: 'Complete F3 to unlock',
    path: '/learning/foundation/f4',
  },
];

export default function FoundationLearning() {
  const navigate = useNavigate();
  const completedCount = 0; // hardcoded for now

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Foundation — Trading Literacy</h1>
          <p className="text-muted-foreground mt-1">Master the basics before your first trade.</p>
          <p className="text-xs text-muted-foreground/60 mt-1 italic">No Pain — No Gain</p>
        </div>

        {/* Overall Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">{completedCount} of 4 modules complete</span>
          </div>
          <Progress value={(completedCount / 4) * 100} className="h-2" />
        </div>

        {/* Module Cards — 2x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MODULES.map((mod) => (
            <Card
              key={mod.id}
              className={`transition-opacity ${
                mod.unlocked ? 'border-l-4 border-l-green-500' : 'opacity-70'
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <mod.icon className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-base">
                      {mod.id} · {mod.title}
                    </CardTitle>
                  </div>
                  {mod.unlocked ? (
                    <Badge variant="outline" className="text-green-500 border-green-500/30">
                      Available
                    </Badge>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-muted-foreground gap-1">
                          <Lock className="h-3 w-3" />
                          Locked
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{mod.lockHint}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">{mod.description}</CardDescription>
                <Button
                  size="sm"
                  disabled={!mod.unlocked}
                  className={mod.unlocked ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                  onClick={() => mod.unlocked && navigate(mod.path)}
                >
                  {mod.unlocked ? 'Start Module' : 'Locked'}
                  {mod.unlocked && <ArrowRight className="h-3.5 w-3.5 ml-1" />}
                  {!mod.unlocked && <Lock className="h-3.5 w-3.5 ml-1" />}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Graduation Gate */}
        <Card className="opacity-70">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Foundation Quiz</CardTitle>
              </div>
              <Badge variant="outline" className="text-muted-foreground gap-1">
                <Lock className="h-3 w-3" />
                Locked
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Pass 80% or higher to unlock the Simulator and begin Tier 1.
            </CardDescription>
            <p className="text-xs text-muted-foreground mb-4">Complete all 4 modules first.</p>
            <Button size="sm" disabled>
              Take Quiz
              <Lock className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
