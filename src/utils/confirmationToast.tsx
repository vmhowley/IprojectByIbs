import toast from 'react-hot-toast';
import { ToastConfirm } from '../components/ui/ToastConfirm';

interface ConfirmOptions {
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
}

export const confirmAction = ({
    message,
    onConfirm,
    confirmText = 'Sí',
    cancelText = 'Cancelar'
}: ConfirmOptions) => {
    toast.custom((t) => (
        <ToastConfirm
            t={t}
            message={message}
            onConfirm={onConfirm}
            confirmText={confirmText}
            cancelText={cancelText}
        />
    ), {
        duration: 5000, // Give user enough time to consider
    });
};
