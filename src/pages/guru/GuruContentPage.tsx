import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Trash2, Loader2 } from 'lucide-react';
import GuruLayout from '@/layouts/GuruLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { toast } from 'sonner';
import { useGuruProfile } from '@/hooks/useGuruData';
import { useGuruCohorts } from '@/hooks/useGuruCohorts';
import { useGuruContent } from '@/hooks/useGuruContent';
import type { ContentType, GuruContent } from '@/types/guru';

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
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function GuruContentPage() {
  const navigate = useNavigate();
  const { data: guruProfile, isLoading: profileLoading } = useGuruProfile();
  const { cohorts, isLoading: cohortsLoading } = useGuruCohorts();
  const {
    content,
    isLoading: contentLoading,
    deleteContent,
    publishContent,
    unpublishContent,
  } = useGuruContent();

  const [cohortFilter, setCohortFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [confirmDelete, setConfirmDelete] = useState<GuruContent | null>(null);

  const cohortName = useMemo(() => {
    const m = new Map<string, string>();
    cohorts.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [cohorts]);

  const filtered = useMemo(() => {
    return content.filter((c) => {
      if (cohortFilter !== 'all' && c.cohort_id !== cohortFilter) return false;
      if (typeFilter !== 'all' && c.content_type !== typeFilter) return false;
      return true;
    });
  }, [content, cohortFilter, typeFilter]);

  if (profileLoading) {
    return (
      <GuruLayout>
        <Skeleton className="h-12 w-1/3 mb-8" />
        <Skeleton className="h-64 w-full" />
      </GuruLayout>
    );
  }

  if (!guruProfile || guruProfile.status !== 'active') {
    return <Navigate to="/guru" replace />;
  }

  const isLoading = cohortsLoading || contentLoading;

  return (
    <GuruLayout>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lessons, posts, and blueprints for your cohorts
          </p>
        </div>
        <Button onClick={() => navigate('/guru/content/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Content
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Select value={cohortFilter} onValueChange={setCohortFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Filter by cohort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cohorts</SelectItem>
            {cohorts.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Tabs value={typeFilter} onValueChange={setTypeFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="lesson">Lesson</TabsTrigger>
            <TabsTrigger value="post">Post</TabsTrigger>
            <TabsTrigger value="blueprint">Blueprint</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No content yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Create your first lesson or post to share with your students.
            </p>
            <Button className="mt-4" onClick={() => navigate('/guru/content/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Content
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Cohort</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-semibold">
                    <Link to={`/guru/content/${item.id}`} className="hover:underline">
                      {item.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={TYPE_BADGE[item.content_type]}>
                      {TYPE_LABELS[item.content_type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {cohortName.get(item.cohort_id) ?? '—'}
                  </TableCell>
                  <TableCell>
                    {item.is_draft ? (
                      <Badge variant="outline" className="bg-muted text-muted-foreground">
                        Draft
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-500/15 text-green-400 border-green-500/30">
                        Published
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {fmtDate(item.published_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/guru/content/${item.id}`)}
                      >
                        Edit
                      </Button>
                      {item.is_draft ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-green-500/40 text-green-400 hover:bg-green-500/10"
                          disabled={publishContent.isPending}
                          onClick={() =>
                            publishContent.mutate(item.id, {
                              onSuccess: () => toast.success('Published'),
                              onError: () => toast.error('Failed to publish'),
                            })
                          }
                        >
                          {publishContent.isPending && publishContent.variables === item.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Publish'
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={unpublishContent.isPending}
                          onClick={() =>
                            unpublishContent.mutate(item.id, {
                              onSuccess: () => toast.success('Unpublished'),
                              onError: () => toast.error('Failed to unpublish'),
                            })
                          }
                        >
                          {unpublishContent.isPending && unpublishContent.variables === item.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Unpublish'
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setConfirmDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this content?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirmDelete) return;
                deleteContent.mutate(confirmDelete.id, {
                  onSuccess: () => {
                    toast.success('Deleted');
                    setConfirmDelete(null);
                  },
                  onError: () => toast.error('Failed to delete'),
                });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GuruLayout>
  );
}
