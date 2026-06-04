import { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
]);
const ACCEPT_ATTR = 'image/jpeg,image/png,image/webp,image/heic';
const MAX_BYTES = 10 * 1024 * 1024;

type AttachmentDropzoneProps = {
  value: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
};

export function AttachmentDropzone({
  value,
  onChange,
  disabled,
}: AttachmentDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const previewUrl = useMemo(
    () => (value ? URL.createObjectURL(value) : null),
    [value]
  );

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function acceptFile(file: File) {
    if (!ALLOWED_MIME.has(file.type)) {
      toast.error('Image must be JPG, PNG, WEBP, or HEIC.');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image must be 10 MB or smaller.');
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

  if (value && previewUrl) {
    return (
      <div className='flex items-center gap-3 rounded-md border border-input bg-background p-3'>
        <img
          src={previewUrl}
          alt={value.name}
          className='h-20 w-20 rounded-md object-cover'
        />
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
          aria-label='Remove attachment'
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
        Drop a receipt image or click to browse
      </p>
      <p className='text-xs text-muted-foreground'>
        JPG, PNG, WEBP, or HEIC · 10 MB max
      </p>
      <input
        ref={inputRef}
        type='file'
        accept={ACCEPT_ATTR}
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
