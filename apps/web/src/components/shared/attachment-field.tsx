import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

import { AttachmentDropzone } from './attachment-dropzone';
import { AttachmentPreview, type SignedUrlFn } from './attachment-preview';

export type ExistingAttachment = {
  storage_path: string;
  mime_type: string | null;
};

type Props = {
  /** A newly-staged file to upload (replaces the existing one on save). */
  file: File | null;
  onFileChange: (file: File | null) => void;
  /** The attachment already saved on the row, if any (edit mode only). */
  existing: ExistingAttachment | null;
  /** Whether the user chose to drop the existing attachment. */
  removed: boolean;
  onRemovedChange: (removed: boolean) => void;
  getSignedUrl: SignedUrlFn;
  disabled?: boolean;
  accept: string;
  allowedMime: ReadonlySet<string>;
  maxBytes?: number;
  hintLabel?: string;
  hintFormats?: string;
  invalidTypeMessage?: string;
  oversizedMessage?: string;
};

/**
 * Attachment input that works for both create and edit. In create mode (or when
 * there is no saved attachment) it is just the dropzone. In edit mode it shows
 * the saved attachment with a "Replace or remove" action; choosing it reveals
 * the dropzone so the user can drop a replacement or leave it empty to remove.
 * Clearing a freshly-staged file reverts to showing the saved attachment.
 */
export function AttachmentField({
  file,
  onFileChange,
  existing,
  removed,
  onRemovedChange,
  getSignedUrl,
  disabled,
  accept,
  allowedMime,
  maxBytes,
  hintLabel,
  hintFormats,
  invalidTypeMessage,
  oversizedMessage,
}: Props) {
  const { t } = useTranslation('common');
  const showExisting = !file && existing && !removed;

  if (showExisting) {
    return (
      <div className='space-y-2'>
        <AttachmentPreview
          storagePath={existing.storage_path}
          mimeType={existing.mime_type}
          getSignedUrl={getSignedUrl}
        />
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => onRemovedChange(true)}
          disabled={disabled}
        >
          {t('attachment.replaceOrRemove')}
        </Button>
      </div>
    );
  }

  return (
    <AttachmentDropzone
      value={file}
      onChange={onFileChange}
      disabled={disabled}
      accept={accept}
      allowedMime={allowedMime}
      maxBytes={maxBytes}
      hintLabel={hintLabel}
      hintFormats={hintFormats}
      invalidTypeMessage={invalidTypeMessage}
      oversizedMessage={oversizedMessage}
    />
  );
}
