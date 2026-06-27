import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { ArrowLeftIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Logo } from '@/components/shared/logo';
import { LanguageSelect } from '@/components/shared/language-select';
import { Button } from '@/components/ui/button';
import i18n, { isLanguage } from '@/i18n';

type DocName = 'terms' | 'privacy';

// Eagerly load every markdown document as a raw string. Keys look like
// '../content/terms.en.md'. Adding a language is just dropping a new file in.
const sources = import.meta.glob<string>('../content/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

function getContent(doc: DocName, lang: string): string {
  return (
    sources[`../content/${doc}.${lang}.md`] ??
    sources[`../content/${doc}.en.md`] ??
    ''
  );
}

interface LegalDocumentProps {
  /** Which document to render — selects the matching markdown file. */
  doc: DocName;
  /** i18n key (in the `legal` namespace) for the page title. */
  titleKey: string;
}

export function LegalDocument({ doc, titleKey }: LegalDocumentProps) {
  const { t } = useTranslation('legal');
  const navigate = useNavigate();
  const lang = isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'en';
  const content = getContent(doc, lang);

  return (
    <div className='mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-6 px-6 py-10'>
      <header className='flex items-center justify-between gap-4'>
        <Link to='/' aria-label='Rinciku'>
          <Logo />
        </Link>
        <LanguageSelect />
      </header>

      <Button
        variant='ghost'
        size='sm'
        className='-ml-2 w-fit'
        onClick={() => navigate(-1)}
      >
        <ArrowLeftIcon data-icon='inline-start' />
        {t('back')}
      </Button>

      <main>
        <h1 className='mb-6 font-heading text-2xl font-semibold tracking-tight'>
          {t(titleKey)}
        </h1>
        <div className='prose prose-sm max-w-none dark:prose-invert prose-headings:font-heading prose-a:text-primary'>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </main>
    </div>
  );
}
