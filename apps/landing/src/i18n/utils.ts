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

/** Base URL of the deployed web app (no trailing slash). */
export const webAppUrl: string = (
  import.meta.env.PUBLIC_WEB_APP_URL ?? 'https://app.rinciku.com'
).replace(/\/$/, '');

/** Where the "Try free" CTA sends visitors. */
export const signUpUrl = `${webAppUrl}/sign-up`;

/** Legal pages live on the web app. */
export const privacyUrl = `${webAppUrl}/privacy`;
export const termsUrl = `${webAppUrl}/terms`;

/** Optional public repo link for the footer. */
export const githubUrl: string =
  import.meta.env.PUBLIC_GITHUB_URL ?? 'https://github.com/rinciku';
