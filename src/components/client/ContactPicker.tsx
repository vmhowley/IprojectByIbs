import { ChevronDown, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { contactService } from '../../services/contactService';
import { Contact } from '../../types/Client';
import { NewContactModal } from './NewContactModal';

interface ContactPickerProps {
  clientId?: string;
  value?: string;
  onChange: (contactId: string, contact: Contact) => void;
  disabled?: boolean;
}

export function ContactPicker({ clientId, value, onChange, disabled }: ContactPickerProps) {
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
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const contactId = e.target.value;
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      onChange(contactId, contact);
    }
  };

  const isDisabled = disabled || !clientId;

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <select
              value={value || ''}
              onChange={handleSelectChange}
              disabled={isDisabled || isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-10 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {!clientId ? 'Primero selecciona un cliente...' : 'Seleccionar contacto...'}
              </option>
              {contacts.map(contact => (
                <option key={contact.id} value={contact.id}>
                  {contact.name} {contact.position ? `- ${contact.position}` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>
          <button
            type="button"
            onClick={() => setShowNewContactModal(true)}
            disabled={isDisabled}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 whitespace-nowrap disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            Nuevo
          </button>
        </div>
      </div>

      {clientId && (
        <NewContactModal
          clientId={clientId}
          isOpen={showNewContactModal}
          onClose={() => setShowNewContactModal(false)}
          onSubmit={handleCreateContact}
        />
      )}
    </>
  );
}
