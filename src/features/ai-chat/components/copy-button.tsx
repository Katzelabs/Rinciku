import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type Props = {
  value: string;
  label?: string;
  size?: 'icon-xs' | 'icon-sm' | 'icon';
  className?: string;
};

/**
 * Copy-to-clipboard button with a transient checkmark. Clipboard may be
 * unavailable in an insecure context, so failures are swallowed silently.
 */
export function CopyButton({
  value,
  label = 'Copy',
  size = 'icon-sm',
  className,
}: Props) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (insecure context) — fail silently.
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type='button'
          variant='ghost'
          size={size}
          onClick={copy}
          aria-label={label}
          className={cn(
            'text-muted-foreground hover:text-foreground',
            className
          )}
        >
          {copied ? (
            <Check className='size-3.5 text-primary' />
          ) : (
            <Copy className='size-3.5' />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{copied ? 'Copied' : label}</TooltipContent>
    </Tooltip>
  );
}
