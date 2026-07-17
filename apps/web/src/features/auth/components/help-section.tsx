import { Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SUPPORT_EMAIL, supportMailtoUrl } from '@rinciku/core';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function HelpSection() {
  const { t } = useTranslation('common');
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('help.title')}</CardTitle>
        <CardDescription>{t('help.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant='outline'>
          <a href={supportMailtoUrl(t('help.emailSubject'))}>
            <Mail className='size-4' />
            {SUPPORT_EMAIL}
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
