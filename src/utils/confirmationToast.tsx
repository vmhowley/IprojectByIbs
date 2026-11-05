import { ReactNode } from 'react';
import { confirmDialog } from '../components/ui/ConfirmDialog';

interface ConfirmOptions {
    message: ReactNode;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    title?: string;
    tone?: 'danger' | 'primary';
}

// Kept for existing callers. The question is now a focused dialog instead of a
// toast that disappeared after five seconds.
export const confirmAction = ({
    message,
    onConfirm,
    confirmText = 'Sí',
    cancelText = 'Cancelar',
    title,
    tone
}: ConfirmOptions) => {
    confirmDialog({ message, confirmText, cancelText, title, tone }).then((confirmed) => {
        if (confirmed) onConfirm();
    });
};
