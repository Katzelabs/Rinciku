import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('auth');
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
        error instanceof Error ? error.message : t('dangerZone.tryAgain');
      toast.error(t('dangerZone.deleteError', { detail }));
      setDeleting(false);
    }
  }

  return (
    <Card className='border-destructive/40'>
      <CardHeader>
        <CardTitle className='text-destructive'>
          {t('dangerZone.title')}
        </CardTitle>
        <CardDescription>{t('dangerZone.description')}</CardDescription>
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
            <Button variant='destructive'>{t('dangerZone.button')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('dangerZone.dialogTitle')}</DialogTitle>
              <DialogDescription>
                {t('dangerZone.dialogDescriptionBefore')}{' '}
                <span className='font-medium text-foreground'>
                  {CONFIRM_PHRASE}
                </span>{' '}
                {t('dangerZone.dialogDescriptionAfter')}
              </DialogDescription>
            </DialogHeader>
            <Field>
              <FieldLabel htmlFor='settings-delete-confirm'>
                {t('dangerZone.confirmLabel')}
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
                {t('common:actions.cancel')}
              </Button>
              <Button
                type='button'
                variant='destructive'
                onClick={handleDelete}
                disabled={!canDelete || deleting}
              >
                {deleting && <Spinner data-icon='inline-start' />}
                {deleting ? t('dangerZone.deleting') : t('dangerZone.button')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
