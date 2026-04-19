import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudentCohort } from '@/hooks/useStudentEnrollments';
import { useCohortContent } from '@/hooks/useCohortContent';
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

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ClassContentPage() {
  const { classId, contentId } = useParams<{ classId: string; contentId: string }>();
  const { enrolled, isLoading: enrLoading } = useStudentCohort(classId);
  const { content, isLoading: contentLoading } = useCohortContent(classId);

  if (enrLoading || contentLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!enrolled) return <Navigate to="/classes" replace />;

  const item = content.find((c) => c.id === contentId);
  if (!item || item.is_draft) {
    return <Navigate to={`/classes/${classId}`} replace />;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Link
        to={`/classes/${classId}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to {enrolled.cohort.name}
      </Link>

      <div className="space-y-3">
        <Badge variant="outline" className={TYPE_BADGE[item.content_type]}>
          {TYPE_LABELS[item.content_type]}
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">{item.title}</h1>
        <p className="text-sm text-muted-foreground">
          Published {fmtDate(item.published_at)}
        </p>
      </div>

      <article className="prose prose-invert max-w-none">
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {item.body}
        </div>
      </article>
    </div>
  );
}
