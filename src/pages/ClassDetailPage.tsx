import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Video, Radio } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useStudentClass } from '@/hooks/useStudentEnrollments';
import { useClassContent } from '@/hooks/useClassContent';
import { useClassSessions } from '@/hooks/useClassSessions';
import { useClassGuruLessons } from '@/hooks/useGuruLessons';
import type { ContentType } from '@/types/guru';

const TYPE_LABELS: Record<ContentType, string> = {
  lesson: 'Lesson',
  post: 'Post',
  blueprint: 'Blueprint',
};

const TYPE_BADGE: Record<ContentType, string> = {
  lesson: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  post: 'bg-muted text-muted-foreground border-border',
  blueprint: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

function relativeDate(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

function preview(body: string, n = 150): string {
  const stripped = body.replace(/\s+/g, ' ').trim();
  return stripped.length <= n ? stripped : stripped.slice(0, n) + '…';
}

export default function ClassDetailPage() {
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const { enrolled, isLoading: enrLoading } = useStudentClass(classId);
  const { content, isLoading: contentLoading } = useClassContent(classId);
  const { upcomingSessions, liveSession, isLoading: sessionsLoading } = useClassSessions(classId);
  const { data: guruLessons, isLoading: guruLessonsLoading } = useClassGuruLessons(classId);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filtered = useMemo(
    () =>
      content
        .filter((c) => !c.is_draft)
        .filter((c) => (typeFilter === 'all' ? true : c.content_type === typeFilter)),
    [content, typeFilter],
  );

  if (enrLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!enrLoading && !enrolled) return <Navigate to="/classes" replace />;

  return (
    <div className="p-6 space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 -ml-2"
        onClick={() => navigate('/classes')}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Classes
      </Button>

      {liveSession && (
        <Card className="border-green-500/40 bg-green-500/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Radio className="h-5 w-5 text-green-400 animate-pulse shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-400">Live Now</p>
                <p className="font-medium truncate">{liveSession.title}</p>
              </div>
            </div>
            <Button asChild className="bg-green-600 text-white hover:bg-green-500">
              <Link to={`/classes/${classId}/session/${liveSession.id}`}>Join Session →</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{enrolled.class.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Taught by {enrolled.guru.display_name}
        </p>
      </div>

      <Tabs value={typeFilter} onValueChange={setTypeFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="lesson">Lessons</TabsTrigger>
          <TabsTrigger value="post">Posts</TabsTrigger>
          <TabsTrigger value="blueprint">Blueprints</TabsTrigger>
        </TabsList>
      </Tabs>

      {contentLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No content yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Your Guru hasn't published anything in this category yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Card key={item.id} className="hover:border-primary/40 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className={TYPE_BADGE[item.content_type]}>
                    {TYPE_LABELS[item.content_type]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {relativeDate(item.published_at)}
                  </span>
                </div>
                <CardTitle className="text-base">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">{preview(item.body)}</p>
                <Link
                  to={`/classes/${classId}/content/${item.id}`}
                  className="mt-3 inline-flex items-center text-sm font-medium text-primary hover:underline"
                >
                  Read →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Lessons
        </h2>
        {guruLessonsLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : !guruLessons || guruLessons.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              No lessons published yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {guruLessons.map((lesson) => (
              <Card key={lesson.id}>
                <CardContent className="p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{lesson.title}</p>
                    {lesson.description && (
                      <p className="text-sm text-muted-foreground mt-1">{lesson.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {lesson.estimated_minutes ?? 10} min · {lesson.slides.length} slides
                    </p>
                  </div>
                  <Button asChild size="sm">
                    <Link to={`/classes/${classId}/lessons/${lesson.id}`}>Start Lesson</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Video className="h-4 w-4" />
          Upcoming Sessions
        </h2>
        {sessionsLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : upcomingSessions.filter((s) => s.status === 'scheduled').length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              No upcoming sessions scheduled.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {upcomingSessions
              .filter((s) => s.status === 'scheduled')
              .map((s) => (
                <Card key={s.id}>
                  <CardContent className="p-4">
                    <p className="font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(s.scheduled_at).toLocaleString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                    {s.description && (
                      <p className="text-sm text-muted-foreground mt-2">{s.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
