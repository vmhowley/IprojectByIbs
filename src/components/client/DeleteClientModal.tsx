import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Client } from "../../types/Client";
import { Input } from "../ui/Input";

interface DeleteClientModalProps {
    client: Client;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}

export function DeleteClientModal({ client, isOpen, onClose, onConfirm }: DeleteClientModalProps) {
    const [confirmationName, setConfirmationName] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isValidMatch = confirmationName.trim() === client.name;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValidMatch) return;

        setIsDeleting(true);
        setError(null);

        try {
            await onConfirm();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al eliminar el cliente');
            setIsDeleting(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-60 flex items-center justify-center">
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => !isDeleting && onClose()}
            />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-700">
                        <AlertTriangle size={20} />
                        <h2 className="text-lg font-bold">Eliminar Cliente</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        disabled={isDeleting}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-6">
                        <p className="text-gray-700 mb-2">
                            Esta acción es <strong>irreversible</strong>. Se eliminará el cliente
                            <span className="text-red-600 font-bold"> "{client.name}"</span> y todos sus datos asociados.
                        </p>
                        <p className="text-sm text-gray-500">
                            Para confirmar, escribe el nombre del cliente a continuación:
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            value={confirmationName}
                            onChange={(e) => setConfirmationName(e.target.value)}
                            placeholder={client.name}
                            disabled={isDeleting}
                            autoFocus
                            className={isValidMatch ? 'border-red-500 focus:ring-red-500' : ''}
                        />

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={!isValidMatch || isDeleting}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                            >
                                {isDeleting ? 'Eliminando...' : 'Eliminar Permanentemente'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
}
