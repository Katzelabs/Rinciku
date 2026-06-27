import { useTranslation } from 'react-i18next';
import { AnalyticsSection } from '../components/analytics-section';

export function DashboardPage() {
  const { t } = useTranslation('dashboard');

  return (
    <div className='space-y-6'>
      <div className='space-y-1'>
        <h1 className='text-2xl font-semibold'>{t('page.title')}</h1>
        <p className='text-sm text-muted-foreground'>{t('page.subtitle')}</p>
      </div>

      <AnalyticsSection />
    </div>
  );
}
