import { FormEvent, useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { errorMessage } from '../../utils/errors';

interface LinkUserModalProps {
    clientId: string;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (email: string) => Promise<void>;
}

/** Gives an existing account access to this client's portal. */
export function LinkUserModal({ isOpen, onClose, onSubmit }: LinkUserModalProps) {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            setError('Escribe el correo del usuario.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await onSubmit(email.trim());
            onClose();
            setEmail('');
        } catch (err) {
            console.error(err);
            setError(errorMessage(err, 'No se pudo vincular el usuario.'));
            // Don't close modal on error so user can retry
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            dismissible={!isSubmitting}
            size="sm"
            title="Dar acceso al portal"
            description="Verá los proyectos de este cliente, comentará y aprobará entregas, sin poder editarlos. Su cuenta y su propio equipo siguen igual."
            footer={
                <>
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button type="submit" form="link-user-form" isLoading={isSubmitting}>
                        Dar acceso
                    </Button>
                </>
            }
        >
            <form id="link-user-form" onSubmit={handleSubmit}>
                <Input
                    label="Correo del usuario"
                    type="email"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                    }}
                    placeholder="nombre@empresa.com.do"
                    hint="Debe tener una cuenta registrada en ibPulse."
                    error={error || undefined}
                    disabled={isSubmitting}
                    autoFocus
                />
            </form>
        </Modal>
    );
}
