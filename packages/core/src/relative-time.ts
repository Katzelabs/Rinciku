import i18n from 'i18next';

/**
 * Compact "time ago" label (e.g. `5m ago`, `3d ago`), localized via the shared
 * `common` namespace (`relativeTime.*`). Built on plain millisecond math + the
 * i18next count-plural keys — deliberately NOT `Intl.RelativeTimeFormat`, which
 * Hermes (React Native) does not reliably implement. The i18next singleton is
 * the instance the app initializes, so the active language resolves the same on
 * web and mobile (same precedent as `activeLocale()` in `locale.ts`).
 */
export function formatRelativeTime(
  value: string | number | Date | null | undefined
): string {
  const t = i18n.getFixedT(null, 'common');
  if (value == null) return t('relativeTime.never');

  const ts =
    value instanceof Date
      ? value.getTime()
      : typeof value === 'number'
        ? value
        : Date.parse(value);
  if (Number.isNaN(ts)) return t('relativeTime.recently');

  const mins = Math.round((Date.now() - ts) / 60_000);
  if (mins < 1) return t('relativeTime.justNow');
  if (mins < 60) return t('relativeTime.minutes', { count: mins });

  const hours = Math.round(mins / 60);
  if (hours < 24) return t('relativeTime.hours', { count: hours });

  const days = Math.round(hours / 24);
  if (days < 7) return t('relativeTime.days', { count: days });
  if (days < 30) return t('relativeTime.weeks', { count: Math.round(days / 7) });
  if (days < 365)
    return t('relativeTime.months', { count: Math.round(days / 30) });
  return t('relativeTime.years', { count: Math.round(days / 365) });
}
