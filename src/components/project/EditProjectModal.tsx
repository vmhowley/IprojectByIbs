import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { usePermissions } from '../../hooks/usePermissions';
import { clientService } from '../../services/clientService';
import { projectService } from '../../services/projectService';
import { Client, Project } from '../../types';
import { ContactPicker } from '../client/ContactPicker';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { UserPicker } from '../ui/UserPicker';
import { CURRENCY_OPTIONS, TEAM_OPTIONS } from './NewProjectModal';

interface EditProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    onProjectUpdated: (updatedProject: Project) => void;
}

const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : '');

export function EditProjectModal({ isOpen, onClose, project, onProjectUpdated }: EditProjectModalProps) {
    const { isAdmin } = usePermissions();
    const [name, setName] = useState(project.name);
    const [description, setDescription] = useState(project.description || '');
    const [status, setStatus] = useState(project.status);
    const [priority, setPriority] = useState(project.priority || 'medium');
    const [startDate, setStartDate] = useState(toDateInput(project.start_date));
    const [endDate, setEndDate] = useState(toDateInput(project.end_date));
    const [clientId, setClientId] = useState(project.client_id || '');
    const [contactId, setContactId] = useState(project.contact_id || '');
    const [team, setTeam] = useState(project.team || '');
    const [assignee, setAssignee] = useState(project.assignee || '');
    const [useCaseId, setUseCaseId] = useState(project.use_case_id || '');
    const [cost, setCost] = useState<string | number>(project.cost ?? '');
    const [currency, setCurrency] = useState(project.currency || 'DOP');
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);

    useEffect(() => {
        if (isOpen) {
            // Reset form to latest project prop values
            setName(project.name);
            setDescription(project.description || '');
            setStatus(project.status);
            setPriority(project.priority || 'medium');
            setStartDate(toDateInput(project.start_date));
            setEndDate(toDateInput(project.end_date));
            setClientId(project.client_id || '');
            setContactId(project.contact_id || '');
            setTeam(project.team || '');
            setAssignee(project.assignee || '');
            setUseCaseId(project.use_case_id || '');
            setCost(project.cost ?? '');
            setCurrency(project.currency || 'DOP');
            loadClients();
        }
    }, [isOpen, project]);

    const loadClients = async () => {
        try {
            const data = await clientService.getAll();
            setClients(data);
        } catch (err) {
            console.error("Failed to load clients", err);
        }
    }

    const dateError = startDate && endDate && endDate < startDate ? 'La entrega no puede ser antes del inicio.' : undefined;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (dateError) return;
        setLoading(true);
        try {
            const updated = await projectService.update(project.id, {
                name,
                description,
                status: status as 'active' | 'completed' | 'on_hold',
                priority: priority as 'low' | 'medium' | 'high',
                // null, not undefined: a cleared field must be saved as empty.
                start_date: startDate || null,
                end_date: endDate || null,
                client_id: clientId || null,
                contact_id: contactId || null,
                assignee: assignee || null,
                use_case_id: useCaseId || null,
                team: team || null,
                // Only admins see the price, so only they can change it.
                ...(isAdmin() ? { cost: cost !== '' ? Number(cost) : null, currency: currency || 'DOP' } : {}),
            });
            onProjectUpdated(updated);
            toast.success('Cambios guardados');
            onClose();
        } catch (error) {
            console.error('Error updating project:', error);
            toast.error('No se pudieron guardar los cambios. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            dismissible={!loading}
            size="lg"
            title="Editar proyecto"
            description={project.name}
            footer={
                <>
                    <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button type="submit" form="edit-project-form" isLoading={loading} disabled={!name.trim() || !!dateError}>
                        Guardar cambios
                    </Button>
                </>
            }
        >
            <form id="edit-project-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                    label="Nombre del proyecto"
                    wrapperClassName="sm:col-span-2"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />

                <Select
                    label="Cliente"
                    value={clientId}
                    onChange={(e) => {
                        setClientId(e.target.value);
                        setContactId('');
                    }}
                    options={[
                        { value: '', label: 'Sin cliente' },
                        ...clients.map(c => ({ value: c.id, label: c.name }))
                    ]}
                />

                <FormField id="edit-project-contact" label="Contacto del cliente">
                    <ContactPicker id="edit-project-contact" clientId={clientId || undefined} value={contactId} onChange={(id) => setContactId(id)} />
                </FormField>

                <Input
                    label="N° caso de uso"
                    value={useCaseId}
                    onChange={(e) => setUseCaseId(e.target.value)}
                    placeholder="Ej.: CU-123"
                    className="font-mono"
                />

                <FormField id="edit-project-assignee" label="Responsable">
                    <UserPicker
                        id="edit-project-assignee"
                        value={assignee}
                        onChange={(id) => setAssignee(id || '')}
                        placeholder="Sin responsable"
                    />
                </FormField>

                <Select label="Equipo" value={team} onChange={(e) => setTeam(e.target.value)} options={TEAM_OPTIONS} />

                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Estado"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as Project['status'])}
                        options={[
                            { value: 'active', label: 'Activo' },
                            { value: 'on_hold', label: 'En espera' },
                            { value: 'completed', label: 'Completado' },
                        ]}
                    />
                    <Select
                        label="Prioridad"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as Project['priority'])}
                        options={[
                            { value: 'low', label: 'Baja' },
                            { value: 'medium', label: 'Media' },
                            { value: 'high', label: 'Alta' },
                        ]}
                    />
                </div>

                <Input type="date" label="Inicio" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <Input type="date" label="Entrega" value={endDate} onChange={(e) => setEndDate(e.target.value)} error={dateError} />

                {isAdmin() && (
                    <>
                        <Input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            label="Precio (cotización)"
                            placeholder="0.00"
                            value={cost}
                            onChange={(e) => setCost(e.target.value)}
                            hint="Lo que paga el cliente. Déjalo vacío si aún no hay precio."
                            className="text-right tabular-nums"
                        />
                        <Select label="Moneda" value={currency} onChange={(e) => setCurrency(e.target.value)} options={CURRENCY_OPTIONS} />
                    </>
                )}

                <Textarea
                    label="Descripción"
                    wrapperClassName="sm:col-span-2"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                />
            </form>
        </Modal>
    );
}
