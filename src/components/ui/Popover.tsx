import { CSSProperties, ReactNode, RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

interface PopoverProps {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  align?: 'start' | 'end';
  matchWidth?: boolean;
  placement?: 'auto' | 'top' | 'bottom';
  className?: string;
  role?: string;
  id?: string;
}

/**
 * Floating panel rendered in a portal with fixed positioning, so it is never
 * clipped by a scrolling container or a modal.
 */
export function Popover({
  anchorRef,
  open,
  onClose,
  children,
  align = 'start',
  matchWidth = false,
  placement = 'auto',
  className,
  role,
  id,
}: PopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({ position: 'fixed', visibility: 'hidden' });

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const anchor = anchorRef.current;
      const panel = panelRef.current;
      if (!anchor || !panel) return;
      const rect = anchor.getBoundingClientRect();
      const width = matchWidth ? rect.width : panel.offsetWidth;
      const height = panel.offsetHeight;
      const below = window.innerHeight - rect.bottom;
      const up = placement === 'top' || (placement === 'auto' && below < height + 12 && rect.top > below);
      const top = up ? Math.max(8, rect.top - height - 4) : Math.min(window.innerHeight - height - 8, rect.bottom + 4);
      let left = align === 'end' ? rect.right - width : rect.left;
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
      setStyle({
        position: 'fixed',
        top,
        left,
        width: matchWidth ? rect.width : undefined,
        visibility: 'visible',
      });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, anchorRef, align, matchWidth, placement]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      onClose();
    };
    // Capture phase: Escape closes this panel before an enclosing dialog sees it.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      onClose();
      anchorRef.current?.focus();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      id={id}
      role={role}
      style={style}
      className={cn('sheet z-[70] overflow-hidden shadow-lift animate-sheet-in', className)}
    >
      {children}
    </div>,
    document.body
  );
}
