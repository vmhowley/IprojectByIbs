import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
// Assuming Project and Client types
import { clientService } from '../../services/clientService';
import { projectService } from '../../services/projectService';
import { Client, Project } from '../../types';
import { Button } from '../ui/Button';

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
                start_date: startDate || null,
                end_date: endDate || null,
                client_id: clientId || null, // Allow clearing client if needed, or enforce it
                use_case_id: useCaseId || null
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold text-gray-900 mb-6">Editar Proyecto</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Nombre del Proyecto"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Número de Caso de Uso
                        </label>
                        <Input
                            value={useCaseId}
                            onChange={(e) => setUseCaseId(e.target.value)}
                            placeholder="Ej: CU-123"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
            </Card>
        </div>
    );
}
