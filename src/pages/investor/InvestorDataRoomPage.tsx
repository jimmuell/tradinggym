import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Trash2, Upload, FileText, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface InvestorDoc {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  created_at: string;
}

const CATEGORIES = [
  { value: 'pitch_deck', label: 'Pitch Deck' },
  { value: 'financials', label: 'Financials' },
  { value: 'product', label: 'Product' },
  { value: 'legal', label: 'Legal' },
  { value: 'other', label: 'Other' },
];

const labelFor = (v: string) => CATEGORIES.find((c) => c.value === v)?.label ?? 'Other';

function formatSize(bytes?: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function InvestorDataRoomPage() {
  const qc = useQueryClient();
  const { isAdmin } = useUserRole();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('pitch_deck');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: docs, isLoading } = useQuery({
    queryKey: ['investor-documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investor_documents')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as InvestorDoc[];
    },
  });

  const deleteDoc = useMutation({
    mutationFn: async (doc: InvestorDoc) => {
      if (doc.file_name) {
        await supabase.storage.from('investor-docs').remove([doc.file_name]);
      }
      const { error } = await supabase.from('investor_documents').delete().eq('id', doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investor-documents'] });
      toast({ title: 'Document removed' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const reset = () => {
    setTitle('');
    setDescription('');
    setCategory('pitch_deck');
    setFile(null);
  };

  const handleUpload = async () => {
    if (!title.trim() || !file) {
      toast({ title: 'Missing fields', description: 'Title and file are required', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { error: upErr } = await supabase.storage
        .from('investor-docs')
        .upload(safeName, file, { upsert: false });
      if (upErr) throw upErr;

      const { data: signed } = await supabase.storage
        .from('investor-docs')
        .createSignedUrl(safeName, 60 * 60 * 24 * 365);

      const { data: userData } = await supabase.auth.getUser();
      const { error: insErr } = await supabase.from('investor_documents').insert({
        title: title.trim(),
        description: description.trim() || null,
        category,
        file_url: signed?.signedUrl ?? null,
        file_name: safeName,
        file_size: file.size,
        uploaded_by: userData.user?.id,
      });
      if (insErr) throw insErr;

      toast({ title: 'Document uploaded' });
      qc.invalidateQueries({ queryKey: ['investor-documents'] });
      reset();
      setOpen(false);
    } catch (e) {
      const err = e as Error;
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (doc: InvestorDoc) => {
    if (!doc.file_name) {
      if (doc.file_url) window.open(doc.file_url, '_blank');
      return;
    }
    const { data, error } = await supabase.storage
      .from('investor-docs')
      .createSignedUrl(doc.file_name, 60);
    if (error || !data) {
      toast({ title: 'Download failed', description: error?.message, variant: 'destructive' });
      return;
    }
    window.open(data.signedUrl, '_blank');
  };

  const grouped = (docs ?? []).reduce<Record<string, InvestorDoc[]>>((acc, d) => {
    (acc[d.category] ||= []).push(d);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Data Room</h1>
          <p className="text-sm text-muted-foreground">Investment materials and supporting documents</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1" /> Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="d-title">Title</Label>
                  <Input id="d-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="d-desc">Description</Label>
                  <Textarea id="d-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="d-file">File</Label>
                  <Input
                    id="d-file"
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button onClick={handleUpload} disabled={submitting}>
                  <Upload className="h-4 w-4 mr-1" />
                  {submitting ? 'Uploading…' : 'Upload'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : !docs || docs.length === 0 ? (
        <Card>
          <CardContent className="pt-10 pb-10 text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No documents uploaded yet.{isAdmin ? ' Upload your first document to get started.' : ''}
            </p>
          </CardContent>
        </Card>
      ) : (
        CATEGORIES.filter((c) => grouped[c.value]?.length).map((c) => (
          <div key={c.value} className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {c.label}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {grouped[c.value].map((doc) => (
                <Card key={doc.id} className="hover:border-primary/40 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{doc.title}</CardTitle>
                      <Badge variant="outline" className="text-[10px]">{labelFor(doc.category)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {doc.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{doc.description}</p>
                    )}
                    <div className="text-[11px] text-muted-foreground">
                      {doc.file_name && <span>{doc.file_name.replace(/^\d+-/, '')}</span>}
                      {doc.file_size ? <span> • {formatSize(doc.file_size)}</span> : null}
                      <span> • {new Date(doc.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleDownload(doc)}>
                        <Download className="h-3 w-3 mr-1" /> Download
                      </Button>
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Delete "${doc.title}"?`)) deleteDoc.mutate(doc);
                          }}
                        >
                          <Trash2 className="h-3 w-3 mr-1 text-destructive" /> Delete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
