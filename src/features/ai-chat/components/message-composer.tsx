import { useRef, useState } from 'react';
import { ImagePlus, SendHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

const ACCEPTED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_BYTES = 10 * 1024 * 1024;

type Props = {
  sending: boolean;
  onSend: (text: string) => void;
  onSendImage: (file: File, caption?: string) => void;
};

export function MessageComposer({ sending, onSend, onSendImage }: Props) {
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function submit() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
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
    onSendImage(file, text.trim() || undefined);
    setText('');
  }

  return (
    <div className='flex items-end gap-2 border-t bg-background p-3'>
      <input
        ref={fileInputRef}
        type='file'
        accept={ACCEPTED_IMAGE.join(',')}
        className='hidden'
        onChange={handleFile}
      />
      <Button
        type='button'
        variant='outline'
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
        placeholder='Ask if you can afford something, or log a transaction…'
        className='max-h-40 min-h-10 resize-none'
        disabled={sending}
      />
      <Button
        type='button'
        size='icon'
        className='shrink-0'
        onClick={submit}
        disabled={sending || !text.trim()}
        aria-label='Send message'
      >
        {sending ? <Spinner /> : <SendHorizontal className='size-4' />}
      </Button>
    </div>
  );
}
