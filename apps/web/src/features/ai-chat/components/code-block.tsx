import { isValidElement, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CopyButton } from './copy-button';

/** Recursively flatten react-markdown's code children back into source text. */
function extractText(node: ReactNode): string {
  if (node == null || node === false) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return extractText(node.props.children);
  }
  return '';
}

/**
 * Wraps a fenced code block (react-markdown passes the inner `<code>` as
 * children) with a language label, copy-code button, and horizontal scroll.
 */
export function CodeBlock({ children }: { children?: ReactNode }) {
  const { t } = useTranslation('aiChat');
  const codeEl = isValidElement<{ className?: string; children?: ReactNode }>(
    children
  )
    ? children
    : null;
  const className = codeEl?.props.className ?? '';
  const lang = /language-(\w+)/.exec(className)?.[1] ?? '';
  const raw = extractText(children).replace(/\n$/, '');

  return (
    <div className='group/code my-3 overflow-hidden rounded-xl border bg-muted/40'>
      <div className='flex items-center justify-between border-b bg-muted/60 py-1 pl-3 pr-1'>
        <span className='text-xs font-medium text-muted-foreground'>
          {lang || t('copy.codeFallback')}
        </span>
        <CopyButton value={raw} label={t('copy.copyCode')} size='icon-xs' />
      </div>
      <pre className='overflow-x-auto p-3 text-xs leading-relaxed [&_code]:bg-transparent [&_code]:p-0'>
        {children}
      </pre>
    </div>
  );
}
