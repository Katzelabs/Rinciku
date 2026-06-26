import { CopyButton } from './copy-button';

/** Toolbar shown under an assistant message. */
export function MessageActions({ content }: { content: string }) {
  return (
    <div className='flex items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover/msg:opacity-100 max-md:opacity-100'>
      <CopyButton value={content} label='Copy message' size='icon-sm' />
    </div>
  );
}
