import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface FormFieldProps {
  id: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/** Label above, the cell, then the hint or the error, like a printed form. */
export function FormField({ id, label, hint, error, required, className, children }: FormFieldProps) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={id} className="caption mb-1.5 block">
          {label}
          {required && <span className="ml-0.5 text-st-red" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-[13px] font-medium text-st-red">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function describedBy(id: string, error?: string, hint?: ReactNode) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}
