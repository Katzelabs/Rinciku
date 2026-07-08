export type Locale = 'en' | 'id';

export interface TitledItem {
  title: string;
  body: string;
}

export interface FeatureItem {
  emoji: string;
  title: string;
  body: string;
}

export interface Step {
  title: string;
  body: string;
}

export interface CompareRow {
  feature: string;
  rinciku: string;
  typical: string;
}

export interface QA {
  q: string;
  a: string;
}

/**
 * The full copy shape for one locale. Both `en` and `id` must satisfy this
 * exactly, so TypeScript flags any string that drifts or goes missing.
 */
export interface Copy {
  meta: {
    title: string;
    description: string;
    ogAlt: string;
  };
  nav: {
    tryFree: string;
    /** Label shown on the language toggle for the *other* locale. */
    switchLang: string;
    /** Skip-to-content link text (keyboard/screen-reader accessibility). */
    skipToContent: string;
  };
  hero: {
    badge: string;
    headline: string;
    headlineAccent: string;
    subhead: string;
    cta: string;
    ctaNote: string;
    screenshotAlt: string;
  };
  problem: {
    heading: string;
    subhead: string;
    items: TitledItem[];
  };
  differentiator: {
    badge: string;
    heading: string;
    body: string;
    points: TitledItem[];
    screenshotAlt: string;
  };
  features: {
    heading: string;
    subhead: string;
    items: FeatureItem[];
  };
  howItWorks: {
    heading: string;
    subhead: string;
    steps: Step[];
  };
  compare: {
    heading: string;
    subhead: string;
    colRinciku: string;
    colTypical: string;
    rows: CompareRow[];
  };
  faq: {
    heading: string;
    subhead: string;
    items: QA[];
  };
  cta: {
    heading: string;
    body: string;
    button: string;
    note: string;
  };
  footer: {
    tagline: string;
    madeWith: string;
    github: string;
    privacy: string;
    terms: string;
    rights: string;
  };
}
