// Support/contact identity shared by web + mobile. The landing site keeps its
// own copy in apps/landing/src/i18n/utils.ts (it does not consume the domain
// packages) — keep the two addresses in sync.
export const SUPPORT_EMAIL = 'help@rinciku.com';

export function supportMailtoUrl(subject?: string): string {
  return subject
    ? `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`
    : `mailto:${SUPPORT_EMAIL}`;
}

// Legal pages are hosted on the landing site (EN at the bare path, ID under
// /id/) — the same URLs the store listings point at.
export const LANDING_URL = 'https://rinciku.com';

/** `locale` is an i18next language tag; anything starting 'id' gets /id/. */
export function privacyPolicyUrl(locale?: string): string {
  return locale?.startsWith('id')
    ? `${LANDING_URL}/id/privacy/`
    : `${LANDING_URL}/privacy/`;
}

export function termsOfServiceUrl(locale?: string): string {
  return locale?.startsWith('id')
    ? `${LANDING_URL}/id/terms/`
    : `${LANDING_URL}/terms/`;
}
