import type { Copy } from './types';

export const en: Copy = {
  meta: {
    title: 'Rinciku — Know if you can afford it, before you buy',
    description:
      'An AI money companion for mixed IDR/USD income. Log expenses by chat or photo, see your real budget, and ask “can I buy this?” — grounded in your numbers.',
    ogAlt: 'Rinciku — AI-powered personal finance for mixed-currency income',
  },
  nav: {
    tryFree: 'Try free',
    switchLang: 'ID',
    skipToContent: 'Skip to content',
    features: 'Features',
    how: 'How it works',
    faq: 'FAQ',
  },
  hero: {
    badge: 'AI purchase consultation',
    headline: 'Know if you can afford it,',
    headlineAccent: 'before you buy.',
    subhead:
      'Rinciku is an AI money companion for people with mixed IDR/USD income and variable expenses. Log spending in seconds, then ask the AI whether a purchase fits — grounded in your real budget, not generic advice.',
    cta: 'Try Rinciku free',
    ctaNote: 'Free to start · Web today, iOS & Android coming',
    screenshotAlt:
      'Rinciku AI chat answering how much money is left this month, with essentials still to cover and days remaining',
  },
  problem: {
    heading: 'Most people don’t fail at tracking. They fail at deciding.',
    subhead:
      'You know the feeling — money’s gone before you know where it went, and every purchase is a guess.',
    items: [
      {
        title: 'No visibility',
        body: 'Expenses live in your head, not in one place. By the time you add it up, it’s already spent.',
      },
      {
        title: 'Mixed-currency math',
        body: 'Income and spending in both IDR and USD means constant mental conversion — and unclear totals.',
      },
      {
        title: 'Variable costs',
        body: 'Electricity, food, and fun change every month. Without a baseline, planning ahead is impossible.',
      },
      {
        title: 'Impulse spending',
        body: 'You buy without knowing if you can actually afford it — given what’s left and what’s still due.',
      },
    ],
  },
  differentiator: {
    badge: 'The difference',
    heading: 'AI that reasons about your real budget',
    body: 'Other apps give generic advice. Rinciku answers “can I buy this?” using your actual financial state — so the answer is real.',
    points: [
      {
        title: 'Your income',
        body: 'Total earnings across IDR and USD, unified into one clear number.',
      },
      {
        title: 'Your essentials baseline',
        body: 'The non-negotiables that still need covering this month — rent, bills, groceries.',
      },
      {
        title: 'Spending so far',
        body: 'What you’ve already spent this cycle, by category and tier.',
      },
      {
        title: 'Days remaining',
        body: 'How long your remaining money has to last before the next cycle.',
      },
    ],
    screenshotAlt:
      'Rinciku dashboard showing income, spent, and net totals with a spending trend and needs-vs-wants breakdown',
  },
  features: {
    heading: 'Everything you need, nothing you don’t',
    subhead: 'Built for daily use — fast to log, easy to read.',
    items: [
      {
        emoji: '💬',
        title: 'Log by chat',
        body: 'Type “spent 45k on lunch” and the AI categorizes and records it. No forms.',
      },
      {
        emoji: '📸',
        title: 'Log by photo',
        body: 'Snap a receipt, transfer proof, or e-wallet screenshot — the AI extracts the details.',
      },
      {
        emoji: '🧾',
        title: 'Essentials planner',
        body: 'Define your monthly non-negotiables and get your baseline cost of living.',
      },
      {
        emoji: '💱',
        title: 'Multi-currency',
        body: 'Log in IDR or USD. Everything unifies into one base total automatically.',
      },
      {
        emoji: '🏷️',
        title: 'Needs vs wants',
        body: 'Three tiers — fixed, needs, wants — so you see what’s negotiable at a glance.',
      },
      {
        emoji: '📊',
        title: 'Monthly dashboard',
        body: 'Actual vs budget, category breakdown, days left, and a budget health indicator.',
      },
      {
        emoji: '🎯',
        title: 'Budget targets',
        body: 'Set a limit per category and get a color cue as you approach or pass it.',
      },
    ],
  },
  howItWorks: {
    heading: 'Three steps to clarity',
    subhead: 'Set it up once, then just log and ask.',
    steps: [
      {
        title: 'Set your essentials',
        body: 'List your fixed bills and recurring needs. Rinciku turns them into your monthly baseline — the floor you plan around.',
      },
      {
        title: 'Log by chat or photo',
        body: 'Just say what you spent, or snap a receipt. The AI categorizes it and keeps your budget up to date in real time.',
      },
      {
        title: 'Ask before you spend',
        body: '“Can I buy this Rp 800k keyboard?” Rinciku answers against your real numbers — a clear yes, no, or not yet.',
      },
    ],
  },
  compare: {
    heading: 'Why Rinciku, not another tracker',
    subhead: 'The things that actually change how you spend.',
    colRinciku: 'Rinciku',
    colTypical: 'Typical finance apps',
    rows: [
      {
        feature: 'AI purchase consultation',
        rinciku: 'Core feature',
        typical: 'Not available',
      },
      {
        feature: 'Chat-based logging',
        rinciku: 'Natural language',
        typical: 'Forms only',
      },
      {
        feature: 'Photo / receipt logging',
        rinciku: 'Receipt, transfer & invoice scan',
        typical: 'Basic OCR at best',
      },
      {
        feature: 'Essentials baseline planner',
        rinciku: 'Built in',
        typical: 'Not available',
      },
      {
        feature: 'IDR + USD native support',
        rinciku: 'First-class',
        typical: 'Limited',
      },
      {
        feature: 'Indonesian-context AI',
        rinciku: 'IDR format & local documents',
        typical: 'Generic',
      },
    ],
  },
  faq: {
    heading: 'Questions, answered',
    subhead: 'The things people ask before they start.',
    items: [
      {
        q: 'Is Rinciku free?',
        a: 'Yes — Rinciku is free to use right now, no credit card needed. A paid tier with advanced AI and more storage may come later.',
      },
      {
        q: 'Is my financial data safe?',
        a: 'Your data is yours. Every record is scoped to your account with row-level security, and the AI only ever acts on your own numbers. You review and confirm any change the AI suggests before it’s saved — nothing happens behind your back.',
      },
      {
        q: 'Which currencies does it support?',
        a: 'IDR and USD are first-class. Log an expense or income in either, and Rinciku unifies everything into one base total using a live or fixed exchange rate.',
      },
      {
        q: 'Do I have to type every expense?',
        a: 'No. Tell the AI in plain language (“spent 45k on lunch”) or snap a photo of a receipt, transfer proof, or e-wallet screenshot — it extracts the details and you confirm.',
      },
      {
        q: 'Is there a mobile app?',
        a: 'Rinciku runs in your browser today and works great on mobile. Native iOS and Android apps — sharing the same brain — are on the way.',
      },
      {
        q: 'How is the AI’s advice different?',
        a: 'It’s grounded, not generic. When you ask “can I buy this?”, the AI reasons against your real income, essentials still due, spending so far, and days left in the month — then gives a clear answer.',
      },
    ],
  },
  cta: {
    heading: 'Start deciding with confidence',
    body: 'Set up your budget in minutes and let the AI do the math — so you always know where you stand.',
    button: 'Try Rinciku free',
    note: 'Free to start · No credit card',
  },
  footer: {
    tagline: 'Your AI money companion for mixed-currency life.',
    madeWith: 'Made for young Indonesians — and anyone with irregular income.',
    github: 'GitHub',
    contact: 'Contact',
    privacy: 'Privacy',
    terms: 'Terms',
    rights: 'All rights reserved.',
  },
};
