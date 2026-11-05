import { FormEvent, useEffect, useState } from 'react';
import { requestTypeService, TicketRequestType } from '../../services/requestTypeService';
import { Project } from '../../types';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { UserPicker } from '../ui/UserPicker';

export interface QuickTaskData {
  project_id: string;
  subject: string;
  request_type: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  assigned_to: string | null;
  deadline: string;
  description: string;
}

interface NewTaskModalProps {
  projects: Project[];
  defaultProjectId?: string;
  onClose: () => void;
  onSubmit: (task: QuickTaskData) => Promise<void>;
}

/** Quick ticket from the task list: pick the project and write the essentials. */
export function NewTaskModal({ projects, defaultProjectId, onClose, onSubmit }: NewTaskModalProps) {
  const [data, setData] = useState<QuickTaskData>({
    project_id: defaultProjectId || '',
    subject: '',
    request_type: 'feature',
    urgency: 'medium',
    assigned_to: null,
    deadline: '',
    description: '',
  });
  const [requestTypes, setRequestTypes] = useState<TicketRequestType[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    requestTypeService.getAll().then(setRequestTypes).catch((err) => console.error('Error loading request types', err));
  }, []);

  const set = <K extends keyof QuickTaskData>(key: K, value: QuickTaskData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!data.project_id || !data.subject.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ ...data, subject: data.subject.trim() });
      onClose();
    } catch (err) {
      console.error(err);
      setError('No se pudo crear el ticket. Revisa los datos e inténtalo de nuevo.');
      setSaving(false);
    }
  };

  // Open projects first: they are where new work goes.
  const sortedProjects = [...projects].sort((a, b) => {
    const rank = (p: Project) => (p.status === 'active' ? 0 : p.status === 'on_hold' ? 1 : 2);
    return rank(a) - rank(b) || a.name.localeCompare(b.name);
  });

  return (
    <Modal
      isOpen
      onClose={onClose}
      dismissible={!saving}
      size="md"
      title="Ticket rápido"
      description="Lo esencial para registrarlo. El resto se completa en el ticket."
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="quick-task-form" isLoading={saving} disabled={!data.project_id || !data.subject.trim()}>
            Crear ticket
          </Button>
        </>
      }
    >
      <form id="quick-task-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Proyecto"
          wrapperClassName="sm:col-span-2"
          value={data.project_id}
          onChange={(e) => set('project_id', e.target.value)}
          required
        >
          <option value="">Elige el proyecto…</option>
          {sortedProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.clients?.name ? `${p.clients.name} — ` : ''}{p.name}
            </option>
          ))}
        </Select>

        <Input
          label="Asunto"
          wrapperClassName="sm:col-span-2"
          value={data.subject}
          onChange={(e) => set('subject', e.target.value)}
          placeholder="Qué hay que hacer"
          required
          autoFocus
        />

        <Select label="Tipo de solicitud" value={data.request_type} onChange={(e) => set('request_type', e.target.value)}>
          {requestTypes.length === 0 ? (
            <option value="feature">Requerimiento de adecuación</option>
          ) : (
            requestTypes.map((t) => <option key={t.id} value={t.value}>{t.label}</option>)
          )}
        </Select>

        <Select
          label="Prioridad"
          value={data.urgency}
          onChange={(e) => set('urgency', e.target.value as QuickTaskData['urgency'])}
          options={[
            { value: 'low', label: 'Baja' },
            { value: 'medium', label: 'Media' },
            { value: 'high', label: 'Alta' },
            { value: 'critical', label: 'Crítica' },
          ]}
        />

        <FormField id="quick-task-assignee" label="Asignado a">
          <UserPicker id="quick-task-assignee" value={data.assigned_to} onChange={(id) => set('assigned_to', id)} />
        </FormField>

        <Input type="date" label="Fecha límite" value={data.deadline} onChange={(e) => set('deadline', e.target.value)} />

        <Textarea
          label="Descripción"
          wrapperClassName="sm:col-span-2"
          value={data.description}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
          placeholder="Opcional"
        />

        {error && (
          <p role="alert" className="rounded-control border border-st-red/40 bg-st-red/[0.06] px-3 py-2 text-sm text-st-red sm:col-span-2">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
