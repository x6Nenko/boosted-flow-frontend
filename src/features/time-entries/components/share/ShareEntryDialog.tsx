import { useRef, useCallback, useState } from 'react';
import { toPng, toBlob } from 'html-to-image';
import { Image, FileText, Copy, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCopyFeedback } from './use-copy-feedback';
import { DarkCard } from './cards/dark';
import { distractionLabel } from './shared';
import type { ShareCardData } from './types';

type ShareEntryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ShareCardData;
};

type ShareMode = 'image' | 'markdown';

const IMAGE_OPTIONS = { pixelRatio: 2 };

function buildMarkdown(data: ShareCardData): string {
  const lines = [
    `## ${data.activityName}`,
    '',
    `**Date:** ${data.date}`,
    `**Time:** ${data.timeRange}`,
    `**Duration:** ${data.duration}`,
  ];
  if (data.rating !== null) {
    lines.push(`**Rating:** ${'★'.repeat(data.rating)}${'☆'.repeat(5 - data.rating)}`);
  }
  lines.push(`**Distractions:** ${distractionLabel(data.distractionCount)}`);
  lines.push('', '---', '*Tracked with Boosted Flow*');
  return lines.join('\n');
}

export function ShareEntryDialog({ open, onOpenChange, data }: ShareEntryDialogProps) {
  const [mode, setMode] = useState<ShareMode>('image');
  const cardRef = useRef<HTMLDivElement>(null);
  const [copyState, triggerCopy] = useCopyFeedback();

  const markdown = buildMarkdown(data);
  const slug = data.activityName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const handleCopy = useCallback(async () => {
    if (mode === 'markdown') {
      await navigator.clipboard.writeText(markdown);
      triggerCopy();
    } else {
      if (!cardRef.current) return;
      const blob = await toBlob(cardRef.current, IMAGE_OPTIONS);
      if (blob) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        triggerCopy();
      }
    }
  }, [mode, markdown, triggerCopy]);

  const handleSave = useCallback(async () => {
    if (mode === 'markdown') {
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.download = `boosted-flow-${slug}.md`;
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      if (!cardRef.current) return;
      const dataUrl = await toPng(cardRef.current, IMAGE_OPTIONS);
      const a = document.createElement('a');
      a.download = `boosted-flow-${slug}.png`;
      a.href = dataUrl;
      a.click();
    }
  }, [mode, markdown, slug]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-sm:max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle className='text-center'>Share Entry</DialogTitle>
        </DialogHeader>

        <div className="flex gap-0.5 bg-background rounded-md border border-border p-0.5 w-fit mx-auto">
          <Button
            onClick={() => setMode('image')}
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 px-3 text-xs font-medium flex items-center gap-1.5 w-28',
              mode === 'image' && 'bg-accent text-accent-foreground',
            )}
          >
            <Image size={14} />
            Image
          </Button>
          <Button
            onClick={() => setMode('markdown')}
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 px-3 text-xs font-medium flex items-center gap-1.5 w-28',
              mode === 'markdown' && 'bg-accent text-accent-foreground',
            )}
          >
            <FileText size={14} />
            Markdown
          </Button>
        </div>

        <div className="min-h-[300px] flex items-start justify-center py-2">
          {mode === 'image' ? (
            <div ref={cardRef} className='w-full'>
              <DarkCard data={data} />
            </div>
          ) : (
            <pre className="w-full overflow-auto rounded-xl border border-border bg-card p-6 text-sm text-foreground whitespace-pre-wrap font-mono">
              {markdown}
            </pre>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end mx-auto">
          <Button
            onClick={handleCopy}
            variant="secondary"
            size="sm"
          >
            <Copy size={14} />
            {copyState === 'copied' ? 'Copied!' : 'Copy'}
          </Button>
          <Button onClick={handleSave} variant="action" size="sm">
            <Download size={14} />
            Save as
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
