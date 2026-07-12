import { cn } from '@/lib/utils';

/**
 * Rinciku brand mark — lowercase “r.” (cream glyph + lime full stop) on the
 * warm dark ground, mirroring the mobile app icon 1:1. Colors are fixed brand
 * values (not theme tokens) so the mark reads identically on light and dark
 * grounds, like the app icon does on a home screen. The standalone brand
 * assets live in `assets/logo/` at the repo root.
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
      <defs>
        <radialGradient id='rk-mark-ground' cx='50%' cy='38%' r='80%'>
          <stop offset='0%' stopColor='#26261C' />
          <stop offset='100%' stopColor='#131310' />
        </radialGradient>
      </defs>
      <rect width='100' height='100' rx='25' fill='url(#rk-mark-ground)' />
      <path
        d='M 41 68.4 V 46.9 Q 41 38.7 49.2 38.7 H 54.7'
        fill='none'
        stroke='#FBFBF9'
        strokeWidth='10.2'
        strokeLinecap='round'
      />
      <circle cx='65.2' cy='63.3' r='5.1' fill='#9AE600' />
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
