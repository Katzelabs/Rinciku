import { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, ImagePlus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;

type AttachmentDropzoneProps = {
  value: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  accept: string;
  allowedMime: ReadonlySet<string>;
  maxBytes?: number;
  hintLabel?: string;
  hintFormats?: string;
  invalidTypeMessage?: string;
  oversizedMessage?: string;
};

export function AttachmentDropzone({
  value,
  onChange,
  disabled,
  accept,
  allowedMime,
  maxBytes = DEFAULT_MAX_BYTES,
  hintLabel,
  hintFormats,
  invalidTypeMessage,
  oversizedMessage,
}: AttachmentDropzoneProps) {
  const { t } = useTranslation('common');
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isImage = value?.type.startsWith('image/');
  const previewUrl = useMemo(
    () => (value && isImage ? URL.createObjectURL(value) : null),
    [value, isImage]
  );

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function acceptFile(file: File) {
    if (!allowedMime.has(file.type)) {
      toast.error(invalidTypeMessage ?? t('attachment.invalidType'));
      return;
    }
    if (file.size > maxBytes) {
      toast.error(
        oversizedMessage ??
          t('attachment.oversized', {
            size: Math.round(maxBytes / 1024 / 1024),
          })
      );
      return;
    }
    onChange(file);
  }

  function handleFileInput(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) acceptFile(file);
    event.target.value = '';
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (file) acceptFile(file);
  }

  function handleRemove() {
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  if (value) {
    return (
      <div className='flex items-center gap-3 rounded-md border border-input bg-background p-3'>
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={value.name}
            className='h-20 w-20 rounded-md object-cover'
          />
        ) : (
          <div className='flex h-20 w-20 items-center justify-center rounded-md bg-muted'>
            <FileText
              className='size-8 text-muted-foreground'
              aria-hidden='true'
            />
          </div>
        )}
        <div className='min-w-0 flex-1'>
          <p className='truncate text-sm font-medium'>{value.name}</p>
          <p className='text-xs text-muted-foreground'>
            {formatBytes(value.size)}
          </p>
        </div>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          onClick={handleRemove}
          disabled={disabled}
          aria-label={t('attachment.remove')}
        >
          <X className='size-4' />
        </Button>
      </div>
    );
  }

  return (
    <div
      role='button'
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(event) => {
        if (disabled) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-input bg-background p-6 text-center transition-colors',
        !disabled && 'cursor-pointer hover:border-foreground/40',
        isDragging && 'border-foreground/60 bg-accent',
        disabled && 'cursor-not-allowed opacity-60'
      )}
    >
      <ImagePlus className='size-6 text-muted-foreground' aria-hidden='true' />
      <p className='text-sm font-medium'>
        {hintLabel ?? t('attachment.dropzoneHint')}
      </p>
      {hintFormats && (
        <p className='text-xs text-muted-foreground'>{hintFormats}</p>
      )}
      <input
        ref={inputRef}
        type='file'
        accept={accept}
        className='sr-only'
        onChange={handleFileInput}
        disabled={disabled}
      />
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
