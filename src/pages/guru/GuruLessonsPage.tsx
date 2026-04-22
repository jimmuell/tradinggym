import { Link, useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Clock, FileText } from 'lucide-react';
import GuruLayout from '@/layouts/GuruLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useGuruLessons } from '@/hooks/useGuruLessons';
import { useGuruClasses } from '@/hooks/useGuruClasses';

export default function GuruLessonsPage() {
  const navigate = useNavigate();
  const { data: lessons, isLoading } = useGuruLessons();
  const { classes } = useGuruClasses();

  const classMap = new Map(classes.map((c) => [c.id, c.name]));

  return (
    <GuruLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Lessons</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create and manage lessons for your students.
            </p>
          </div>
          <Button onClick={() => navigate('/guru/lessons/new')}>
            <Plus className="h-4 w-4 mr-1" />
            Create Lesson
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : !lessons || lessons.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No lessons yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                You haven't created any lessons yet. Create your first lesson to share with
                your students.
              </p>
              <Button className="mt-4" onClick={() => navigate('/guru/lessons/new')}>
                <Plus className="h-4 w-4 mr-1" />
                Create Lesson
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson) => (
              <Link key={lesson.id} to={`/guru/lessons/${lesson.id}`}>
                <Card className="hover:border-primary/40 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{lesson.title}</h3>
                          <Badge
                            variant="outline"
                            className={
                              lesson.is_published
                                ? 'bg-green-500/15 text-green-400 border-green-500/30'
                                : 'bg-muted text-muted-foreground border-border'
                            }
                          >
                            {lesson.is_published ? 'Published' : 'Draft'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {classMap.get(lesson.class_id ?? '') ?? 'Unassigned class'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {lesson.slides.length} slide{lesson.slides.length === 1 ? '' : 's'}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {lesson.estimated_minutes ?? 10} min
                          </span>
                          <span>
                            Created {new Date(lesson.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </GuruLayout>
  );
}
