import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Circle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MODULES = [
  { id: 'F1', title: 'Reading Candles' },
  { id: 'F2', title: 'Market Structure' },
  { id: 'F3', title: 'Sessions & Time' },
  { id: 'F4', title: 'Risk Management' },
];

export function FoundationLearningPath() {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your Learning Path</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {MODULES.map((m) => (
            <li key={m.id} className="flex items-center gap-3 text-sm text-muted-foreground">
              <Circle className="h-4 w-4 shrink-0" />
              <span className="font-medium text-foreground">{m.id}</span>
              <span>· {m.title}</span>
            </li>
          ))}
        </ul>
        <Button
          className="mt-4 bg-green-600 hover:bg-green-700 text-white w-full"
          onClick={() => navigate('/learning/foundation')}
        >
          Begin F1
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

export function FoundationTradesEmpty() {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Trades</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-10 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Complete Foundation to unlock the Simulator and start trading.
        </p>
        <Button
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={() => navigate('/learning/foundation')}
        >
          Go to Learning
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
