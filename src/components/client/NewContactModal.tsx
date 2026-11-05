import { FormEvent, useState } from 'react';
import { Contact } from '../../types/Client';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

interface NewContactModalProps {
  clientId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Contact>) => Promise<void>;
  initialData?: Contact;
}

/** A person at the client: who to call and who approves. */
export function NewContactModal({ clientId, isOpen, onClose, onSubmit, initialData }: NewContactModalProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    position: initialData?.position || '',
    is_primary: initialData?.is_primary ?? false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: 'name' | 'email' | 'phone' | 'position', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Keep the event inside this form when it is opened from another form.
    e.stopPropagation();

    if (!formData.name.trim()) {
      setError('Escribe el nombre del contacto.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Empty cells are saved as null so clearing a field on edit sticks.
      await onSubmit({
        client_id: clientId,
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        position: formData.position.trim() || null,
        is_primary: formData.is_primary,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el contacto. Inténtalo de nuevo.');
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      dismissible={!isSubmitting}
      size="sm"
      title={initialData ? 'Editar contacto' : 'Nuevo contacto'}
      description={initialData ? initialData.name : 'Una persona del cliente: quién pide, quién aprueba.'}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="contact-form" isLoading={isSubmitting}>
            {initialData ? 'Guardar cambios' : 'Registrar contacto'}
          </Button>
        </>
      }
    >
      <form id="contact-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Ej.: María Rodríguez"
          disabled={isSubmitting}
          required
          autoFocus
          error={error && !formData.name.trim() ? error : undefined}
        />
        <Input
          label="Cargo"
          value={formData.position}
          onChange={(e) => handleChange('position', e.target.value)}
          placeholder="Ej.: Gerente de TI"
          disabled={isSubmitting}
        />
        <Input
          label="Correo"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="maria@empresa.com.do"
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
        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink">
          <input
            type="checkbox"
            checked={formData.is_primary}
            onChange={(e) => setFormData(prev => ({ ...prev, is_primary: e.target.checked }))}
            disabled={isSubmitting}
            className="mt-0.5 h-4 w-4 accent-[var(--ink)]"
          />
          <span>
            Contacto principal
            <span className="block text-xs text-ink-3">Aparece primero en la lista del cliente.</span>
          </span>
        </label>
        {error && formData.name.trim() && (
          <p role="alert" className="rounded-control border border-st-red/40 bg-st-red/[0.06] px-3 py-2 text-sm text-st-red">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
