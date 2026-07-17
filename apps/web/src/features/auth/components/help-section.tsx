import { Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  SUPPORT_EMAIL,
  supportMailtoUrl,
  privacyPolicyUrl,
  termsOfServiceUrl,
} from '@rinciku/core';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function HelpSection() {
  const { t, i18n } = useTranslation('common');
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('help.title')}</CardTitle>
        <CardDescription>{t('help.description')}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <Button asChild variant='outline'>
          <a href={supportMailtoUrl(t('help.emailSubject'))}>
            <Mail className='size-4' />
            {SUPPORT_EMAIL}
          </a>
        </Button>
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <a
            href={privacyPolicyUrl(i18n.language)}
            target='_blank'
            rel='noopener noreferrer'
            className='underline-offset-4 hover:text-foreground hover:underline'
          >
            {t('help.privacy')}
          </a>
          <span aria-hidden='true'>·</span>
          <a
            href={termsOfServiceUrl(i18n.language)}
            target='_blank'
            rel='noopener noreferrer'
            className='underline-offset-4 hover:text-foreground hover:underline'
          >
            {t('help.terms')}
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
