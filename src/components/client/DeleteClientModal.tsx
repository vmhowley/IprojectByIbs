import { FormEvent, useState } from "react";
import { Client } from "../../types/Client";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";

interface DeleteClientModalProps {
    client: Client;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    /** Things that keep the client in use: the database refuses the delete while they exist. */
    blockers?: string[];
}

export function DeleteClientModal({ client, isOpen, onClose, onConfirm, blockers = [] }: DeleteClientModalProps) {
    const [confirmationName, setConfirmationName] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const blocked = blockers.length > 0;
    const isValidMatch = confirmationName.trim() === client.name;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!isValidMatch || blocked) return;

        setIsDeleting(true);
        setError(null);

        try {
            await onConfirm();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo eliminar el cliente.');
            setIsDeleting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            dismissible={!isDeleting}
            size="sm"
            title="Eliminar cliente"
            description={client.name}
            footer={
                <>
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isDeleting} data-autofocus={blocked || undefined}>
                        {blocked ? 'Entendido' : 'Cancelar'}
                    </Button>
                    {!blocked && (
                        <Button type="submit" form="delete-client-form" variant="danger" isLoading={isDeleting} disabled={!isValidMatch}>
                            Eliminar cliente
                        </Button>
                    )}
                </>
            }
        >
            {blocked ? (
                <div className="space-y-3 text-sm text-ink-2">
                    <p>Este cliente todavía está en uso, así que no se puede eliminar:</p>
                    <ul className="list-disc space-y-1 pl-5 text-ink">
                        {blockers.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                    <p>Pasa esos proyectos a otro cliente, elimínalos o quita el acceso al portal, y vuelve a intentarlo.</p>
                </div>
            ) : (
                <form id="delete-client-form" onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-sm text-ink-2">
                        Se eliminará <strong className="font-semibold text-ink">{client.name}</strong> junto con sus contactos.
                        Esta acción no se puede deshacer.
                    </p>
                    <Input
                        label="Escribe el nombre del cliente para confirmar"
                        value={confirmationName}
                        onChange={(e) => setConfirmationName(e.target.value)}
                        placeholder={client.name}
                        disabled={isDeleting}
                        autoComplete="off"
                        autoFocus
                        error={error || undefined}
                    />
                </form>
            )}
        </Modal>
    );
}
