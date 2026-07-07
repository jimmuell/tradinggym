import { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { FileUp, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { LessonSlide } from '@/hooks/useLessons';

// Configure pdfjs worker (Vite-friendly, no CDN dependency)
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const PUBLIC_BUCKET = 'lesson-assets';
const PRIVATE_BUCKET = 'lesson-assets-private';
const MAX_PDF_SIZE = 20 * 1024 * 1024;
const MAX_IMG_SIZE = 5 * 1024 * 1024;
const MAX_IMG_COUNT = 50;

interface ExtractedPage {
  index: number;
  blob: Blob;
  preview: string; // object URL
  selected: boolean;
}

interface SlideImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Stable folder id used as the storage subfolder under {user_id}/. */
  lessonFolderId: string;
  /**
   * When true, uploads go to the private bucket and slide.image_url stores a
   * `private://<path>` marker that must be resolved via signed URL at render
   * time. When false (default), uploads go to the public bucket and slide
   * image_url stores a full public URL — backwards compatible.
   */
  isPrivate?: boolean;
  onImported: (slides: LessonSlide[]) => void;
}

async function pdfToImageBlobs(
  file: File,
  onProgress: (done: number, total: number) => void,
): Promise<Blob[]> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const blobs: Blob[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    await page.render({ canvasContext: ctx, viewport }).promise;
    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
    );
    blobs.push(blob);
    onProgress(i, pdf.numPages);
  }
  return blobs;
}

export default function SlideImportDialog({
  open,
  onOpenChange,
  lessonFolderId,
  isPrivate = false,
  onImported,
}: SlideImportDialogProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<'pdf' | 'images'>('pdf');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [pages, setPages] = useState<ExtractedPage[]>([]);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    pages.forEach((p) => URL.revokeObjectURL(p.preview));
    setPages([]);
    setProgress(0);
    setStatusText('');
    setBusy(false);
  }

  function handleClose(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function handlePdfFile(file: File) {
    if (!user) return;
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file.');
      return;
    }
    if (file.size > MAX_PDF_SIZE) {
      toast.error('PDF must be 20 MB or smaller.');
      return;
    }
    setBusy(true);
    setStatusText('Reading PDF...');
    setProgress(5);
    try {
      const blobs = await pdfToImageBlobs(file, (done, total) => {
        setStatusText(`Rendering page ${done} of ${total}...`);
        setProgress(Math.round((done / total) * 100));
      });
      const extracted: ExtractedPage[] = blobs.map((b, i) => ({
        index: i,
        blob: b,
        preview: URL.createObjectURL(b),
        selected: true,
      }));
      pages.forEach((p) => URL.revokeObjectURL(p.preview));
      setPages(extracted);
      setStatusText(`Extracted ${blobs.length} page${blobs.length === 1 ? '' : 's'}`);
    } catch (e) {
      console.error('PDF processing failed', e);
      toast.error(e instanceof Error ? e.message : 'Failed to process PDF');
    } finally {
      setBusy(false);
    }
  }

  async function handleImageFiles(files: FileList) {
    if (!user) return;
    const arr = Array.from(files);
    if (arr.length > MAX_IMG_COUNT) {
      toast.error(`Maximum ${MAX_IMG_COUNT} images at once.`);
      return;
    }
    for (const f of arr) {
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(f.type)) {
        toast.error(`${f.name}: only PNG and JPG allowed.`);
        return;
      }
      if (f.size > MAX_IMG_SIZE) {
        toast.error(`${f.name}: exceeds 5 MB.`);
        return;
      }
    }
    pages.forEach((p) => URL.revokeObjectURL(p.preview));
    setPages(
      arr.map((f, i) => ({
        index: i,
        blob: f,
        preview: URL.createObjectURL(f),
        selected: true,
      })),
    );
    setStatusText(`${arr.length} image${arr.length === 1 ? '' : 's'} ready`);
  }

  function togglePage(index: number) {
    setPages((prev) =>
      prev.map((p) => (p.index === index ? { ...p, selected: !p.selected } : p)),
    );
  }

  async function handleImportAll() {
    if (!user) return;
    const selected = pages.filter((p) => p.selected);
    if (selected.length === 0) {
      toast.error('Select at least one slide to import.');
      return;
    }
    setBusy(true);
    setProgress(0);
    setStatusText('Uploading slides...');
    const uploadedSlides: LessonSlide[] = [];
    try {
      let done = 0;
      for (const p of selected) {
        const ext = p.blob.type === 'image/jpeg' ? 'jpg' : 'png';
        const filename = `slide-${Date.now()}-${p.index}.${ext}`;
        const path = `${user.id}/${lessonFolderId}/${filename}`;
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, p.blob, { contentType: p.blob.type, upsert: false });
        if (error) throw error;
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        uploadedSlides.push({
          id: crypto.randomUUID(),
          title: `Slide ${uploadedSlides.length + 1}`,
          body: '',
          bullet_points: [],
          tip: '',
          image_url: pub.publicUrl,
          type: 'imported',
        });
        done++;
        setProgress(Math.round((done / selected.length) * 100));
        setStatusText(`Uploaded ${done} of ${selected.length}...`);
      }
      onImported(uploadedSlides);
      toast.success(`Imported ${uploadedSlides.length} slide${uploadedSlides.length === 1 ? '' : 's'}.`);
      handleClose(false);
    } catch (e) {
      console.error('Slide upload failed', e);
      toast.error(e instanceof Error ? e.message : 'Failed to upload slides');
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Slides</DialogTitle>
          <DialogDescription>
            Upload a PDF or images to add as slides. Each page or image becomes a new slide.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'pdf' | 'images')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pdf">
              <FileUp className="h-4 w-4 mr-1" />
              Upload PDF
            </TabsTrigger>
            <TabsTrigger value="images">
              <ImageIcon className="h-4 w-4 mr-1" />
              Upload Images
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pdf" className="space-y-4 pt-4">
            <button
              type="button"
              disabled={busy}
              onClick={() => pdfInputRef.current?.click()}
              className="w-full rounded-md border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 transition-colors p-8 text-center disabled:opacity-50"
            >
              <FileUp className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">Click to choose a PDF</p>
              <p className="text-xs text-muted-foreground">Max 20 MB</p>
            </button>
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handlePdfFile(f);
                e.target.value = '';
              }}
            />
          </TabsContent>

          <TabsContent value="images" className="space-y-4 pt-4">
            <button
              type="button"
              disabled={busy}
              onClick={() => imgInputRef.current?.click()}
              className="w-full rounded-md border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 transition-colors p-8 text-center disabled:opacity-50"
            >
              <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">Click to choose images</p>
              <p className="text-xs text-muted-foreground">PNG or JPG, max 5 MB each, up to 50 images</p>
            </button>
            <input
              ref={imgInputRef}
              type="file"
              accept="image/png,image/jpeg"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) handleImageFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </TabsContent>
        </Tabs>

        {(busy || statusText) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{statusText}</span>
            </div>
            {busy && <Progress value={progress} className="h-2" />}
          </div>
        )}

        {pages.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {pages.filter((p) => p.selected).length} of {pages.length} selected
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setPages((prev) => prev.map((p) => ({ ...p, selected: true })))
                  }
                >
                  Select all
                </Button>
                <Button size="sm" variant="ghost" onClick={reset} disabled={busy}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto p-1">
              {pages.map((p) => (
                <label
                  key={p.index}
                  className={`relative block rounded-md border-2 cursor-pointer overflow-hidden ${
                    p.selected ? 'border-primary' : 'border-border opacity-60'
                  }`}
                >
                  <img src={p.preview} alt={`Page ${p.index + 1}`} className="w-full h-auto" />
                  <div className="absolute top-1 left-1 bg-background/90 rounded px-1.5 py-0.5 text-[10px] font-medium">
                    {p.index + 1}
                  </div>
                  <div className="absolute top-1 right-1">
                    <Checkbox
                      checked={p.selected}
                      onCheckedChange={() => togglePage(p.index)}
                    />
                  </div>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => handleClose(false)} disabled={busy}>
                Cancel
              </Button>
              <Button onClick={handleImportAll} disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  `Import ${pages.filter((p) => p.selected).length} slide${
                    pages.filter((p) => p.selected).length === 1 ? '' : 's'
                  }`
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
