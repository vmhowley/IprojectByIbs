import { Building2, Edit, Link2, Mail, Phone, Plus, Search, Trash2, User, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { DeleteClientModal } from '../components/client/DeleteClientModal';
import { LinkUserModal } from '../components/client/LinkUserModal';
import { NewClientModal } from '../components/client/NewClientModal';
import { NewContactModal } from '../components/client/NewContactModal';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useSubscription } from '../hooks/useSubscription';
import NProgress from '../lib/nprogress';
import { clientService } from '../services/clientService';
import { contactService } from '../services/contactService';
import { Client, Contact } from '../types/Client';
import { User as UserType } from '../types/User';
import { confirmAction } from '../utils/confirmationToast';


export function Clients() {
  const { limits, isPro } = useSubscription();
  const navigate = useNavigate();

  const [clients, setClients] = useState<Client[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Linked Users state
  const [linkedUsers, setLinkedUsers] = useState<UserType[]>([]);
  const [showLinkUserModal, setShowLinkUserModal] = useState(false);
  const [showDeleteClientModal, setShowDeleteClientModal] = useState(false);

  const handleDeleteContact = async (contactId: string) => {
    confirmAction({
      message: '¿Estás seguro de que deseas eliminar este contacto?',
      onConfirm: async () => {
        try {
          await contactService.delete(contactId);
          toast.success('Contacto eliminado correctamente');
          loadContacts(selectedClient?.id || '');
        } catch (error) {
          console.error('Error al eliminar el contacto:', error);
          toast.error('Error al eliminar el contacto');
        }
      }
    });
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    try {
      await clientService.delete(selectedClient.id);
      toast.success('Cliente eliminado correctamente');
      setSelectedClient(null);
      await loadClients();
    } catch (error) {
      console.error('Error al eliminar el cliente:', error);
      toast.error('Error al eliminar el cliente');
    }
  };



  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      loadContacts(selectedClient.id);
      loadLinkedUsers(selectedClient.id);
    } else {
      setContacts([]);
      setLinkedUsers([]);
    }
  }, [selectedClient]);

  const loadClients = async () => {
    try {
      NProgress.start();
      setIsLoading(true);
      const data = await clientService.getAll();
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setIsLoading(false);
      NProgress.done();
    }
  };


  const loadContacts = async (clientId: string) => {
    try {
      const data = await clientService.getContacts(clientId);
      setContacts(data);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const handleSaveClient = async (clientData: Partial<Client>) => {
    try {
      if (editingClient && editingClient.id === clientData.id) {
        // Update
        await clientService.update(editingClient.id, clientData);
      } else {
        // Create
        await clientService.create(clientData);
      }

      await loadClients();

      // If we edited the currently selected client, update the view
      if (selectedClient && editingClient && editingClient.id === selectedClient.id) {
        const updated = (await clientService.getAll()).find(c => c.id === selectedClient.id);
        if (updated) setSelectedClient(updated);
      }

      setShowNewClientModal(false);
      setEditingClient(null);
    } catch (error) {
      console.error('Error saving client:', error);
      throw error;
    }
  };



  const handleSaveContact = async (contactData: Partial<Contact>) => {
    try {
      if (editingContact) {
        // Update
        await contactService.update(editingContact.id, contactData);
      } else {
        // Create
        await contactService.create(contactData);
      }

      await loadContacts(selectedClient?.id || '');
      setShowNewContactModal(false);
      setEditingContact(null);
    } catch (error) {
      console.error('Error saving contact:', error);
      throw error;
    }
  };

  const loadLinkedUsers = async (clientId: string) => {
    try {
      const data = await clientService.getLinkedUsers(clientId);
      setLinkedUsers(data);
    } catch (error) {
      console.error('Error loading linked users:', error);
    }
  };

  const handleLinkUser = async (email: string) => {
    if (!selectedClient) return;
    try {
      await clientService.linkUser(email, selectedClient.id);
      await loadLinkedUsers(selectedClient.id);
      toast.success('Usuario vinculado correctamente');
      setShowLinkUserModal(false);
    } catch (error) {
      console.error('Error linking user:', error);
      throw error; // Let modal handle error display
    }
  };

  const handleUnlinkUser = async (userId: string) => {
    confirmAction({
      message: '¿Estás seguro de que deseas desvincular este usuario? Perderá el acceso al portal de este cliente.',
      onConfirm: async () => {
        try {
          await clientService.unlinkUser(userId);
          if (selectedClient) {
            await loadLinkedUsers(selectedClient.id);
          }
          toast.success('Usuario desvinculado');
        } catch (error) {
          console.error('Error unlinking user:', error);
          toast.error('Error al desvincular usuario');
        }
      }
    });
  };

  const handleNewClientClick = () => {
    // If limit is reached
    if (!isPro && clients.length >= limits.maxClients) {
      if (confirm(`Has alcanzado el límite de ${limits.maxClients} clientes de tu plan Gratis.\n\n¿Deseas actualizar a Pro para gestionar clientes ilimitados?`)) {
        navigate('/pricing');
      }
      return;
    }
    setEditingClient(null);
    setShowNewClientModal(true);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 size={24} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
              <p className="text-sm text-gray-600">
                Gestiona tus clientes y sus contactos
              </p>
            </div>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 text-white p-2 rounded-lg" onClick={handleNewClientClick}>
            <Plus size={18} />
            Nuevo Cliente
          </button>
        </div>

        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar clientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Clients List */}
        <div className="w-1/3 border-r border-gray-200 bg-white overflow-y-auto">
          {isLoading ? (
            null
          ) : filteredClients.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No se encontraron clientes</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredClients.map(client => (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedClient?.id === client.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                >
                  <h3 className="font-medium text-gray-900">{client.name}</h3>
                  {client.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <Mail size={14} />
                      {client.email}
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <Phone size={14} />
                      {client.phone}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Client Details & Contacts */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedClient ? (
            <div className="space-y-6">
              <Card className="group">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedClient.name}</h2>
                    <div className="space-y-1 text-sm text-gray-600">
                      {selectedClient.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={16} />
                          {selectedClient.email}
                        </div>
                      )}
                      {selectedClient.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={16} />
                          {selectedClient.phone}
                        </div>
                      )}
                      {selectedClient.address && (
                        <div className="flex items-center gap-2">
                          <Building2 size={16} />
                          {selectedClient.address}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">

                    <button
                      onClick={() => {
                        console.log('Edit clicked', selectedClient);
                        setEditingClient(selectedClient);
                        setShowNewClientModal(true);
                      }}
                      className="cursor-pointer p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Edit size={16} />

                    </button>
                    <button
                      onClick={() => setShowDeleteClientModal(true)}
                      className="cursor-pointer p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      title="Eliminar cliente"
                    >
                      <Trash2 size={16} />

                    </button>
                  </div>
                </div>
                {selectedClient.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Notas</h4>
                    <p className="text-sm text-gray-600">{selectedClient.notes}</p>
                  </div>
                )}
              </Card>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Users size={20} />
                    Contactos
                  </h3>
                  <button className='cursor-pointer bg-blue-600 text-white p-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors' onClick={() => setShowNewContactModal(true)}>
                    <Plus size={16} />
                    Agregar Contacto
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contacts.map(contact => (
                    <Card key={contact.id} className="hover:shadow-md transition-shadow flex justify-between items-center group">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User size={20} className="text-gray-500" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{contact.name}</h4>
                          <p className="text-sm text-blue-600 font-medium">{contact.position}</p>
                          <div className="mt-2 space-y-1 text-sm text-gray-500">
                            {contact.email && (
                              <div className="flex items-center gap-2">
                                <Mail size={14} />
                                {contact.email}
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center gap-2">
                                <Phone size={14} />
                                {contact.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          onClick={() => {
                            console.log('Edit clicked', contact);
                            setEditingContact(contact);
                            setShowNewContactModal(true);
                          }}>
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteContact(contact.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          title="Eliminar contacto"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </Card>
                  ))}
                  {contacts.length === 0 && (
                    <div className="col-span-2 text-center py-8 bg-white rounded-lg border border-dashed border-gray-300 text-gray-500">
                      No hay contactos registrados para este cliente
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4 mt-8 pt-6 border-t border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="bg-indigo-100 p-1 rounded-md text-indigo-600">
                      <Link2 size={18} />
                    </div>
                    Acceso al Portal
                  </h3>
                  <button
                    className='cursor-pointer bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 p-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium'
                    onClick={() => setShowLinkUserModal(true)}
                  >
                    <Plus size={16} />
                    Vincular Usuario
                  </button>
                </div>

                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 mb-4 text-sm text-blue-800">
                  <p>
                    Vincular un usuario le dará acceso al <strong>Portal de Clientes</strong>.
                    Podrá ver proyectos y tickets asociados a este cliente, y aprobar entregables.
                  </p>
                </div>

                <div className="space-y-3">
                  {linkedUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-200 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{user.name}</h4>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnlinkUser(user.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        title="Desvincular usuario"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {linkedUsers.length === 0 && (
                    <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-lg">
                      No hay usuarios vinculados con acceso al portal
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Selecciona un cliente para ver sus detalles
            </div>
          )}
        </div>
      </div>

      {showNewClientModal && (
        <NewClientModal
          onClose={() => {
            setShowNewClientModal(false);
            setEditingClient(null);
          }}
          onSubmit={handleSaveClient}
          initialData={editingClient || undefined}
        />
      )}

      {selectedClient && showNewContactModal && (
        <NewContactModal
          clientId={selectedClient.id}
          isOpen={showNewContactModal}
          onClose={() => setShowNewContactModal(false)}
          onSubmit={handleSaveContact}
          initialData={editingContact || undefined}
        />
      )}

      {selectedClient && showLinkUserModal && (
        <LinkUserModal
          clientId={selectedClient.id}
          isOpen={showLinkUserModal}
          onClose={() => setShowLinkUserModal(false)}
          onSubmit={handleLinkUser}
        />
      )}

      {selectedClient && showDeleteClientModal && (
        <DeleteClientModal
          client={selectedClient}
          isOpen={showDeleteClientModal}
          onClose={() => setShowDeleteClientModal(false)}
          onConfirm={handleDeleteClient}
        />
      )}
    </div>
  );
}
