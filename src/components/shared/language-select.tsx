import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isLanguage, type Language } from '@/i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Language names are shown as endonyms (always in their own language), so they
// are intentionally not run through `t`.
const languageOptions: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'id', label: 'Bahasa Indonesia' },
];

interface LanguageSelectProps {
  className?: string;
}

export function LanguageSelect({ className }: LanguageSelectProps) {
  const { t, i18n } = useTranslation('common');

  const current = isLanguage(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : 'en';

  function handleChange(next: string) {
    if (!isLanguage(next)) return;
    // Apply instantly (the detector also caches it to localStorage).
    void i18n.changeLanguage(next);
  }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger
        className={cn('w-auto gap-2', className)}
        aria-label={t('appearance.language.toggle')}
      >
        <Languages className='size-4' />
        {/* Show a compact code (EN / ID) in the trigger; the dropdown keeps the
            full endonym. */}
        <span>{current.toUpperCase()}</span>
      </SelectTrigger>
      <SelectContent position='popper' align='end'>
        {languageOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
