import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Trash2, Loader2, FileText, ClipboardList, Layers } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useGuruProfile } from '@/hooks/useGuruData';
import { useGuruClasses } from '@/hooks/useGuruClasses';
import { useGuruContent } from '@/hooks/useGuruContent';
import { useGuruLessons, useDeleteGuruLesson } from '@/hooks/useGuruLessons';

type ItemKind = 'lesson' | 'post' | 'blueprint';

interface UnifiedItem {
  id: string;
  kind: ItemKind;
  title: string;
  class_id: string | null;
  is_draft: boolean;
  created_at: string;
  slide_count?: number;
}

const KIND_LABEL: Record<ItemKind, string> = {
  lesson: 'Lesson',
  post: 'Post',
  blueprint: 'Blueprint',
};

const KIND_BADGE: Record<ItemKind, string> = {
  lesson: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  post: 'bg-green-500/15 text-green-400 border-green-500/30',
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

interface PendingDelete {
  id: string;
  kind: ItemKind;
}

export default function GuruContentPage() {
  const navigate = useNavigate();
  const { data: guruProfile, isLoading: profileLoading } = useGuruProfile();
  const { classes, isLoading: classesLoading } = useGuruClasses();
  const {
    content,
    isLoading: contentLoading,
    deleteContent,
    publishContent,
    unpublishContent,
  } = useGuruContent();
  const { data: lessons = [], isLoading: lessonsLoading } = useGuruLessons();
  const deleteLesson = useDeleteGuruLesson();

  const [classFilter, setClassFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [confirmDelete, setConfirmDelete] = useState<PendingDelete | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const className = useMemo(() => {
    const m = new Map<string, string>();
    classes.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [classes]);

  const items = useMemo<UnifiedItem[]>(() => {
    const fromContent: UnifiedItem[] = content
      .filter((c) => c.content_type === 'post' || c.content_type === 'blueprint')
      .map((c) => ({
        id: c.id,
        kind: c.content_type as ItemKind,
        title: c.title,
        class_id: c.class_id,
        is_draft: c.is_draft,
        created_at: c.created_at,
      }));
    const fromLessons: UnifiedItem[] = lessons.map((l) => ({
      id: l.id,
      kind: 'lesson',
      title: l.title,
      class_id: l.class_id ?? null,
      is_draft: !l.is_published,
      created_at: l.created_at,
      slide_count: l.slides.length,
    }));
    return [...fromContent, ...fromLessons].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [content, lessons]);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (classFilter !== 'all' && it.class_id !== classFilter) return false;
      if (typeFilter !== 'all' && it.kind !== typeFilter) return false;
      return true;
    });
  }, [items, classFilter, typeFilter]);

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

  const isLoading = classesLoading || contentLoading || lessonsLoading;

  const editPath = (it: UnifiedItem) =>
    it.kind === 'lesson' ? `/guru/content/lessons/${it.id}` : `/guru/content/${it.id}`;

  const handleDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.kind === 'lesson') {
      deleteLesson.mutate(confirmDelete.id, {
        onSuccess: () => {
          toast.success('Lesson deleted');
          setConfirmDelete(null);
        },
        onError: () => toast.error('Failed to delete lesson'),
      });
    } else {
      deleteContent.mutate(confirmDelete.id, {
        onSuccess: () => {
          toast.success('Deleted');
          setConfirmDelete(null);
        },
        onError: () => toast.error('Failed to delete'),
      });
    }
  };

  const goCreate = (path: string) => {
    setPickerOpen(false);
    navigate(path);
  };

  return (
    <GuruLayout>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lessons, posts, and blueprints for your classes
          </p>
        </div>
        <Button onClick={() => setPickerOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Content
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Filter by class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {classes.map((c) => (
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
            <Button className="mt-4" onClick={() => setPickerOpen(true)}>
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
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={`${item.kind}-${item.id}`}>
                  <TableCell className="font-semibold">
                    <button
                      onClick={() => navigate(editPath(item))}
                      className="hover:underline text-left"
                    >
                      {item.title}
                    </button>
                    {item.kind === 'lesson' && typeof item.slide_count === 'number' && (
                      <div className="text-xs text-muted-foreground font-normal mt-0.5">
                        {item.slide_count} slide{item.slide_count === 1 ? '' : 's'}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={KIND_BADGE[item.kind]}>
                      {KIND_LABEL[item.kind]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.class_id ? className.get(item.class_id) ?? '—' : '—'}
                  </TableCell>
                  <TableCell>
                    {item.is_draft ? (
                      <Badge variant="outline" className="bg-muted text-muted-foreground">
                        Draft
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-green-500/15 text-green-400 border-green-500/30"
                      >
                        Published
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {fmtDate(item.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(editPath(item))}
                      >
                        Edit
                      </Button>
                      {item.kind !== 'lesson' &&
                        (item.is_draft ? (
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
                            {unpublishContent.isPending &&
                            unpublishContent.variables === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              'Unpublish'
                            )}
                          </Button>
                        ))}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setConfirmDelete({ id: item.id, kind: item.kind })}
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
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new content</DialogTitle>
            <DialogDescription>Choose what you'd like to create.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 mt-2">
            <button
              onClick={() => goCreate('/guru/content/lessons/new')}
              className="flex items-start gap-3 rounded-lg border border-border p-4 text-left hover:border-primary/50 hover:bg-muted/40 transition-colors"
            >
              <Layers className="h-5 w-5 mt-0.5 text-blue-400 shrink-0" />
              <div>
                <div className="font-semibold">📖 Lesson</div>
                <div className="text-sm text-muted-foreground">
                  Structured slides with optional quiz
                </div>
              </div>
            </button>
            <button
              onClick={() => goCreate('/guru/content/new?type=post')}
              className="flex items-start gap-3 rounded-lg border border-border p-4 text-left hover:border-primary/50 hover:bg-muted/40 transition-colors"
            >
              <FileText className="h-5 w-5 mt-0.5 text-green-400 shrink-0" />
              <div>
                <div className="font-semibold">📝 Post</div>
                <div className="text-sm text-muted-foreground">
                  Announcement, update, or article
                </div>
              </div>
            </button>
            <button
              onClick={() => goCreate('/guru/content/new?type=blueprint')}
              className="flex items-start gap-3 rounded-lg border border-border p-4 text-left hover:border-primary/50 hover:bg-muted/40 transition-colors"
            >
              <ClipboardList className="h-5 w-5 mt-0.5 text-amber-400 shrink-0" />
              <div>
                <div className="font-semibold">📋 Blueprint</div>
                <div className="text-sm text-muted-foreground">
                  Trading strategy template
                </div>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </GuruLayout>
  );
}
