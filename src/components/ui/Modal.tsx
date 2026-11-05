import { X } from 'lucide-react';
import { ReactNode, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  /** One line under the title: what this form does. */
  description?: ReactNode;
  /** Top-right box of the form: document type and number. */
  meta?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Disable closing by Escape or by clicking outside while saving. */
  dismissible?: boolean;
  bodyClassName?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

// Open dialogs, newest last. Only the top one answers Escape and Tab, so a
// form opened from another form closes alone.
const openStack: symbol[] = [];

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** A form sheet placed over the desk. Traps focus and returns it on close. */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  meta,
  children,
  footer,
  size = 'md',
  dismissible = true,
  bodyClassName,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const dismissibleRef = useRef(dismissible);
  dismissibleRef.current = dismissible;

  // What had focus before opening. Read during render because React's
  // autoFocus moves focus into the dialog before any effect runs.
  const returnFocusRef = useRef<HTMLElement | null>(null);
  if (isOpen && !returnFocusRef.current && typeof document !== 'undefined') {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
  }

  useEffect(() => {
    if (!isOpen) return;
    const panel = panelRef.current;
    // Keep a field that autoFocus already chose; otherwise pick the marked or first control.
    if (!panel?.contains(document.activeElement)) {
      const first = panel?.querySelector<HTMLElement>('[autofocus], [data-autofocus]') ||
        panel?.querySelector<HTMLElement>(FOCUSABLE);
      (first || panel)?.focus();
    }

    const token = Symbol('modal');
    openStack.push(token);

    const onKeyDown = (event: KeyboardEvent) => {
      if (openStack[openStack.length - 1] !== token) return;
      if (event.key === 'Escape' && dismissibleRef.current) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null
      );
      if (focusable.length === 0) return;
      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === firstEl) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      openStack.splice(openStack.indexOf(token), 1);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      const target = returnFocusRef.current;
      returnFocusRef.current = null;
      target?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-[oklch(0.18_0.02_260/0.45)] animate-fade"
        onClick={dismissible ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'sheet relative flex max-h-[92vh] w-full flex-col border-t-2 border-t-brand shadow-lift animate-sheet-in focus:outline-none',
          'rounded-b-none sm:rounded-[var(--radius-sheet)]',
          sizeClasses[size]
        )}
      >
        {(title || meta) && (
          <header className="flex items-start justify-between gap-4 border-b border-rule px-5 pb-3.5 pt-4">
            <div className="min-w-0">
              {title && (
                <h2 id={titleId} className="text-lg font-semibold leading-tight text-ink">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descriptionId} className="mt-1 text-[13px] text-ink-2">
                  {description}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-start gap-3">
              {meta}
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="-mr-1.5 -mt-0.5 rounded-control p-1.5 text-ink-3 transition-colors hover:bg-ink/[0.06] hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>
          </header>
        )}
        <div className={cn('min-h-0 flex-1 overflow-y-auto px-5 py-4', bodyClassName)}>{children}</div>
        {footer && (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-rule bg-well px-5 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body
  );
}
