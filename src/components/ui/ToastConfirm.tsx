import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface ToastConfirmProps {
    t: any; // Toast object from react-hot-toast
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
}

export const ToastConfirm = ({
    t,
    message,
    onConfirm,
    confirmText = 'Sí',
    cancelText = 'Cancelar'
}: ToastConfirmProps) => {
    return (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
            <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                    <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                            {message}
                        </p>
                    </div>
                </div>
                <div className="mt-4 flex gap-3">
                    <button
                        onClick={() => {
                            onConfirm();
                            toast.dismiss(t.id);
                        }}
                        className="bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                    >
                        {confirmText}
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
            <div className="flex border-l border-gray-200">
                <button
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};
