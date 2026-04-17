import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import HelpSheet from '@/components/HelpSheet';
import { useStudentEnrollments } from '@/hooks/useStudentEnrollments';

export default function Coaching() {
  const { enrollments, isLoading } = useStudentEnrollments();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Coaching</h1>
          <p className="text-muted-foreground">
            Lessons, posts, and blueprints from your coaches.
          </p>
        </div>
        <HelpSheet pageName="Coaching" />
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
            <h3 className="text-lg font-semibold">No cohorts yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              You haven't joined any coaching cohorts. Ask your coach for an enrollment link.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {enrollments.map(({ cohort, guru, contentCount }) => (
            <Card key={cohort.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-base">{cohort.name}</CardTitle>
                <CardDescription>Taught by {guru.display_name}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  {contentCount} {contentCount === 1 ? 'piece' : 'pieces'} of content
                </div>
                <Link
                  to={`/coaching/${cohort.id}`}
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
    </div>
  );
}
