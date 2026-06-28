import { useTranslation } from 'react-i18next';
import { AssistantLabel } from './chat-message';

export function TypingIndicator() {
  const { t } = useTranslation('aiChat');
  return (
    <div className='flex w-full flex-col gap-2 duration-300 animate-in fade-in slide-in-from-bottom-1'>
      <AssistantLabel />
      <div className='flex items-center gap-1 py-1'>
        <span className='size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]' />
        <span className='size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]' />
        <span className='size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]' />
        <span className='sr-only'>{t('message.thinking')}</span>
      </div>
    </div>
  );
}
