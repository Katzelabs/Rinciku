import { useNavigate } from 'react-router';
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
import { RequireAuth } from '../components/require-auth';
import { useAuth } from '../hooks/use-auth';
import type { OnboardingInput } from '../schemas';

export function OnboardingPage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  async function handleOnboarding(values: OnboardingInput) {
    if (!user) return;
    try {
      await upsertProfile(user.id, values);
      await refreshProfile();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Failed to save profile', error);
      toast.error('Could not save your profile. Please try again.');
    }
  }

  return (
    <RequireAuth>
      <div className='flex min-h-svh items-center justify-center p-6'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle>Finish setting up your profile</CardTitle>
            <CardDescription>
              Tell Rinciku about your income and budget cycle so we can tailor
              the dashboard to you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              initialValues={profile}
              onSubmit={handleOnboarding}
              submitLabel='Continue'
            />
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  );
}
