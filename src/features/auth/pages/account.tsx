import { toast } from 'sonner';
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

  async function handleSave(values: OnboardingInput) {
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
    </div>
  );
}
