import type { CSSProperties } from 'react';
import { cn } from '../../lib/utils';
import { initials } from '../../utils/format';

// Hues for people, spread around the wheel and clear of the logo red, so a seal never reads as an alert.
const HUES = [55, 95, 140, 180, 215, 250, 285, 320];

/** The same name always gets the same hue. */
function hueFor(name?: string | null): number {
  if (!name) return 250;
  let hash = 0;
  for (const ch of name.trim().toLowerCase()) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return HUES[hash % HUES.length];
}

interface AvatarProps {
  name?: string | null;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE = {
  xs: 'h-[22px] w-[22px] text-2xs',
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
};

/** A person's initials pressed into a round seal, or their photo. */
export function Avatar({ name, src, size = 'sm', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || ''}
        className={cn('shrink-0 rounded-full object-cover ring-1 ring-rule', SIZE[size], className)}
      />
    );
  }
  return (
    <span
      aria-hidden={name ? undefined : true}
      title={name || undefined}
      style={{ '--av-h': hueFor(name) } as CSSProperties}
      className={cn(
        'avatar-tint inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold tracking-tight',
        SIZE[size],
        className
      )}
    >
      {initials(name)}
    </span>
  );
}
