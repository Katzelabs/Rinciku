import { Paperclip, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

type Props = {
  editLabel: string;
  deleteLabel: string;
  onEdit: () => void;
  onDelete: () => void;
  /** When provided, an attachment (paperclip) button is shown first. */
  onOpenAttachment?: () => void;
};

/**
 * Right-aligned ghost-icon action group used in every list-table row:
 * optional attachment, then edit and delete.
 */
export function RowActions({
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
  onOpenAttachment,
}: Props) {
  const { t } = useTranslation('common');
  return (
    <div className='flex justify-end gap-1'>
      {onOpenAttachment ? (
        <Button
          type='button'
          variant='ghost'
          size='icon'
          aria-label={t('rowActions.openAttachment')}
          onClick={onOpenAttachment}
        >
          <Paperclip className='size-4' />
        </Button>
      ) : null}
      <Button
        type='button'
        variant='ghost'
        size='icon'
        aria-label={editLabel}
        onClick={onEdit}
      >
        <Pencil className='size-4' />
      </Button>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        aria-label={deleteLabel}
        onClick={onDelete}
      >
        <Trash2 className='size-4' />
      </Button>
    </div>
  );
}
