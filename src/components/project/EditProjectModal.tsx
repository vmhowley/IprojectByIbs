import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { clientService } from '../../services/clientService';
import { projectService } from '../../services/projectService';
import { Client, Project } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

import { Textarea } from '../ui/Textarea';
import { UserPicker } from '../ui/UserPicker';

interface EditProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    onProjectUpdated: (updatedProject: Project) => void;
}

export function EditProjectModal({ isOpen, onClose, project, onProjectUpdated }: EditProjectModalProps) {
    const [name, setName] = useState(project.name);
    const [description, setDescription] = useState(project.description || '');
    const [status, setStatus] = useState(project.status);
    const [priority, setPriority] = useState(project.priority || 'medium');
    const [startDate, setStartDate] = useState(project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '');
    const [endDate, setEndDate] = useState(project.end_date ? new Date(project.end_date).toISOString().split('T')[0] : '');
    const [clientId, setClientId] = useState(project.client_id || '');
    const [assignee, setAssignee] = useState(project.assignee || '');
    const [useCaseId, setUseCaseId] = useState(project.use_case_id || '');
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);

    useEffect(() => {
        if (isOpen) {
            // Reset form to latest project prop values
            setName(project.name);
            setDescription(project.description || '');
            setStatus(project.status);
            setPriority(project.priority || 'medium');
            setStartDate(project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '');
            setEndDate(project.end_date ? new Date(project.end_date).toISOString().split('T')[0] : '');
            setClientId(project.client_id || '');
            setAssignee(project.assignee || null);
            setUseCaseId(project.use_case_id || '');
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const updated = await projectService.update(project.id, {
                name,
                description,
                status: status as 'active' | 'completed' | 'on_hold',
                priority: priority as 'low' | 'medium' | 'high',
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                client_id: clientId || undefined,
                assignee: assignee || undefined,
                use_case_id: useCaseId || undefined
            });
            onProjectUpdated(updated);
            onClose();
        } catch (error) {
            console.error('Error updating project:', error);
            alert('Failed to update project');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0  z-60 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-2xl w-full max-w-lg relative animate-in fade-in zoom-in-95 duration-200 border border-gray-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-6 pb-0">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Editar Proyecto</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Nombre del Proyecto"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                            Número de Caso de Uso
                        </label>
                        <Input
                            value={useCaseId}
                            onChange={(e) => setUseCaseId(e.target.value)}
                            placeholder="Ej: CU-123"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                            Descripción
                        </label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Estado"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as any)}
                            options={[
                                { value: 'active', label: 'Activo' },
                                { value: 'on_hold', label: 'En Espera' },
                                { value: 'completed', label: 'Completado' },
                            ]}
                        />
                        <Select
                            label="Prioridad"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as any)}
                            options={[
                                { value: 'low', label: 'Baja' },
                                { value: 'medium', label: 'Media' },
                                { value: 'high', label: 'Alta' },
                            ]}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            type="date"
                            label="Fecha Inicio"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <Input
                            type="date"
                            label="Fecha Fin"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>

                    <Select
                        label="Cliente Asignado"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        options={[
                            { value: '', label: 'Sin Cliente' },
                            ...clients.map(c => ({ value: c.id, label: c.name }))
                        ]}
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                            Responsable del Proyecto
                        </label>
                        <UserPicker
                            value={assignee}
                            onChange={(id) => setAssignee(id || '')}
                            placeholder="Seleccionar responsable..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" isLoading={loading}>
                            Guardar Cambios
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
