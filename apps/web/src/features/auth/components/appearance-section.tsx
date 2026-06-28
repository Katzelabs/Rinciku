import { Languages, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { isLanguage, type Language } from '@rinciku/core/i18n';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '../hooks/use-auth';
import { updateLanguage } from '../api';

const themeOptions = [
  { value: 'light', label: 'theme.light', icon: Sun },
  { value: 'dark', label: 'theme.dark', icon: Moon },
  { value: 'system', label: 'theme.system', icon: Monitor },
] as const;

// Language names are shown as endonyms (always in their own language), so they
// are intentionally not run through `t`.
const languageOptions: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'id', label: 'Bahasa Indonesia' },
];

export function AppearanceSection() {
  const { t, i18n } = useTranslation('common');
  const { theme, setTheme } = useTheme();
  const { user, refreshProfile } = useAuth();

  async function handleLanguageChange(next: string) {
    if (!isLanguage(next)) return;
    // Apply instantly (also caches to localStorage via the detector).
    void i18n.changeLanguage(next);
    if (!user) return;
    try {
      await updateLanguage(user.id, next);
      await refreshProfile();
    } catch (error) {
      console.error('Failed to update language', error);
      toast.error(t('appearance.language.saveError'));
    }
  }

  const currentLanguage = isLanguage(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : 'en';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('appearance.title')}</CardTitle>
        <CardDescription>{t('appearance.description')}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <Field>
          <FieldLabel htmlFor='settings-theme'>
            {t('appearance.theme.label')}
          </FieldLabel>
          <Select value={theme ?? 'system'} onValueChange={setTheme}>
            <SelectTrigger id='settings-theme' className='w-full sm:w-56'>
              <SelectValue placeholder={t('appearance.theme.placeholder')} />
            </SelectTrigger>
            <SelectContent>
              {themeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <option.icon className='size-4' />
                  {t(`appearance.${option.label}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor='settings-language'>
            {t('appearance.language.label')}
          </FieldLabel>
          <Select value={currentLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger id='settings-language' className='w-full sm:w-56'>
              <SelectValue placeholder={t('appearance.language.placeholder')} />
            </SelectTrigger>
            <SelectContent>
              {languageOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <Languages className='size-4' />
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </CardContent>
    </Card>
  );
}
