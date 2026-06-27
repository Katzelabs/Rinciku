import { format as formatDateFn } from 'date-fns';
import { enUS, id as idLocale } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import i18n from '@/i18n';

/**
 * The active UI language drives both the words and the number/date formatting.
 * Money and dates follow the selected language: `en` → `IDR 1,500,000` / `Jun`,
 * `id` → `Rp 1.500.000` / `Jun`.
 */

/** BCP-47 locale for `Intl` APIs (NumberFormat, DateTimeFormat). */
export function activeLocale(): string {
  return i18n.resolvedLanguage === 'id' ? 'id-ID' : 'en-US';
}

/** date-fns `Locale` for `format()` and react-day-picker. */
export function activeDateFnsLocale(): Locale {
  return i18n.resolvedLanguage === 'id' ? idLocale : enUS;
}

/** `date-fns/format` with the active language's locale applied. */
export function formatDate(date: Date | number, fmt: string): string {
  return formatDateFn(date, fmt, { locale: activeDateFnsLocale() });
}
