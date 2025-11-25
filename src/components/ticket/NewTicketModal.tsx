import { useState, useEffect } from 'react';
import { X, Upload, FileIcon, XCircle } from 'lucide-react';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

interface NewTicketModalProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
  onSubmit: (ticketData: TicketFormData) => Promise<void>;
}

export interface TicketFormData {
  client: string;
  contact: string;
  subject: string;
  request_type: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done' | 'ongoing' | 'completed' | 'in_review' | 'pending';
  urgency: 'low' | 'medium' | 'high' | 'critical' | 'minor' | 'moderate';
  files?: File[];
}

export function NewTicketModal({ projectId, projectName, onClose, onSubmit }: NewTicketModalProps) {
  const [formData, setFormData] = useState<TicketFormData>({
    client: '',
    contact: '',
    subject: '',
    request_type: 'feature',
    description: '',
    status: 'todo',
    urgency: 'medium',
    files: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.client.trim()) {
      setError('Cliente es requerido');
      return;
    }
    if (!formData.contact.trim()) {
      setError('Contacto es requerido');
      return;
    }
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
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={() => !isSubmitting && onClose()}
      />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Nueva Solicitud</h2>
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

            <div>
              <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
                Cliente <span className="text-red-500">*</span>
              </label>
              <Input
                id="client"
                value={formData.client}
                onChange={(e) => handleChange('client', e.target.value)}
                placeholder="Nombre del cliente"
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">
                Contacto <span className="text-red-500">*</span>
              </label>
              <Input
                id="contact"
                value={formData.contact}
                onChange={(e) => handleChange('contact', e.target.value)}
                placeholder="Nombre y datos del contacto"
                disabled={isSubmitting}
                required
              />
            </div>

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
                <option value="feature">Feature</option>
                <option value="bug">Bug</option>
                <option value="support">Soporte</option>
                <option value="enhancement">Mejora</option>
                <option value="documentation">Documentación</option>
                <option value="other">Otro</option>
              </Select>
            </div>

            {/* <div>
              <label htmlFor="forms" className="block text-sm font-medium text-gray-700 mb-1">
                Formas
              </label>
              <Textarea
                id="forms"
                value={formData.forms}
                onChange={(e) => handleChange('forms', e.target.value)}
                placeholder="Formularios o información adicional"
                rows={3}
                disabled={isSubmitting}
              />
            </div> */}

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Detalles del Ticket</h3>

              <div className="space-y-4">
                {/* <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Título <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="Título descriptivo del ticket"
                    disabled={isSubmitting}
                    required
                  />
                </div> */}

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

                <div className="grid grid-cols-2 gap-4">
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
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="in_review">In Review</option>
                      <option value="done">Done</option>
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
