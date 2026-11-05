import { forwardRef, ReactNode, TextareaHTMLAttributes, useId } from 'react';
import { cn } from '../../lib/utils';
import { describedBy, FormField } from './FormField';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: ReactNode;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className = '', wrapperClassName, id, required, ...props },
  ref
) {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <FormField id={fieldId} label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      <textarea
        ref={ref}
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, hint)}
        className={cn('field min-h-[5.5rem] resize-y leading-relaxed', className)}
        {...props}
      />
    </FormField>
  );
});
