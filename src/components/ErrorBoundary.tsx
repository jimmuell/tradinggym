import { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('ErrorBoundary caught:', error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <Card className="border-red-500/40">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">
                {this.props.fallbackTitle ?? 'Something went wrong rendering this section.'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground break-words">
              {this.state.error.message}
            </p>
            <Button variant="outline" size="sm" onClick={this.reset}>
              Try again
            </Button>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}
