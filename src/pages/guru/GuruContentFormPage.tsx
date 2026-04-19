import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import GuruLayout from '@/layouts/GuruLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { toast } from 'sonner';
import { useGuruProfile } from '@/hooks/useGuruData';
import { useGuruClasses } from '@/hooks/useGuruClasses';
import { useGuruContent } from '@/hooks/useGuruContent';
import type { ContentFormData, ContentType } from '@/types/guru';

const TYPE_HELP: Record<ContentType, string> = {
  lesson: 'Structured educational content with a clear learning objective',
  post: 'Updates, commentary, or quick insights for your class',
  blueprint: 'A step-by-step trading setup or strategy walkthrough',
};

export default function GuruContentFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const { data: guruProfile, isLoading: profileLoading } = useGuruProfile();
  const { classes, isLoading: classesLoading } = useGuruClasses();
  const {
    content,
    isLoading: contentLoading,
    createContent,
    updateContent,
    publishContent,
    unpublishContent,
  } = useGuruContent();

  const editing = useMemo(
    () => (isNew ? null : content.find((c) => c.id === id) ?? null),
    [content, id, isNew],
  );

  const [form, setForm] = useState<ContentFormData>({
    title: '',
    body: '',
    content_type: 'post',
    class_id: '',
    is_draft: true,
  });

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title,
        body: editing.body,
        content_type: editing.content_type,
        class_id: editing.class_id,
        is_draft: editing.is_draft,
      });
    } else if (isNew && classes.length > 0 && !form.class_id) {
      setForm((f) => ({ ...f, class_id: classes[0].id }));
    }
  }, [editing, isNew, classes, form.class_id]);

  if (profileLoading) {
    return (
      <GuruLayout>
        <Skeleton className="h-12 w-1/3 mb-8" />
        <Skeleton className="h-96 w-full" />
      </GuruLayout>
    );
  }

  if (!guruProfile || guruProfile.status !== 'active') {
    return <Navigate to="/guru" replace />;
  }

  if (!isNew && !contentLoading && !editing) {
    return <Navigate to="/guru/content" replace />;
  }

  const titleValid = form.title.trim().length >= 3;
  const bodyValid = form.body.trim().length >= 10;
  const classValid = !!form.class_id;
  const valid = titleValid && bodyValid && classValid;
  const submitting = createContent.isPending || updateContent.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    if (isNew) {
      createContent.mutate(form, {
        onSuccess: () => {
          toast.success('Content saved as draft');
          navigate('/guru/content');
        },
        onError: () => toast.error('Something went wrong. Please try again.'),
      });
    } else if (editing) {
      updateContent.mutate(
        { id: editing.id, data: form },
        {
          onSuccess: () => toast.success('Changes saved'),
          onError: () => toast.error('Something went wrong. Please try again.'),
        },
      );
    }
  };

  const togglePublish = () => {
    if (!editing) return;
    if (editing.is_draft) {
      publishContent.mutate(editing.id, {
        onSuccess: () => toast.success('Published'),
        onError: () => toast.error('Failed to publish'),
      });
    } else {
      unpublishContent.mutate(editing.id, {
        onSuccess: () => toast.success('Unpublished'),
        onError: () => toast.error('Failed to unpublish'),
      });
    }
  };

  const primaryLabel = isNew
    ? 'Save as Draft'
    : editing && !editing.is_draft
    ? 'Save Changes'
    : 'Save Changes';

  return (
    <GuruLayout>
      <div className="max-w-3xl mx-auto">
        <Link
          to="/guru/content"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Content
        </Link>

        <h1 className="text-2xl font-bold tracking-tight mb-6">
          {isNew ? 'New Content' : 'Edit Content'}
        </h1>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="A clear, descriptive title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="class">Class</Label>
                <Select
                  value={form.class_id}
                  onValueChange={(v) => setForm({ ...form, class_id: v })}
                  disabled={classesLoading || classes.length === 0}
                >
                  <SelectTrigger id="class">
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {classes.length === 0 && !classesLoading && (
                  <p className="text-xs text-muted-foreground">
                    Create a class first before publishing content.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Content type</Label>
                <ToggleGroup
                  type="single"
                  value={form.content_type}
                  onValueChange={(v) => v && setForm({ ...form, content_type: v as ContentType })}
                  className="justify-start"
                >
                  <ToggleGroupItem value="lesson">Lesson</ToggleGroupItem>
                  <ToggleGroupItem value="post">Post</ToggleGroupItem>
                  <ToggleGroupItem value="blueprint">Blueprint</ToggleGroupItem>
                </ToggleGroup>
                <p className="text-xs text-muted-foreground">{TYPE_HELP[form.content_type]}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Body</Label>
                <Textarea
                  id="body"
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Write your content here…"
                  className="min-h-[300px] font-mono text-sm resize-y"
                />
                <p className="text-xs text-muted-foreground">
                  Markdown formatting is supported — **bold**, *italic*, bullet lists.
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <Label htmlFor="is_draft" className="text-sm font-medium">
                    Save as draft
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Drafts are not visible to students.
                  </p>
                </div>
                <Switch
                  id="is_draft"
                  checked={form.is_draft}
                  onCheckedChange={(v) => setForm({ ...form, is_draft: v })}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => navigate('/guru/content')}>
                  Cancel
                </Button>
                {editing && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={togglePublish}
                    disabled={publishContent.isPending || unpublishContent.isPending}
                  >
                    {editing.is_draft ? 'Publish' : 'Unpublish'}
                  </Button>
                )}
                <Button type="submit" disabled={!valid || submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {primaryLabel}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </GuruLayout>
  );
}
