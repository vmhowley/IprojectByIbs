import { ChevronDown, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { clientService } from '../../services/clientService';
import { Client } from '../../types/Client';
import { NewClientModal } from './NewClientModal';

interface ClientPickerProps {
  value?: string;
  onChange: (clientId: string, client: Client) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ClientPicker({ value, onChange, disabled, placeholder }: ClientPickerProps) {
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
      console.log('Creating client with data:', clientData);
      const newClient = await clientService.create(clientData);
      console.log('Client created successfully:', newClient);
      setClients(prev => [newClient, ...prev]);
      onChange(newClient.id, newClient);
      setShowNewClientModal(false);
    } catch (error) {
      console.error('Error creating client:', error);
      // Re-throw para que NewClientModal lo capture
      throw error;
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    const client = clients.find(c => c.id === clientId);
    if (client) {
      onChange(clientId, client);
    }
  };

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <select
              value={value || ''}
              onChange={handleSelectChange}
              disabled={disabled || isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-10"
            >
              <option value="">{placeholder || "Seleccionar cliente..."}</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>
          <button
            type="button"
            onClick={() => setShowNewClientModal(true)}
            disabled={disabled}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 whitespace-nowrap"
          >
            <Plus size={16} />
            Nuevo
          </button>
        </div>
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
