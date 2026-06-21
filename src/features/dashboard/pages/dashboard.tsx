import { FxBanner } from '@/components/shared/fx-banner';
import { AnalyticsSection } from '../components/analytics-section';

export function DashboardPage() {
  return (
    <div className='space-y-6'>
      <div className='space-y-1'>
        <h1 className='text-2xl font-semibold'>Dashboard</h1>
        <p className='text-sm text-muted-foreground'>
          Explore spending across any range. Income isn't category-filtered.
        </p>
      </div>

      <FxBanner />

      <AnalyticsSection />
    </div>
  );
}
