import { cn } from '@/lib/utils';

/**
 * Rinciku brand mark — three descending lines inside a rounded square.
 * Theme-aware: the square uses `--primary` and the lines `--primary-foreground`,
 * so it tracks the app palette (and flips automatically in dark mode).
 * The standalone forest-green brand assets live in `logo/`.
 */
export function LogoMark({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      viewBox='0 0 100 100'
      role='img'
      aria-label='Rinciku'
      className={cn('size-8', className)}
      {...props}
    >
      <rect width='100' height='100' rx='25' className='fill-primary' />
      <rect
        x='16'
        y='28'
        width='68'
        height='12'
        rx='6'
        className='fill-primary-foreground'
        opacity='0.93'
      />
      <rect
        x='16'
        y='46'
        width='48'
        height='12'
        rx='6'
        className='fill-primary-foreground'
        opacity='0.65'
      />
      <rect
        x='16'
        y='64'
        width='30'
        height='12'
        rx='6'
        className='fill-primary-foreground'
        opacity='0.37'
      />
    </svg>
  );
}

/** Horizontal lockup: brand mark + wordmark. */
export function Logo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn('flex items-center gap-2 text-foreground', className)}>
      <LogoMark aria-hidden className={markClassName} />
      <span className='font-heading text-lg font-semibold tracking-tight'>
        Rinciku
      </span>
    </span>
  );
}
