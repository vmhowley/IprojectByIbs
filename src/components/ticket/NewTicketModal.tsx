import { KeyRound, Paperclip, Plus, Sparkles, Upload, X } from 'lucide-react';
import { DragEvent, FormEvent, KeyboardEvent, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { pickableTypes, requestTypeService, TicketRequestType } from '../../services/requestTypeService';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { UserPicker } from '../ui/UserPicker';

interface NewTicketModalProps {
  projectId: string;
  projectName: string;
  clientId?: string | null;
  contactId?: string | null;
  onClose: () => void;
  onSubmit: (ticketData: TicketFormData) => Promise<void>;
}

export interface TicketFormData {
  client_id?: string;
  contact_id: string;
  subject: string;
  request_type: string;
  description?: string;
  status: 'pending_analysis' | 'pending_approval' | 'approved' | 'ongoing' | 'completed' | 'done';
  urgency: 'low' | 'medium' | 'high' | 'critical' | 'minor' | 'moderate';
  assigned_to?: string | null;
  files?: File[];
  subtasks?: string[];
}

/** Request form: what the client asks for, how urgent, and who takes it. */
export function NewTicketModal({ projectName, clientId, contactId, onClose, onSubmit }: NewTicketModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<TicketFormData>({
    client_id: clientId || '',
    contact_id: contactId || '',
    subject: '',
    request_type: 'feature',
    description: '',
    status: 'pending_analysis',
    urgency: 'medium',
    files: [],
    subtasks: []
  });
  const [newSubtask, setNewSubtask] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [askKey, setAskKey] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [requestTypes, setRequestTypes] = useState<TicketRequestType[]>([]);

  useEffect(() => {
    const loadRequestTypes = async () => {
      try {
        // The defaults and this team's own types.
        const types = pickableTypes(await requestTypeService.getAll(), user?.organization_id);
        setRequestTypes(types);
        if (types.length > 0 && !formData.request_type) {
          setFormData(prev => ({ ...prev, request_type: types[0].value }));
        }
      } catch (err) {
        console.error("Error loading request types", err);
      }
    };
    loadRequestTypes();
  }, []);

  const handleChange = (field: keyof TicketFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const newFiles = Array.from(list);
    setFormData(prev => ({
      ...prev,
      files: [...(prev.files || []), ...newFiles]
    }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files?.filter((_, i) => i !== index) || []
    }));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    setFormData(prev => ({
      ...prev,
      subtasks: [...(prev.subtasks || []), newSubtask.trim()]
    }));
    setNewSubtask('');
  };

  const handleRemoveSubtask = (index: number) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks?.filter((_, i) => i !== index)
    }));
  };

  const handleSubtaskKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubtask();
    }
  };

  const handleMagicFill = async () => {
    // If we have a description, try to enhance it. If empty, ask user.
    // Actually, following the "Text-to-Ticket" idea:
    const textToAnalyze = formData.description || formData.subject;
    if (!textToAnalyze || textToAnalyze.length < 5) {
      setError('Escribe primero una idea básica en el asunto o en la descripción.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      // Lazy load service to avoid issues if not set up
      const { aiService } = await import('../../services/aiService');

      // The key lives only in this browser. Ask for it in the form, not in a prompt.
      if (!aiService.hasKey()) {
        setAskKey(true);
        return;
      }

      const generated = await aiService.generateTicketFromText(textToAnalyze);
      // The AI also answers with its own priority and type names.
      const extra = generated as { priority?: string; type?: string };

      setFormData(prev => ({
        ...prev,
        subject: generated.subject || prev.subject,
        description: generated.description || prev.description,
        urgency: (extra.priority as TicketFormData['urgency']) || prev.urgency,
        request_type: extra.type === 'bug' ? 'bug' : extra.type === 'feature_request' ? 'feature' : 'other',
      }));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'No se pudo completar con IA.');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveKeyAndFill = async () => {
    if (!apiKey.trim()) return;
    const { aiService } = await import('../../services/aiService');
    aiService.setApiKey(apiKey.trim());
    setAskKey(false);
    setApiKey('');
    handleMagicFill();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Client ID validation removed to allow internal projects
    // if (!formData.client_id) {
    //   setError('Cliente es requerido');
    //   return;
    // }

    if (!formData.subject.trim()) {
      setError('Escribe el asunto del ticket.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el ticket. Inténtalo de nuevo.');
      setIsSubmitting(false);
    }
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
      dismissible={!isSubmitting}
      size="lg"
      title="Nuevo ticket"
      description={projectName}
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            onClick={handleMagicFill}
            isLoading={isGenerating}
            className="mr-auto"
            title="Escribe una idea en el asunto o la descripción y deja que la IA complete el resto"
          >
            {!isGenerating && <Sparkles size={15} aria-hidden="true" />}
            {isGenerating ? 'Redactando…' : 'Completar con IA'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="new-ticket-form" isLoading={isSubmitting}>
            Crear ticket
          </Button>
        </>
      }
    >
      <form id="new-ticket-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Client and Contact are now inherited from Project */}
        <Input
          label="Asunto"
          wrapperClassName="sm:col-span-2"
          value={formData.subject}
          onChange={(e) => handleChange('subject', e.target.value)}
          placeholder="Ej.: Ajustar cálculo de mora en estado de cuenta"
          disabled={isSubmitting}
          required
          autoFocus
          error={error === 'Escribe el asunto del ticket.' ? error : undefined}
        />

        {askKey && (
          <div className="rounded-control border border-rule bg-well p-3 sm:col-span-2">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <KeyRound size={15} aria-hidden="true" className="text-ink-3" />
              Clave de Google Gemini
            </p>
            <p className="mt-1 text-xs text-ink-2">La IA necesita tu clave. Se guarda solo en este navegador.</p>
            <div className="mt-2 flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                aria-label="Clave de Google Gemini"
                className="field h-8 py-1 font-mono text-[13px]"
                placeholder="AIza…"
                autoComplete="off"
              />
              <Button type="button" size="sm" variant="secondary" onClick={saveKeyAndFill} disabled={!apiKey.trim()}>
                Guardar y completar
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setAskKey(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <Select
          label="Tipo de solicitud"
          value={formData.request_type}
          onChange={(e) => handleChange('request_type', e.target.value)}
          disabled={isSubmitting}
          required
        >
          {requestTypes.length === 0 ? (
            // Fallback if loading or error
            <>
              <option value="feature">Requerimiento de adecuación</option>
              <option value="bug">Incidencia reportada</option>
            </>
          ) : (
            requestTypes.map(type => (
              <option key={type.id} value={type.value}>
                {type.label}
              </option>
            ))
          )}
        </Select>

        <Select
          label="Prioridad"
          value={formData.urgency}
          onChange={(e) => handleChange('urgency', e.target.value)}
          disabled={isSubmitting}
          options={[
            { value: 'low', label: 'Baja' },
            { value: 'medium', label: 'Media' },
            { value: 'high', label: 'Alta' },
            { value: 'critical', label: 'Crítica' },
          ]}
        />

        <Select
          label="Estado inicial"
          value={formData.status}
          onChange={(e) => handleChange('status', e.target.value)}
          disabled={isSubmitting}
          options={[
            { value: 'pending_analysis', label: 'Pendiente de análisis' },
            { value: 'pending_approval', label: 'Pendiente de aprobación' },
            { value: 'approved', label: 'Aprobado' },
            { value: 'ongoing', label: 'En desarrollo' },
            { value: 'completed', label: 'Completado' },
          ]}
        />

        <FormField id="new-ticket-assignee" label="Asignado a">
          <UserPicker
            id="new-ticket-assignee"
            value={formData.assigned_to || null}
            onChange={(userId) => setFormData(prev => ({ ...prev, assigned_to: userId }))}
            placeholder="Sin asignar"
          />
        </FormField>

        <Textarea
          label="Descripción"
          wrapperClassName="sm:col-span-2"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Qué se pide, en qué pantalla o programa, y cómo se prueba."
          rows={4}
          disabled={isSubmitting}
        />

        {/* Subtasks Section */}
        <div className="sm:col-span-2">
          <span className="caption mb-1.5 block">Subtareas</span>
          <div className="flex gap-2">
            <input
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={handleSubtaskKeyDown}
              placeholder="Escribe un paso y pulsa Enter"
              aria-label="Nueva subtarea"
              className="field"
              disabled={isSubmitting}
            />
            <Button type="button" variant="secondary" onClick={handleAddSubtask} disabled={isSubmitting || !newSubtask.trim()}>
              <Plus size={15} aria-hidden="true" />
              Agregar
            </Button>
          </div>
          {formData.subtasks && formData.subtasks.length > 0 && (
            <ol className="mt-2 divide-y divide-rule rounded-control border border-rule">
              {formData.subtasks.map((task, index) => (
                <li key={index} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                  <span className="w-5 text-xs tabular-nums text-ink-3">{index + 1}.</span>
                  <span className="min-w-0 flex-1 text-ink">{task}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(index)}
                    aria-label={`Quitar subtarea ${task}`}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-inner text-ink-3 hover:bg-ink/[0.06] hover:text-st-red"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="sm:col-span-2">
          <span className="caption mb-1.5 block">Adjuntos</span>
          <label
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              'flex cursor-pointer flex-col items-center gap-1 rounded-control border border-dashed px-4 py-4 text-center transition-colors focus-within:border-focus',
              dragging ? 'border-ink bg-well' : 'border-rule-strong/60 hover:border-ink/60 hover:bg-well/60'
            )}
          >
            <input type="file" multiple onChange={(e) => addFiles(e.target.files)} disabled={isSubmitting} className="sr-only" />
            <Upload size={18} aria-hidden="true" className="text-ink-3" />
            <span className="text-sm text-ink">
              <span className="font-semibold underline decoration-rule-strong">Elige archivos</span> o arrástralos aquí
            </span>
            <span className="text-xs text-ink-3">Máximo 10 MB por archivo</span>
          </label>

          {formData.files && formData.files.length > 0 && (
            <ul className="mt-2 divide-y divide-rule rounded-control border border-rule">
              {formData.files.map((file, index) => (
                <li key={index} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                  <Paperclip size={14} aria-hidden="true" className="shrink-0 text-ink-3" />
                  <span className="min-w-0 flex-1 truncate text-ink">{file.name}</span>
                  <span className="shrink-0 text-xs tabular-nums text-ink-3">{formatFileSize(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    disabled={isSubmitting}
                    aria-label={`Quitar ${file.name}`}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-inner text-ink-3 hover:bg-ink/[0.06] hover:text-st-red"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && error !== 'Escribe el asunto del ticket.' && (
          <p role="alert" className="rounded-control border border-st-red/40 bg-st-red/[0.06] px-3 py-2 text-sm text-st-red sm:col-span-2">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
