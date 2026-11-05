import { Paperclip, Upload, X } from 'lucide-react';
import { DragEvent, FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import { usePermissions } from '../../hooks/usePermissions';
import { cn } from '../../lib/utils';
import { Project } from '../../types';
import { ClientPicker } from '../client/ClientPicker';
import { ContactPicker } from '../client/ContactPicker';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { UserPicker } from '../ui/UserPicker';

interface NewProjectModalProps {
  onClose: () => void;
  onSubmit: (project: Partial<Project>, files: File[]) => void | Promise<void>;
  defaultClientId?: string;
}

export const CURRENCY_OPTIONS = [
  { value: 'DOP', label: 'DOP · Peso dominicano' },
  { value: 'USD', label: 'USD · Dólar' },
  { value: 'EUR', label: 'EUR · Euro' },
];

export const TEAM_OPTIONS = [
  { value: '', label: 'Sin equipo' },
  { value: 'software', label: 'Desarrollo de software' },
  { value: 'design', label: 'Diseño web' },
  { value: 'soluciones', label: 'Soluciones y servicios' },
  { value: 'marketing', label: 'Marketing' },
];

/** Opening form of a project: who it is for, who leads it, dates and price. */
export function NewProjectModal({ onClose, onSubmit, defaultClientId }: NewProjectModalProps) {
  const { isAdmin } = usePermissions();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState<string | null>(null);

  const [status, setStatus] = useState<'active' | 'on_hold' | 'completed'>('active');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [team, setTeam] = useState('');
  const [clientId, setClientId] = useState(defaultClientId || '');
  const [contactId, setContactId] = useState('');
  const [useCaseId, setUseCaseId] = useState('');
  const [cost, setCost] = useState('');
  const [currency, setCurrency] = useState('DOP');
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateError = startDate && endDate && endDate < startDate ? 'La entrega no puede ser antes del inicio.' : undefined;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || dateError) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        description,
        assignee: assignee || undefined,
        status,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        priority,
        team: team || undefined,
        client_id: clientId || undefined,
        contact_id: contactId || undefined,
        use_case_id: useCaseId || undefined,
        ...(isAdmin() && cost ? { cost: Number(cost), currency } : {}),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, files);
      toast.success('Proyecto creado');
      onClose();
    } catch (err) {
      console.error('Error creating project:', err);
      setError('No se pudo crear el proyecto. Revisa los datos e inténtalo de nuevo.');
      setSaving(false);
    }
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      dismissible={!saving}
      size="lg"
      title="Nuevo proyecto"
      description="Agrupa los tickets de un cliente y lleva su precio."
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="new-project-form" isLoading={saving} disabled={!name.trim() || !!dateError}>
            Crear proyecto
          </Button>
        </>
      }
    >
      <form id="new-project-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Nombre del proyecto"
          wrapperClassName="sm:col-span-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej.: Adecuación de estados de cuenta"
          required
          autoFocus
        />

        <FormField id="new-project-client" label="Cliente">
          <ClientPicker
            id="new-project-client"
            value={clientId}
            onChange={(id) => {
              setClientId(id);
              setContactId('');
            }}
            placeholder="Sin cliente"
          />
        </FormField>

        <FormField id="new-project-contact" label="Contacto del cliente">
          <ContactPicker id="new-project-contact" clientId={clientId || undefined} value={contactId} onChange={(id) => setContactId(id)} />
        </FormField>

        <Input
          label="N° caso de uso"
          value={useCaseId}
          onChange={(e) => setUseCaseId(e.target.value)}
          placeholder="Ej.: ITC1234567890"
          className="font-mono"
        />

        <FormField id="new-project-assignee" label="Responsable">
          <UserPicker id="new-project-assignee" value={assignee} onChange={setAssignee} placeholder="Sin responsable" />
        </FormField>

        <Select label="Equipo" value={team} onChange={(e) => setTeam(e.target.value)} options={TEAM_OPTIONS} />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Estado"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            options={[
              { value: 'active', label: 'Activo' },
              { value: 'on_hold', label: 'En espera' },
              { value: 'completed', label: 'Completado' },
            ]}
          />

          <Select
            label="Prioridad"
            value={priority}
            onChange={(e) => setPriority(e.target.value as typeof priority)}
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
              hint="Lo que paga el cliente. Solo lo ven los administradores."
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
          placeholder="Alcance, acuerdos y contexto del proyecto"
          rows={3}
        />

        <div className="sm:col-span-2">
          <span className="caption mb-1.5 block">Adjuntos</span>
          <label
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              'flex cursor-pointer flex-col items-center gap-1 rounded-control border border-dashed px-4 py-5 text-center transition-colors focus-within:border-focus',
              dragging ? 'border-ink bg-well' : 'border-rule-strong/60 hover:border-ink/60 hover:bg-well/60'
            )}
          >
            <input type="file" multiple className="sr-only" onChange={(e) => addFiles(e.target.files)} />
            <Upload size={20} aria-hidden="true" className="text-ink-3" />
            <span className="text-sm text-ink">
              <span className="font-semibold underline decoration-rule-strong">Elige archivos</span> o arrástralos aquí
            </span>
            <span className="text-xs text-ink-3">Cotización, requerimientos, capturas. Hasta 10 MB cada uno.</span>
          </label>

          {/* Selected Files List */}
          {files.length > 0 && (
            <ul className="mt-2 divide-y divide-rule rounded-control border border-rule">
              {files.map((file, index) => (
                <li key={`${file.name}-${index}`} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                  <Paperclip size={14} aria-hidden="true" className="shrink-0 text-ink-3" />
                  <span className="min-w-0 flex-1 truncate text-ink">{file.name}</span>
                  <span className="shrink-0 text-xs tabular-nums text-ink-3">{(file.size / 1024).toFixed(0)} KB</span>
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                    aria-label={`Quitar ${file.name}`}
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-inner text-ink-3 hover:bg-ink/[0.06] hover:text-st-red"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-control border border-st-red/40 bg-st-red/[0.06] px-3 py-2 text-sm text-st-red sm:col-span-2">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
