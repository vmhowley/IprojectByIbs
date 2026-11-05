import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** A red rule across the top, like the head of a printed form. */
  ruled?: boolean;
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

/** A sheet of paper. Sheets sit on the desk; they are never nested. */
export function Card({ children, className = '', padding = 'md', ruled = false, ...props }: CardProps) {
  return (
    <div className={cn('sheet relative', ruled && 'border-t-2 border-t-brand', paddingClasses[padding], className)} {...props}>
      {children}
    </div>
  );
}

export { Card as Sheet };
