import { useEffect, useRef, useState } from 'react';
import { ImagePlus, SendHorizontal, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

const ACCEPTED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_BYTES = 10 * 1024 * 1024;

type PendingImage = { file: File; url: string };

type Props = {
  sending: boolean;
  onSend: (text: string) => void;
  onSendImage: (file: File, caption?: string) => void;
};

export function MessageComposer({ sending, onSend, onSendImage }: Props) {
  const [text, setText] = useState('');
  const [pending, setPending] = useState<PendingImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke any staged object URL when it changes or the composer unmounts.
  useEffect(() => {
    return () => {
      if (pending) URL.revokeObjectURL(pending.url);
    };
  }, [pending]);

  function clearPending() {
    setPending(null);
  }

  function submit() {
    if (sending) return;
    const trimmed = text.trim();
    if (pending) {
      onSendImage(pending.file, trimmed || undefined);
      setPending(null);
      setText('');
      return;
    }
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ACCEPTED_IMAGE.includes(file.type)) {
      toast.error('Please pick an image (JPG, PNG, WEBP, or HEIC).');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image must be 10 MB or smaller.');
      return;
    }
    setPending({ file, url: URL.createObjectURL(file) });
  }

  const canSend = !sending && (Boolean(pending) || Boolean(text.trim()));

  return (
    <div className='border-t bg-background p-3'>
      <input
        ref={fileInputRef}
        type='file'
        accept={ACCEPTED_IMAGE.join(',')}
        className='hidden'
        onChange={handleFile}
      />

      <div className='flex flex-col gap-2 rounded-2xl border bg-background p-2 transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50'>
        {pending ? (
          <div className='flex items-center gap-2 self-start rounded-lg border bg-muted/40 p-1.5 pr-2'>
            <img
              src={pending.url}
              alt='Selected attachment preview'
              className='size-10 rounded-md object-cover'
            />
            <span className='max-w-40 truncate text-xs text-muted-foreground'>
              {pending.file.name}
            </span>
            <button
              type='button'
              onClick={clearPending}
              disabled={sending}
              aria-label='Remove image'
              className='flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
            >
              <X className='size-3.5' />
            </button>
          </div>
        ) : null}

        <div className='flex items-end gap-2'>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='shrink-0'
            disabled={sending}
            onClick={() => fileInputRef.current?.click()}
            aria-label='Attach a receipt or transfer image'
          >
            <ImagePlus className='size-4' />
          </Button>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={
              pending
                ? 'Add a note about this image (optional)…'
                : 'Ask if you can afford something, or log a transaction…'
            }
            className='max-h-40 min-h-9 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent'
            disabled={sending}
          />
          <Button
            type='button'
            size='icon'
            className='shrink-0'
            onClick={submit}
            disabled={!canSend}
            aria-label='Send message'
          >
            {sending ? <Spinner /> : <SendHorizontal className='size-4' />}
          </Button>
        </div>
      </div>
    </div>
  );
}
