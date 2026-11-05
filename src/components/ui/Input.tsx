import { forwardRef, InputHTMLAttributes, ReactNode, useId } from 'react';
import { cn } from '../../lib/utils';
import { describedBy, FormField } from './FormField';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className = '', wrapperClassName, id, required, ...props },
  ref
) {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <FormField id={fieldId} label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      <input
        ref={ref}
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, hint)}
        className={cn('field', className)}
        {...props}
      />
    </FormField>
  );
});
