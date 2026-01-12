import { X } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Client } from '../../types/Client';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';

interface NewClientModalProps {
  onClose: () => void;
  onSubmit: (client: Partial<Client>) => Promise<void>;
}

export function NewClientModal({ onClose, onSubmit }: NewClientModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('El nombre de la empresa es requerido');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        notes: formData.notes || undefined
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el cliente');
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => !isSubmitting && onClose()}
      />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Nuevo Cliente</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Empresa <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Ej: Acme Corporation"
              disabled={isSubmitting}
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="contacto@empresa.com"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+1 234 567 8900"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Dirección de la empresa"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Información adicional..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creando...' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
