import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import HelpSheet from '@/components/HelpSheet';
import { useStudentEnrollments } from '@/hooks/useStudentEnrollments';
import { useTier } from '@/contexts/TierContext';

export default function ClassesPage() {
  const { enrollments, isLoading } = useStudentEnrollments();
  const { planState, loading: tierLoading } = useTier();
  // Treat plan as "not starter" until resolved, so we never flash the
  // "Upgrade to Pro" empty-state copy at a paying customer on cold load.
  const starter = !tierLoading && planState === 'starter';

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Classes</h1>
          <p className="text-muted-foreground">
            Lessons, posts, and blueprints from your Gurus.
          </p>
        </div>
        <HelpSheet pageName="Classes" />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : enrollments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <GraduationCap className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No classes yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {planState === 'starter'
                ? 'Upgrade to Pro or Expert to enroll with a Guru and access their classes.'
                : "You haven't joined any classes. Browse the Guru directory to find a coach."}
            </p>
            <Button asChild className="mt-4">
              <Link to={planState === 'starter' ? '/pricing' : '/gurus'}>
                {planState === 'starter' ? 'View Plans' : 'Find a Guru'}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {enrollments.map(({ class: classItem, guru, contentCount }) => (
            <Card key={classItem.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-base">{classItem.name}</CardTitle>
                <CardDescription>Taught by {guru.display_name?.trim() || 'Unknown Instructor'}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  {contentCount} {contentCount === 1 ? 'piece' : 'pieces'} of content
                </div>
                <Link
                  to={`/classes/${classItem.id}`}
                  className="mt-4 inline-flex items-center text-sm font-medium text-primary hover:underline"
                >
                  View Content
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
