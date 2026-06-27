import { OnboardingWizard } from '../components/onboarding/onboarding-wizard';
import { RequireAuth } from '../components/require-auth';

export function OnboardingPage() {
  return (
    <RequireAuth>
      <div className='flex min-h-svh items-center justify-center p-6'>
        <OnboardingWizard />
      </div>
    </RequireAuth>
  );
}
