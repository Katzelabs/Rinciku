import { useEffect, useState } from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

// Mirrors the StorageResult shape returned by each feature's
// get*AttachmentSignedUrl helper, so this component stays feature-agnostic.
export type SignedUrlFn = (
  path: string,
  expiresIn?: number
) => Promise<{ data: { signedUrl: string } | null; error: unknown }>;

type Props = {
  storagePath: string;
  mimeType: string | null;
  getSignedUrl: SignedUrlFn;
  /**
   * `card` — compact row with file name + Open button (edit form).
   * `full` — image-only preview fit to the container, click to open (detail).
   */
  variant?: 'card' | 'full';
};

/**
 * Preview of an already-uploaded attachment. Loads an image thumbnail via a
 * signed URL; "Open" fetches a fresh short-lived URL and opens it in a new tab.
 */
export function AttachmentPreview({
  storagePath,
  mimeType,
  getSignedUrl,
  variant = 'card',
}: Props) {
  const isImage = mimeType?.startsWith('image/') ?? false;
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(isImage);

  useEffect(() => {
    if (!isImage) return;
    let cancelled = false;
    // Slightly longer expiry than the open-in-tab link since the thumbnail may
    // sit on screen while the dialog stays open.
    getSignedUrl(storagePath, 300).then(({ data }) => {
      if (cancelled) return;
      setThumbUrl(data?.signedUrl ?? null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isImage, storagePath, getSignedUrl]);

  async function open() {
    const { data, error } = await getSignedUrl(storagePath, 60);
    if (error || !data?.signedUrl) {
      toast.error('Could not open the attachment.');
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }

  if (variant === 'full') {
    if (isImage) {
      return (
        <button
          type='button'
          onClick={open}
          title='Open full size'
          className='group block w-full overflow-hidden rounded-lg border border-input bg-muted'
        >
          {loading ? (
            <div className='flex h-48 items-center justify-center'>
              <Spinner />
            </div>
          ) : thumbUrl ? (
            <img
              src={thumbUrl}
              alt='Attachment preview'
              className='mx-auto max-h-80 w-auto max-w-full object-contain transition group-hover:opacity-90'
            />
          ) : (
            <div className='flex h-48 items-center justify-center text-sm text-muted-foreground'>
              Preview unavailable
            </div>
          )}
        </button>
      );
    }
    return (
      <Button
        type='button'
        variant='outline'
        onClick={open}
        className='w-full justify-start'
      >
        <FileText className='size-4' />
        Open document
      </Button>
    );
  }

  return (
    <div className='flex items-center gap-3 rounded-md border border-input bg-background p-3'>
      {isImage && thumbUrl ? (
        <img
          src={thumbUrl}
          alt='Attachment preview'
          className='h-20 w-20 rounded-md object-cover'
        />
      ) : (
        <div className='flex h-20 w-20 items-center justify-center rounded-md bg-muted'>
          <FileText className='size-8 text-muted-foreground' aria-hidden='true' />
        </div>
      )}
      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm font-medium'>{fileName(storagePath)}</p>
        <p className='text-xs text-muted-foreground'>
          {mimeType ?? 'Unknown type'}
        </p>
      </div>
      <Button type='button' variant='outline' size='sm' onClick={open}>
        <ExternalLink className='size-4' />
        Open
      </Button>
    </div>
  );
}

function fileName(path: string): string {
  return path.split('/').pop() ?? path;
}
