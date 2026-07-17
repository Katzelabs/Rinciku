// Support/contact identity shared by web + mobile. The landing site keeps its
// own copy in apps/landing/src/i18n/utils.ts (it does not consume the domain
// packages) — keep the two addresses in sync.
export const SUPPORT_EMAIL = 'help@rinciku.com';

export function supportMailtoUrl(subject?: string): string {
  return subject
    ? `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`
    : `mailto:${SUPPORT_EMAIL}`;
}
