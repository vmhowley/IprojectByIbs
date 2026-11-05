import { ChevronDown, Plus } from 'lucide-react';
import { ChangeEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { contactService } from '../../services/contactService';
import { Contact } from '../../types/Client';
import { NewContactModal } from './NewContactModal';

interface ContactPickerProps {
  clientId?: string;
  value?: string;
  onChange: (contactId: string, contact: Contact | null) => void;
  disabled?: boolean;
  id?: string;
}

/** The client's person for this work, with a shortcut to register a new one. */
export function ContactPicker({ clientId, value, onChange, disabled, id }: ContactPickerProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewContactModal, setShowNewContactModal] = useState(false);

  useEffect(() => {
    if (clientId) {
      loadContacts(clientId);
    } else {
      setContacts([]);
    }
  }, [clientId]);

  const loadContacts = async (clientId: string) => {
    try {
      setIsLoading(true);
      const data = await contactService.getByClientId(clientId);
      setContacts(data);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateContact = async (contactData: Partial<Contact>) => {
    const newContact = await contactService.create(contactData);
    setContacts(prev => [newContact, ...prev]);
    onChange(newContact.id, newContact);
    setShowNewContactModal(false);
    toast.success(`Contacto ${newContact.name} registrado`);
  };

  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const contactId = e.target.value;
    onChange(contactId, contacts.find(c => c.id === contactId) || null);
  };

  const isDisabled = disabled || !clientId;

  return (
    <>
      <div className="flex items-center gap-1.5">
        <div className="relative min-w-0 flex-1">
          <select
            id={id}
            value={value || ''}
            onChange={handleSelectChange}
            disabled={isDisabled || isLoading}
            className="field appearance-none pr-8"
          >
            <option value="">
              {!clientId ? 'Elige primero el cliente' : isLoading ? 'Cargando contactos…' : contacts.length === 0 ? 'Sin contactos registrados' : 'Sin contacto'}
            </option>
            {contacts.map(contact => (
              <option key={contact.id} value={contact.id}>
                {contact.name}{contact.position ? ` · ${contact.position}` : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3" size={15} aria-hidden="true" />
        </div>
        <button
          type="button"
          onClick={() => setShowNewContactModal(true)}
          disabled={isDisabled}
          title="Registrar contacto nuevo"
          aria-label="Registrar contacto nuevo"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-rule-strong/60 bg-paper text-ink-2 hover:border-ink hover:text-ink disabled:opacity-50"
        >
          <Plus size={16} />
        </button>
      </div>

      {clientId && showNewContactModal && (
        <NewContactModal
          clientId={clientId}
          isOpen
          onClose={() => setShowNewContactModal(false)}
          onSubmit={handleCreateContact}
        />
      )}
    </>
  );
}
