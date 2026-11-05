import { ReactNode, useEffect, useState } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';

export interface ConfirmOptions {
  title?: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  /** "danger" for deletions (the default), "primary" for everything else. */
  tone?: 'danger' | 'primary';
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

let enqueue: ((request: PendingConfirm) => void) | null = null;

/**
 * Asks before an action that is hard to undo. Resolves true on confirm.
 * Needs <ConfirmHost /> mounted once (App does it).
 */
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    if (!enqueue) {
      // Host not mounted (should not happen): fall back to the browser dialog.
      const text = typeof options.message === 'string' ? options.message : options.title || '¿Continuar?';
      resolve(window.confirm(text));
      return;
    }
    enqueue({ ...options, resolve });
  });
}

/** Renders the confirmation sheet requested through confirmDialog(). */
export function ConfirmHost() {
  const [queue, setQueue] = useState<PendingConfirm[]>([]);
  const current = queue[0];

  useEffect(() => {
    enqueue = (request) => setQueue((items) => [...items, request]);
    return () => {
      enqueue = null;
    };
  }, []);

  const settle = (confirmed: boolean) => {
    if (!current) return;
    current.resolve(confirmed);
    setQueue((items) => items.slice(1));
  };

  return (
    <Modal
      isOpen={!!current}
      onClose={() => settle(false)}
      title={current?.title || 'Confirmar'}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={() => settle(false)} data-autofocus>
            {current?.cancelText || 'Cancelar'}
          </Button>
          <Button variant={current?.tone === 'primary' ? 'primary' : 'danger'} onClick={() => settle(true)}>
            {current?.confirmText || 'Confirmar'}
          </Button>
        </>
      }
    >
      <div className="text-sm leading-relaxed text-ink-2">{current?.message}</div>
    </Modal>
  );
}
