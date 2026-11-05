import { ChevronDown } from 'lucide-react';
import { forwardRef, ReactNode, SelectHTMLAttributes, useId } from 'react';
import { cn } from '../../lib/utils';
import { describedBy, FormField } from './FormField';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: ReactNode;
  options?: { value: string; label: string }[];
  children?: ReactNode;
  wrapperClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, options, children, className = '', wrapperClassName, id, required, ...props },
  ref
) {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <FormField id={fieldId} label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      <div className="relative">
        <select
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(fieldId, error, hint)}
          className={cn('field appearance-none pr-8', className)}
          {...props}
        >
          {options
            ? options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown
          size={15}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3"
          aria-hidden="true"
        />
      </div>
    </FormField>
  );
});
