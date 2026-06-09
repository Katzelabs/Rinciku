import { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { upsertProfile } from '../api';
import { ProfileForm } from '../components/profile-form';
import { useAuth } from '../hooks/use-auth';
import type { OnboardingInput } from '../schemas';

export function AccountPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [pending, setPending] = useState<OnboardingInput | null>(null);

  async function persist(values: OnboardingInput) {
    if (!user) return;
    try {
      await upsertProfile(user.id, values);
      await refreshProfile();
      toast.success('Profile updated');
    } catch (error) {
      console.error('Failed to update profile', error);
      toast.error('Could not update your profile. Please try again.');
    }
  }

  async function handleSave(values: OnboardingInput) {
    if (values.base_currency !== profile?.base_currency) {
      setPending(values);
      return;
    }
    await persist(values);
  }

  async function handleConfirm() {
    if (!pending) return;
    const values = pending;
    setPending(null);
    await persist(values);
  }

  return (
    <div className='mx-auto w-full max-w-2xl'>
      <Card>
        <CardHeader>
          <CardTitle>Account settings</CardTitle>
          <CardDescription>
            Update the details Rinciku uses to tailor your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            initialValues={profile}
            onSubmit={handleSave}
            submitLabel='Save changes'
          />
        </CardContent>
      </Card>
      <AlertDialog
        open={!!pending}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change base currency?</AlertDialogTitle>
            <AlertDialogDescription>
              Historical totals will be displayed in the new currency going
              forward. Past row data is not modified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
