import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';



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
