import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useGuruCohorts } from '@/hooks/useGuruCohorts';
import type { Cohort } from '@/types/guru';

const STATUS_STYLES: Record<Cohort['status'], string> = {
  draft: 'bg-muted text-muted-foreground border border-border',
  active: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  closed: 'bg-destructive/15 text-destructive border border-destructive/30',
};

export default function CohortCard({ cohort }: { cohort: Cohort }) {
  const { deleteCohort } = useGuruCohorts();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const onDelete = async () => {
    try {
      await deleteCohort.mutateAsync(cohort.id);
      toast.success('Class deleted');
      setConfirmOpen(false);
    } catch {
      toast.error('Could not delete class');
    }
  };

  const priceLabel =
    cohort.price_monthly === 0 ? 'Free' : `$${cohort.price_monthly.toFixed(2)}/mo`;
  const maxLabel =
    cohort.max_students == null ? 'Unlimited' : String(cohort.max_students);

  return (
    <>
      <Card className="flex flex-col">
        <CardContent className="flex flex-1 flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold leading-tight">{cohort.name}</h3>
            <Badge className={`${STATUS_STYLES[cohort.status]} capitalize`}>
              {cohort.status}
            </Badge>
          </div>

          <p className="line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
            {cohort.description || 'No description'}
          </p>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <div className="text-muted-foreground">Price</div>
              <div className="font-medium text-foreground">{priceLabel}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Win-rate gate</div>
              <div className="font-medium text-foreground">{cohort.win_rate_gate}%</div>
            </div>
            <div>
              <div className="text-muted-foreground">Max students</div>
              <div className="font-medium text-foreground">{maxLabel}</div>
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
            <Button asChild variant="outline" size="sm">
              <Link to={`/guru/cohorts/${cohort.id}`}>Edit</Link>
            </Button>
            {cohort.status === 'draft' && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => setConfirmOpen(true)}
                aria-label="Delete class"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete class?</AlertDialogTitle>
            <AlertDialogDescription>
              This class is a draft and has no students. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCohort.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onDelete();
              }}
              disabled={deleteCohort.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCohort.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
