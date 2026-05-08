import { useMemo, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, Plus } from 'lucide-react';
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
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';

const MODULE_LABELS: Record<string, string> = {
  f1_candles: 'F1 — Reading Candles',
  f2_structure: 'F2 — Market Structure',
  f3_sessions: 'F3 — Sessions & Time',
  f4_risk: 'F4 — Risk Management',
  f5_plan: 'F5 — Your Trading Plan',
  foundation: 'Foundation (Quiz)',
  tier1_orb: 'Tier 1 — Price Action (ORB)',
  tier2_vwap: 'Tier 2 — Confirmation (VWAP)',
  tier3_amd: 'Tier 3 — Institutional (AMD)',
};

function getModuleLabel(module: string): string {
  return MODULE_LABELS[module] ?? module;
}

function getShortLabel(module: string): string {
  if (module.startsWith('f') && module.includes('_')) return module.split('_')[0].toUpperCase();
  if (module === 'foundation') return 'Foundation';
  if (module === 'tier1_orb') return 'Tier 1';
  if (module === 'tier2_vwap') return 'Tier 2';
  if (module === 'tier3_amd') return 'Tier 3';
  return module;
}

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
  const mo = Math.round(day / 30);
  if (mo < 12) return `${mo} mo ago`;
  return `${Math.round(mo / 12)} yr ago`;
}

const MODULE_FILTERS = [
  { value: 'all', label: 'All Modules' },
  { value: 'foundation', label: 'Foundation (F1–F5)' },
  { value: 'tier1_orb', label: 'Tier 1 — Price Action' },
  { value: 'tier2_vwap', label: 'Tier 2 — Confirmation' },
  { value: 'tier3_amd', label: 'Tier 3 — Institutional' },
];

type LessonRow = {
  id: string;
  title: string;
  module: string;
  module_order: number;
  slides: unknown;
  estimated_minutes: number | null;
  is_published: boolean | null;
  updated_at: string;
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

function NewContentButton({ label, to }: { label: string; to: string }) {
  return (
    <Button asChild>
      <Link to={to}>
        <Plus className="h-4 w-4" /> {label}
      </Link>
    </Button>
  );
}

function TableSkeleton() {
  return (
    <div className="p-6 space-y-2">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export default function AdminContentPage() {
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [moduleFilter, setModuleFilter] = useState<string>('all');

  const lessonsQuery = useQuery({
    queryKey: ['admin-content-lessons'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('id, title, module, module_order, slides, estimated_minutes, is_published, updated_at')
        .eq('content_type', 'platform')
        .order('module', { ascending: true })
        .order('module_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as LessonRow[];
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

  const filteredLessons = useMemo(() => {
    const rows = lessonsQuery.data ?? [];
    if (moduleFilter === 'all') return rows;
    if (moduleFilter === 'foundation') {
      return rows.filter((r) => r.module.startsWith('f') && r.module.includes('_'));
    }
    return rows.filter((r) => r.module === moduleFilter);
  }, [lessonsQuery.data, moduleFilter]);

  const filteredQuizzes = useMemo(() => {
    const rows = quizzesQuery.data ?? [];
    if (moduleFilter === 'all') return rows;
    if (moduleFilter === 'foundation') {
      return rows.filter((r) =>
        r.module === 'foundation' || (r.module.startsWith('f') && r.module.includes('_'))
      );
    }
    return rows.filter((r) => r.module === moduleFilter);
  }, [quizzesQuery.data, moduleFilter]);

  if (roleLoading) {
    return <div className="p-6"><Skeleton className="h-32 w-full" /></div>;
  }
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="space-y-4 p-4 md:p-6">
      <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="h-3 w-3" /> Back to Admin
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6" /> Content Manager
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage Foundation modules, Tier strategy lessons, and quizzes.
        </p>
      </div>

      <Tabs defaultValue="lessons" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
        </TabsList>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODULE_FILTERS.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="lessons" className="space-y-3">
          <div className="flex justify-end">
            <NewContentButton label="New Lesson" to="/admin/content/lesson/new" />
          </div>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              {lessonsQuery.isLoading ? (
                <TableSkeleton />
              ) : filteredLessons.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">
                  No platform lessons found. Use the + New Lesson button to create one.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Module</TableHead>
                      <TableHead className="text-right">Order</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="text-right">Slides</TableHead>
                      <TableHead className="text-right">Est. Time</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLessons.map((l) => {
                      const slideCount = Array.isArray(l.slides) ? l.slides.length : 0;
                      return (
                        <TableRow key={l.id}>
                          <TableCell>
                            <Badge variant="outline" title={getModuleLabel(l.module)}>
                              {getShortLabel(l.module)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {l.module_order}
                          </TableCell>
                          <TableCell className="font-medium">{l.title}</TableCell>
                          <TableCell className="text-right tabular-nums">{slideCount}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {l.estimated_minutes != null ? `${l.estimated_minutes} min` : '—'}
                          </TableCell>
                          <TableCell><PublishedBadge published={l.is_published} /></TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {relativeTime(l.updated_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            {/* TODO: CM-2 will add the form page at this route. */}
                            <Button asChild size="sm" variant="outline">
                              <Link to={`/admin/content/lesson/${l.id}`}>Edit</Link>
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

        <TabsContent value="quizzes" className="space-y-3">
          <div className="flex justify-end">
            <NewContentButton label="New Quiz" to="/admin/content/quiz/new" />
          </div>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              {quizzesQuery.isLoading ? (
                <TableSkeleton />
              ) : filteredQuizzes.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">
                  No platform quizzes found. Use the + New Quiz button to create one.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Module</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="text-right">Questions</TableHead>
                      <TableHead className="text-right">Pass Threshold</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuizzes.map((q) => {
                      const qCount = Array.isArray(q.questions) ? q.questions.length : 0;
                      return (
                        <TableRow key={q.id}>
                          <TableCell>
                            <Badge variant="outline" title={getModuleLabel(q.module)}>
                              {getShortLabel(q.module)}
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
                            {/* TODO: CM-2 will add the form page at this route. */}
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
  );
}
