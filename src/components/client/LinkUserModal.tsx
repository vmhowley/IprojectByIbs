import { X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Input } from "../ui/Input";

interface LinkUserModalProps {
    clientId: string;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (email: string) => Promise<void>;
}

export function LinkUserModal({ isOpen, onClose, onSubmit }: LinkUserModalProps) {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            setError('El email es requerido');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await onSubmit(email.trim());
            onClose();
            setEmail('');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error al vincular usuario');
            // Don't close modal on error so user can retry
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-60 flex items-center justify-center">
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={() => !isSubmitting && onClose()}
            />
            <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-200 dark:border-slate-800">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Vincular Usuario Existente</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
                        disabled={isSubmitting}
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-sm p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
                        <p>
                            Ingresa el correo electrónico de un usuario <strong>ya registrado</strong> en la plataforma.
                            Se le concederá acceso al portal de este cliente.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                            Email del Usuario
                        </label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ejemplo@correo.com"
                            disabled={isSubmitting}
                            autoFocus
                            className="w-full"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg animate-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-wait transition-all shadow-sm hover:shadow"
                        >
                            {isSubmitting ? 'Vinculando...' : 'Vincular Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
