import { useMemo, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, Plus, ChevronRight, Pencil } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';

const TIER_LABELS: Record<string, string> = {
  foundation: 'Foundation',
  tier1: 'Tier 1',
  tier2: 'Tier 2',
  tier3: 'Tier 3',
};

const MODULE_LABELS: Record<string, string> = {
  foundation: 'Foundation (Quiz)',
  tier1_orb: 'Tier 1 — Price Action (ORB)',
  tier2_vwap: 'Tier 2 — Confirmation (VWAP)',
  tier3_amd: 'Tier 3 — Institutional (AMD)',
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day} day${day === 1 ? '' : 's'} ago`;
  return `${Math.round(day / 30)} mo ago`;
}

type CourseRow = {
  id: string;
  title: string;
  description: string | null;
  tier_required: string;
  display_order: number;
  is_published: boolean | null;
  updated_at: string;
  chapters: Array<{ id: string; lessons: Array<{ id: string }> | null }> | null;
};

type QuizRow = {
  id: string;
  title: string;
  module: string;
  questions: unknown;
  pass_threshold: number;
  is_published: boolean | null;
  created_at: string;
};

function PublishedBadge({ published }: { published: boolean | null }) {
  return published ? (
    <Badge className="bg-green-500/15 text-green-500 hover:bg-green-500/20 border-green-500/30">Published</Badge>
  ) : (
    <Badge variant="secondary">Draft</Badge>
  );
}

function TableSkeleton() {
  return (
    <div className="p-6 space-y-2">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export default function AdminContentPage() {
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [moduleFilter, setModuleFilter] = useState<string>('all');

  const coursesQuery = useQuery({
    queryKey: ['admin-content-courses'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, description, tier_required, display_order, is_published, updated_at, chapters ( id, lessons:lessons ( id ) )')
        .eq('content_type', 'platform')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as CourseRow[];
    },
  });

  const quizzesQuery = useQuery({
    queryKey: ['admin-content-quizzes'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('id, title, module, questions, pass_threshold, is_published, created_at')
        .eq('content_type', 'platform')
        .order('module', { ascending: true });
      if (error) throw error;
      return (data ?? []) as QuizRow[];
    },
  });

  const filteredQuizzes = useMemo(() => {
    const rows = quizzesQuery.data ?? [];
    if (moduleFilter === 'all') return rows;
    return rows.filter((r) => r.module === moduleFilter);
  }, [quizzesQuery.data, moduleFilter]);

  if (roleLoading) {
    return <div className="p-6"><Skeleton className="h-32 w-full" /></div>;
  }
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <TooltipProvider>
      <div className="space-y-4 p-4 md:p-6">
        <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Back to Admin
        </Link>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" /> Content Manager
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage platform courses, chapters, lessons, and quizzes.
          </p>
        </div>

        <Tabs defaultValue="courses" className="space-y-4">
          <TabsList>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-3">
            <div className="flex justify-end">
              <Button asChild>
                <Link to="/admin/content/course/new">
                  <Plus className="h-4 w-4" /> New Course
                </Link>
              </Button>
            </div>
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                {coursesQuery.isLoading ? (
                  <TableSkeleton />
                ) : (coursesQuery.data ?? []).length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">
                    No courses found.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">Order</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead className="text-right">Chapters</TableHead>
                        <TableHead className="text-right">Lessons</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(coursesQuery.data ?? []).map((c) => {
                        const chapters = c.chapters ?? [];
                        const chapterCount = chapters.length;
                        const lessonCount = chapters.reduce(
                          (sum, ch) => sum + (ch.lessons?.length ?? 0), 0
                        );
                        return (
                          <TableRow key={c.id}>
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {c.display_order}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{c.title}</div>
                              {c.description && (
                                <div className="text-xs text-muted-foreground line-clamp-1 max-w-md">
                                  {c.description}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {TIER_LABELS[c.tier_required] ?? c.tier_required}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{chapterCount}</TableCell>
                            <TableCell className="text-right tabular-nums">{lessonCount}</TableCell>
                            <TableCell><PublishedBadge published={c.is_published} /></TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {relativeTime(c.updated_at)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="inline-flex items-center gap-1">
                                <Button asChild size="icon" variant="ghost" className="h-8 w-8" title="Edit course">
                                  <Link to={`/admin/content/course/${c.id}/edit`}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Link>
                                </Button>
                                <Button asChild size="sm" variant="outline">
                                  <Link to={`/admin/content/course/${c.id}`}>
                                    Manage <ChevronRight className="h-3 w-3" />
                                  </Link>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quizzes" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger className="w-full sm:w-[280px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quizzes</SelectItem>
                  <SelectItem value="foundation">Foundation</SelectItem>
                  <SelectItem value="tier1_orb">Tier 1 — Price Action</SelectItem>
                  <SelectItem value="tier2_vwap">Tier 2 — Confirmation</SelectItem>
                  <SelectItem value="tier3_amd">Tier 3 — Institutional</SelectItem>
                </SelectContent>
              </Select>
              <Button asChild>
                <Link to="/admin/content/quiz/new">
                  <Plus className="h-4 w-4" /> New Quiz
                </Link>
              </Button>
            </div>
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                {quizzesQuery.isLoading ? (
                  <TableSkeleton />
                ) : filteredQuizzes.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">
                    No platform quizzes found.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Module</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead className="text-right">Questions</TableHead>
                        <TableHead className="text-right">Pass</TableHead>
                        <TableHead>Published</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredQuizzes.map((q) => {
                        const qCount = Array.isArray(q.questions) ? q.questions.length : 0;
                        return (
                          <TableRow key={q.id}>
                            <TableCell>
                              <Badge variant="outline" title={MODULE_LABELS[q.module] ?? q.module}>
                                {q.module}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{q.title}</TableCell>
                            <TableCell className="text-right tabular-nums">{qCount}</TableCell>
                            <TableCell className="text-right tabular-nums">{q.pass_threshold}%</TableCell>
                            <TableCell><PublishedBadge published={q.is_published} /></TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {relativeTime(q.created_at)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button asChild size="sm" variant="outline">
                                <Link to={`/admin/content/quiz/${q.id}`}>Edit</Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
