import type { CSSProperties } from 'react';
import { cn } from '../../lib/utils';
import { hueFor, initials } from '../../utils/format';

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
