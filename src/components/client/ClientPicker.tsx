import { ChevronDown, Plus } from 'lucide-react';
import { ChangeEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { clientService } from '../../services/clientService';
import { Client } from '../../types/Client';
import { NewClientModal } from './NewClientModal';

interface ClientPickerProps {
  value?: string;
  onChange: (clientId: string, client: Client) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
}

/** Client cell of a form, with a shortcut to register a new client without leaving it. */
export function ClientPicker({ value, onChange, disabled, placeholder, id }: ClientPickerProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setIsLoading(true);
      const data = await clientService.getAll();
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClient = async (clientData: Partial<Client>) => {
    try {
      const newClient = await clientService.create(clientData);
      setClients(prev => [newClient, ...prev]);
      onChange(newClient.id, newClient);
      setShowNewClientModal(false);
      toast.success(`Cliente ${newClient.name} registrado`);
    } catch (error) {
      console.error('Error creating client:', error);
      // Re-throw para que NewClientModal lo capture
      throw error;
    }
  };

  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    const client = clients.find(c => c.id === clientId);
    if (client) {
      onChange(clientId, client);
    } else {
      onChange('', { id: '', name: '', created_at: '', updated_at: '' });
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        <div className="relative min-w-0 flex-1">
          <select
            id={id}
            value={value || ''}
            onChange={handleSelectChange}
            disabled={disabled || isLoading}
            className="field appearance-none pr-8"
          >
            <option value="">{isLoading ? 'Cargando clientes…' : placeholder || 'Seleccionar cliente…'}</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3" size={15} aria-hidden="true" />
        </div>
        <button
          type="button"
          onClick={() => setShowNewClientModal(true)}
          disabled={disabled}
          title="Registrar cliente nuevo"
          aria-label="Registrar cliente nuevo"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-rule-strong/60 bg-paper text-ink-2 hover:border-ink hover:text-ink disabled:opacity-50"
        >
          <Plus size={16} />
        </button>
      </div>

      {showNewClientModal && (
        <NewClientModal
          onClose={() => setShowNewClientModal(false)}
          onSubmit={handleCreateClient}
        />
      )}
    </>
  );
}
