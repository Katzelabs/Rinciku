import { en } from './en';
import { id } from './id';
import type { Copy, Locale } from './types';

const copy: Record<Locale, Copy> = { en, id };

/** Copy object for a locale (defaults to English for unknown values). */
export function getCopy(locale: Locale): Copy {
  return copy[locale] ?? en;
}

/** The other supported locale — used for the language toggle. */
export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'id' : 'en';
}

/** Home path for a locale (`/` for the default, `/id/` otherwise). */
export function localeHref(locale: Locale): string {
  return locale === 'en' ? '/' : `/${locale}/`;
}

/** The web app sign-up URL the CTAs point at. */
export const webAppUrl: string =
  import.meta.env.PUBLIC_WEB_APP_URL ?? 'https://app.rinciku.com';
