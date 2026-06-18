import { Paperclip, Pencil, Trash2 } from 'lucide-react';
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
  return (
    <div className='flex justify-end gap-1'>
      {onOpenAttachment ? (
        <Button
          type='button'
          variant='ghost'
          size='icon'
          aria-label='Open attachment'
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
