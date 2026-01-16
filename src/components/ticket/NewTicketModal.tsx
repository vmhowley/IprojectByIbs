import { FileIcon, Info, Sparkles, Upload, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { requestTypeService, TicketRequestType } from '../../services/requestTypeService';
import { Input } from '../ui/Input';
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

export function NewTicketModal({ projectId: _projectId, projectName, clientId, contactId, onClose, onSubmit }: NewTicketModalProps) {
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

  const [isGenerating, setIsGenerating] = useState(false);
  const [requestTypes, setRequestTypes] = useState<TicketRequestType[]>([]);

  useEffect(() => {
    const loadRequestTypes = async () => {
      try {
        const types = await requestTypeService.getAll();
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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isSubmitting, onClose]);

  const handleChange = (field: keyof TicketFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setFormData(prev => ({
        ...prev,
        files: [...(prev.files || []), ...newFiles]
      }));
    }
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

  const handleSubtaskKeyDown = (e: React.KeyboardEvent) => {
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
      setError("Por favor escribe una idea básica en el asunto o descripción primero.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      // Lazy load service to avoid issues if not set up
      const { aiService } = await import('../../services/aiService');

      // Temporary: Check if key exists, if not, prompt user (for development/demo)
      if (!aiService.hasKey()) {
        const key = prompt("Para probar la IA, por favor introduce tu Google Gemini API Key:");
        if (key) aiService.setApiKey(key);
        else throw new Error("API Key requerida para usar IA");
      }

      const generated = await aiService.generateTicketFromText(textToAnalyze);

      setFormData(prev => ({
        ...prev,
        subject: generated.subject || prev.subject,
        description: generated.description || prev.description,
        urgency: (generated as any).priority || prev.urgency,
        request_type: (generated as any).type === 'bug' ? 'bug' : (generated as any).type === 'feature_request' ? 'feature' : 'other',
      }));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error generando ticket con IA");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client ID validation removed to allow internal projects
    // if (!formData.client_id) {
    //   setError('Cliente es requerido');
    //   return;
    // }

    if (!formData.subject.trim()) {
      setError('Asunto es requerido');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la solicitud');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => !isSubmitting && onClose()}
      />
      <div className="relative bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nueva Solicitud</h2>
            <button
              type="button"
              onClick={handleMagicFill}
              disabled={isGenerating}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors border border-purple-200 dark:border-purple-800/50"
              title="Escribe una idea en la descripción y haz clic para autocompletar"
            >
              <Sparkles className="w-3 h-3" />
              {isGenerating ? 'Generando...' : 'Autocompletar con IA'}
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Proyecto
              </label>
              <div className="px-3 py-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 rounded-md text-sm text-gray-600 dark:text-slate-400">
                {projectName}
              </div>
            </div>

            {/* Client and Contact are now inherited from Project */}

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Asunto <span className="text-red-500">*</span>
              </label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
                placeholder="Resumen del asunto"
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label htmlFor="request_type" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Tipo de Solicitud <span className="text-red-500">*</span>
              </label>
              <Select
                id="request_type"
                value={formData.request_type}
                onChange={(e) => handleChange('request_type', e.target.value)}
                disabled={isSubmitting}
                required
              >
                {requestTypes.length === 0 ? (
                  // Fallback if loading or error
                  <>
                    <option value="feature">Requerimiento de Adecuación</option>
                    <option value="bug">Incidencia Reportada</option>
                  </>
                ) : (
                  requestTypes.map(type => (
                    <option key={type.id} value={type.value}>
                      {type.label}
                    </option>
                  ))
                )}
              </Select>
            </div>
            <div className="border-t border-gray-200 dark:border-slate-800 pt-6 mt-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Info size={16} className="text-indigo-500" />
                Detalles del Ticket
              </h3>

              <div className="space-y-4">
                {/* Subtasks Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Subtareas
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyDown={handleSubtaskKeyDown}
                      placeholder="Escribir una subtarea (Enter para agregar)"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={handleAddSubtask}
                      disabled={isSubmitting || !newSubtask.trim()}
                      className="px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      Agregar
                    </button>
                  </div>
                  {formData.subtasks && formData.subtasks.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {formData.subtasks.map((task, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 p-2.5 rounded-lg text-sm">
                          <span className="text-gray-700 dark:text-slate-300">{task}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubtask(index)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Descripción
                  </label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Describe los detalles de la solicitud..."
                    rows={4}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Estado
                    </label>
                    <Select
                      id="status"
                      value={formData.status}
                      onChange={(e) => handleChange('status', e.target.value)}
                      disabled={isSubmitting}
                    >
                      <option value="pending_analysis">Pendiente de Análisis</option>
                      <option value="pending_approval">Pendiente de Aprobación</option>
                      <option value="approved">Aprobado</option>
                      <option value="ongoing">En Desarrollo</option>
                      <option value="completed">Completado</option>
                    </Select>
                  </div>

                  <div>
                    <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Prioridad
                    </label>
                    <Select
                      id="urgency"
                      value={formData.urgency}
                      onChange={(e) => handleChange('urgency', e.target.value)}
                      disabled={isSubmitting}
                    >
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                      <option value="critical">Crítica</option>
                    </Select>
                  </div>

                  <div>
                    <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Asignado a
                    </label>
                    <UserPicker
                      value={formData.assigned_to || null}
                      onChange={(userId) => setFormData(prev => ({ ...prev, assigned_to: userId }))}
                      placeholder="Seleccionar usuario"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Archivos Adjuntos
                </label>

                <div className="border-2 border-dashed border-gray-300 dark:border-slate-800 rounded-lg p-6 text-center hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors bg-gray-50/50 dark:bg-slate-800/10 relative group">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                    <div className="text-sm text-gray-600 dark:text-slate-400">
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                        Haz clic para subir
                      </span>{' '}
                      o arrastra archivos aquí
                    </div>
                    <p className="text-xs text-gray-500">
                      Máximo 10MB por archivo
                    </p>
                  </div>
                </div>

                {formData.files && formData.files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {formData.files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-800"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileIcon className="w-5 h-5 text-gray-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          disabled={isSubmitting}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            {isSubmitting ? 'Creando...' : 'Crear Solicitud'}
          </button>
        </div>
      </div>
    </div>
  );
}
