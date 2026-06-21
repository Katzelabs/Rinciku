import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { deleteAccount } from '../api';

const CONFIRM_PHRASE = 'DELETE';

export function DangerZoneSection() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const canDelete = confirmText.trim() === CONFIRM_PHRASE;

  async function handleDelete() {
    if (!canDelete) return;
    setDeleting(true);
    try {
      await deleteAccount();
      navigate('/sign-in', { replace: true });
    } catch (error) {
      console.error('Failed to delete account', error);
      const detail =
        error instanceof Error ? error.message : 'Please try again.';
      toast.error(`Could not delete your account. ${detail}`);
      setDeleting(false);
    }
  }

  return (
    <Card className='border-destructive/40'>
      <CardHeader>
        <CardTitle className='text-destructive'>Delete account</CardTitle>
        <CardDescription>
          Permanently delete your account and all of your data — expenses,
          incomes, categories, budgets, and chats. This can't be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog
          open={open}
          onOpenChange={(next) => {
            if (deleting) return;
            setOpen(next);
            if (!next) setConfirmText('');
          }}
        >
          <DialogTrigger asChild>
            <Button variant='destructive'>Delete account</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete your account?</DialogTitle>
              <DialogDescription>
                This permanently removes your account and every record tied to
                it. To confirm, type{' '}
                <span className='font-medium text-foreground'>
                  {CONFIRM_PHRASE}
                </span>{' '}
                below.
              </DialogDescription>
            </DialogHeader>
            <Field>
              <FieldLabel htmlFor='settings-delete-confirm'>
                Confirmation
              </FieldLabel>
              <Input
                id='settings-delete-confirm'
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                autoComplete='off'
                placeholder={CONFIRM_PHRASE}
              />
            </Field>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setOpen(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                type='button'
                variant='destructive'
                onClick={handleDelete}
                disabled={!canDelete || deleting}
              >
                {deleting && <Spinner data-icon='inline-start' />}
                {deleting ? 'Deleting…' : 'Delete account'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
