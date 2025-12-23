import { FileIcon, Sparkles, Upload, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
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

export function NewTicketModal({ projectId, projectName, clientId, contactId, onClose, onSubmit }: NewTicketModalProps) {
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
  const [magicPrompt, setMagicPrompt] = useState(false);

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
        urgency: generated.priority as any || prev.urgency,
        request_type: generated.type as any === 'bug' ? 'bug' : generated.type === 'feature_request' ? 'feature' : 'other',
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
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">Nueva Solicitud</h2>
            <button
              type="button"
              onClick={handleMagicFill}
              disabled={isGenerating}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full hover:bg-purple-200 transition-colors"
              title="Escribe una idea en la descripción y haz clic para autocompletar"
            >
              <Sparkles className="w-3 h-3" />
              {isGenerating ? 'Generando...' : 'Autocompletar con IA'}
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proyecto
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
                {projectName}
              </div>
            </div>

            {/* Client and Contact are now inherited from Project */}

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
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
              <label htmlFor="request_type" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Solicitud <span className="text-red-500">*</span>
              </label>
              <Select
                id="request_type"
                value={formData.request_type}
                onChange={(e) => handleChange('request_type', e.target.value)}
                disabled={isSubmitting}
                required
              >
                <option value="feature">Requerimiento de Adecuación</option>
                <option value="bug">Incidencia Reportada</option>
                <option value="enhancement">Solicitud de Mejora</option>
                <option value="other">Otro</option>
              </Select>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Detalles del Ticket</h3>

              <div className="space-y-4">
                {/* Subtasks Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleAddSubtask}
                      disabled={isSubmitting || !newSubtask.trim()}
                    >
                      Agregar
                    </Button>
                  </div>
                  {formData.subtasks && formData.subtasks.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {formData.subtasks.map((task, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 border border-gray-200 p-2 rounded-md text-sm">
                          <span className="text-gray-700">{task}</span>
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
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
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
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
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
                    <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-1">
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
                    <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Archivos Adjuntos
                </label>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    <div className="text-sm text-gray-600">
                      <span className="text-blue-600 hover:text-blue-700 font-medium">
                        Haz clic para subir
                      </span>{' '}
                      o arrastra archivos aquí
                    </div>
                    <p className="text-xs text-gray-500">
                      Máximo 10MB por archivo
                    </p>
                  </label>
                </div>

                {formData.files && formData.files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {formData.files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
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

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creando...' : 'Crear Solicitud'}
          </Button>
        </div>
      </div>
    </div>
  );
}
