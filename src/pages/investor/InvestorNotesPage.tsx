import { useState } from 'react';
import { Pin, Trash2, Reply } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useInvestorNotes,
  useCreateInvestorNote,
  useDeleteInvestorNote,
  useToggleNotePin,
  type InvestorNote,
} from '@/hooks/useInvestorNotes';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function useAuthorRoles(authorIds: string[]) {
  return useQuery({
    queryKey: ['author-roles', authorIds.sort().join(',')],
    enabled: authorIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, role')
        .in('user_id', authorIds);
      const map: Record<string, string> = {};
      (data ?? []).forEach((p: { user_id: string; role: string }) => {
        map[p.user_id] = p.role;
      });
      return map;
    },
  });
}

function NoteCard({
  note,
  isReply = false,
  authorRoles,
}: {
  note: InvestorNote;
  isReply?: boolean;
  authorRoles: Record<string, string>;
}) {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const create = useCreateInvestorNote();
  const del = useDeleteInvestorNote();
  const togglePin = useToggleNotePin();

  const initial = (note.author_name || '?').trim().charAt(0).toUpperCase();
  const isOwn = user?.id === note.author_id;
  const isTeam = authorRoles[note.author_id] === 'admin';

  return (
    <div className={isReply ? 'pl-4 border-l-2 border-border' : ''}>
      <Card className={note.is_pinned && !isReply ? 'border-primary/50' : ''}>
        <CardContent className="pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-medium">
                {initial}
              </div>
              <span className={`font-medium ${isReply ? 'text-xs' : 'text-sm'}`}>
                {note.author_name || 'Anonymous'}
              </span>
              {isTeam && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                  Team
                </Badge>
              )}
              {note.is_pinned && !isReply && <Pin className="h-3 w-3 text-primary" />}
              <span className="text-xs text-muted-foreground">· {timeAgo(note.created_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              {isAdmin && !isReply && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => togglePin.mutate({ id: note.id, pinned: !note.is_pinned })}
                  className="h-7 px-2"
                >
                  <Pin className="h-3 w-3" />
                </Button>
              )}
              {isOwn && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm('Delete this note?')) del.mutate(note.id);
                  }}
                  className="h-7 px-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          <p className={`whitespace-pre-wrap ${isReply ? 'text-xs' : 'text-sm'}`}>{note.content}</p>
          {!isReply && (
            <div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setReplyOpen((o) => !o)}
                className="h-7 px-2 text-xs"
              >
                <Reply className="h-3 w-3 mr-1" /> Reply
              </Button>
              {replyOpen && (
                <div className="mt-2 space-y-2">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply…"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={!replyText.trim() || create.isPending}
                      onClick={() => {
                        create.mutate(
                          { content: replyText.trim(), parentId: note.id },
                          {
                            onSuccess: () => {
                              setReplyText('');
                              setReplyOpen(false);
                            },
                          }
                        );
                      }}
                    >
                      Post reply
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setReplyOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      {note.replies && note.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {note.replies.map((r) => (
            <NoteCard key={r.id} note={r} isReply authorRoles={authorRoles} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function InvestorNotesPage() {
  const { data: notes, isLoading } = useInvestorNotes();
  const create = useCreateInvestorNote();
  const [composerOpen, setComposerOpen] = useState(false);
  const [text, setText] = useState('');

  const authorIds = Array.from(
    new Set(
      (notes ?? []).flatMap((n) => [n.author_id, ...(n.replies?.map((r) => r.author_id) ?? [])])
    )
  );
  const { data: authorRoles = {} } = useAuthorRoles(authorIds);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notes & Q&A</h1>
        {!composerOpen && (
          <Button onClick={() => setComposerOpen(true)}>New Note</Button>
        )}
      </div>

      {composerOpen && (
        <Card>
          <CardContent className="pt-4 space-y-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share an update or ask a question…"
              rows={4}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                disabled={!text.trim() || create.isPending}
                onClick={() => {
                  create.mutate(
                    { content: text.trim() },
                    {
                      onSuccess: () => {
                        setText('');
                        setComposerOpen(false);
                      },
                    }
                  );
                }}
              >
                Post
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setText('');
                  setComposerOpen(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : !notes || notes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              No notes yet. Start the conversation by posting the first note.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <NoteCard key={n.id} note={n} authorRoles={authorRoles} />
          ))}
        </div>
      )}
    </div>
  );
}
