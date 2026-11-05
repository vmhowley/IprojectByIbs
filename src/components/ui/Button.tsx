import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '../../lib/utils';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  children: ReactNode;
}

// Primary is the brand ink: one per view. Danger never looks like primary:
// it is an outline until the pointer is on it.
const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand text-on-brand border-brand shadow-control hover:bg-brand-strong hover:border-brand-strong',
  secondary: 'bg-raised text-ink border-rule-field shadow-control hover:border-rule-strong hover:bg-well',
  danger: 'bg-paper text-st-red border-st-red/50 hover:bg-st-red hover:text-on-brand hover:border-st-red',
  ghost: 'bg-transparent text-ink-2 border-transparent hover:bg-ink/[0.06] hover:text-ink',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-2.5 text-[13px] gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2',
  lg: 'h-11 px-5 text-[15px] gap-2',
  icon: 'h-9 w-9 p-0',
};

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg className={cn('h-4 w-4 animate-spin', className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', isLoading, className, children, disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-control border font-semibold',
        'transition-[background-color,border-color,color,box-shadow] duration-150 active:translate-y-px active:shadow-none',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {isLoading && <Spinner />}
      {children}
    </button>
  );
});
