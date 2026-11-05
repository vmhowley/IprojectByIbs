import { FormEvent, useState } from 'react';
import { Client } from '../../types/Client';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Textarea } from '../ui/Textarea';

interface NewClientModalProps {
  onClose: () => void;
  onSubmit: (client: Partial<Client>) => Promise<void>;
  initialData?: Client;
}

/** Client registration form: the company and how to reach it. */
export function NewClientModal({ onClose, onSubmit, initialData }: NewClientModalProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    notes: initialData?.notes || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Keep the event inside this form when it is opened from another form.
    e.stopPropagation();

    if (!formData.name.trim()) {
      setError('Escribe el nombre de la empresa.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Empty cells are saved as null so clearing a field on edit sticks.
      await onSubmit({
        ...initialData,
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        notes: formData.notes.trim() || null
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el cliente. Inténtalo de nuevo.');
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      dismissible={!isSubmitting}
      size="md"
      title={initialData ? 'Editar cliente' : 'Nuevo cliente'}
      description={initialData ? initialData.name : 'La empresa para la que se hace el trabajo.'}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="client-form" isLoading={isSubmitting}>
            {initialData ? 'Guardar cambios' : 'Registrar cliente'}
          </Button>
        </>
      }
    >
      <form id="client-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Empresa"
          wrapperClassName="sm:col-span-2"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Ej.: Asociación Popular de Ahorros y Préstamos"
          disabled={isSubmitting}
          required
          autoFocus
          error={error && !formData.name.trim() ? error : undefined}
        />
        <Input
          label="Correo"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="contacto@empresa.com.do"
          disabled={isSubmitting}
        />
        <Input
          label="Teléfono"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="809 000 0000"
          disabled={isSubmitting}
        />
        <Input
          label="Dirección"
          wrapperClassName="sm:col-span-2"
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          disabled={isSubmitting}
        />
        <Textarea
          label="Notas"
          wrapperClassName="sm:col-span-2"
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Acuerdos, horarios, a quién llamar para aprobar…"
          rows={3}
          disabled={isSubmitting}
        />
        {error && formData.name.trim() && (
          <p role="alert" className="rounded-control border border-st-red/40 bg-st-red/[0.06] px-3 py-2 text-sm text-st-red sm:col-span-2">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
