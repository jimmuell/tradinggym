import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Lock, ArrowRight, LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface ModuleConfig {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  unlocked: boolean;
  lockHint: string;
  path: string;
}

export interface GateConfig {
  title: string;
  description: string;
  icon: LucideIcon;
  buttonText: string;
}

interface TierModuleGridProps {
  heading: string;
  subtitle: string;
  tagline?: string;
  modules: ModuleConfig[];
  gate: GateConfig;
  completedCount?: number;
  gateContent?: React.ReactNode;
}

export default function TierModuleGrid({
  heading,
  subtitle,
  tagline = 'No Pain — No Gain',
  modules,
  gate,
  completedCount = 0,
  gateContent,
}: TierModuleGridProps) {
  const navigate = useNavigate();

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{heading}</h1>
          <p className="text-muted-foreground mt-1">{subtitle}</p>
          <p className="text-xs text-muted-foreground/60 mt-1 italic">{tagline}</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {completedCount} of {modules.length} modules complete
            </span>
          </div>
          <Progress value={(completedCount / modules.length) * 100} className="h-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map((mod) => (
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

        {gateContent ?? (
          <Card className="opacity-70">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <gate.icon className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">{gate.title}</CardTitle>
                </div>
                <Badge variant="outline" className="text-muted-foreground gap-1">
                  <Lock className="h-3 w-3" />
                  Locked
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">{gate.description}</CardDescription>
              <Button size="sm" disabled>
                {gate.buttonText}
                <Lock className="h-3.5 w-3.5 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
