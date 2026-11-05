import logoUrl from '../../public/ibpulse-logo.webp';
import markUrl from '../../public/ibpulse-mark.png';
import { cn } from '../../lib/utils';

interface LogoProps {
  /** "full": mark and wordmark. "mark": the red eye alone. */
  variant?: 'full' | 'mark';
  className?: string;
}

/**
 * The ibPulse letterhead. On carbon paper the black wordmark is inverted;
 * the hue turn keeps the red red.
 */
export function Logo({ variant = 'full', className }: LogoProps) {
  if (variant === 'mark') {
    return <img src={markUrl} alt="ibPulse" width={256} height={256} className={cn('h-8 w-8', className)} />;
  }
  return (
    <img
      src={logoUrl}
      alt="ibPulse"
      width={899}
      height={190}
      className={cn('h-7 w-auto dark:[filter:invert(1)_hue-rotate(180deg)]', className)}
    />
  );
}
