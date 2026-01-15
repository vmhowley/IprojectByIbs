import { Search, Shield, Users as UsersIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import NProgress from '../lib/nprogress';
import { supabase } from '../services/api';
import { getUsers } from '../services/usersService';
import { Client, Contact, UserProfile } from '../types';

export function AdminPanel() {
  const { user, loading: loadingAuth } = useAuth();
  const { isAdmin } = usePermissions();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!loadingAuth && user && user.role === 'support_agent') {
      loadUsers();
    }
  }, [loadingAuth, user]);

  // Redirect if not support_agent
  if (!loadingAuth && (!user || user.role !== 'support_agent')) {
    return <Navigate to="/" replace />;
  }

  async function loadUsers() {
    try {
      NProgress.start();
      setLoading(true);

      // 1. Load Users (Critical)
      const usersData = await getUsers();

      if (usersData) setUsers(usersData);

      // 2. Load Contacts & Clients (Non-critical - try/catch individually)
      try {
        const [contactsResponse, clientsResponse] = await Promise.all([
          supabase.from('contacts').select('*').order('name'),
          supabase.from('clients').select('*').order('name')
        ]);

        if (contactsResponse.error) console.warn('Error loading contacts:', contactsResponse.error);
        else setContacts(contactsResponse.data || []);

        if (clientsResponse.error) console.warn('Error loading clients:', clientsResponse.error);
        else setClients(clientsResponse.data || []);

      } catch (secondaryError) {
        console.warn('Failed to load auxiliary data:', secondaryError);
      }

    } catch (error) {
      console.error('Error loading users:', error);
      alert('Error cargando usuarios. Por favor revise la consola.');
    } finally {
      setLoading(false);
      NProgress.done();
    }
  }


  async function updateUserRole(userId: string, newRole: 'admin' | 'user' | 'guest') {
    try {
      setUpdatingUserId(userId);
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Error al actualizar el rol del usuario');
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function updateUserContact(userId: string, contactId: string | null) {
    try {
      setUpdatingUserId(userId);
      // If contactId is empty string, convert to null
      const finalContactId = contactId === '' ? null : contactId;

      const { error } = await supabase
        .from('user_profiles')
        .update({ contact_id: finalContactId })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, contact_id: finalContactId } : u));
    } catch (error) {
      console.error('Error updating user contact:', error);
      alert('Error al actualizar el contacto del usuario');
    } finally {
      setUpdatingUserId(null);
    }
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'support_agent':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'user':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'guest':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'support_agent':
        return 'Agente de Soporte';
      case 'user':
        return 'Usuario';
      case 'guest':
        return 'Invitado';
      default:
        return role;
    }
  };

  if (loading) {
    return null;
  }


  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
              <p className="text-gray-600">Gestiona usuarios y permisos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Usuarios</h2>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded">
                  {users.length}
                </span>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol Actual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cambiar Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto Vinculado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha de Registro
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{u.name}</p>
                          {u.id === user?.id && (
                            <span className="text-xs text-indigo-600">(Tú)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-600">{u.email}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(u.role)}`}>
                        {getRoleLabel(u.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={u.role}
                        onChange={(e) => updateUserRole(u.id, e.target.value as any)}
                        disabled={updatingUserId === u.id || u.id === user?.id}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="admin">Administrador</option>
                        <option value="support_agent">Agente de Soporte</option>
                        <option value="user">Usuario</option>
                        <option value="guest">Invitado</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={u.contact_id || ''}
                        onChange={(e) => updateUserContact(u.id, e.target.value)}
                        disabled={updatingUserId === u.id}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed max-w-xs"
                      >
                        <option value="">-- Sin vincular --</option>
                        {clients.map(client => {
                          const clientContacts = contacts.filter(c => c.client_id === client.id);
                          if (clientContacts.length === 0) return null;
                          return (
                            <optgroup key={client.id} label={client.name}>
                              {clientContacts.map(contact => (
                                <option key={contact.id} value={contact.id}>
                                  {contact.name}
                                </option>
                              ))}
                            </optgroup>
                          );
                        })}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-600">
                        {new Date(u.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No se encontraron usuarios</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Información sobre Roles</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li><strong>Administrador:</strong> Acceso completo, puede editar y eliminar cualquier proyecto o tarea</li>
            <li><strong>Usuario:</strong> Puede crear proyectos y tareas, pero solo puede editar/eliminar los suyos</li>
            <li><strong>Invitado:</strong> Solo puede ver proyectos y tareas, sin permisos de escritura</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
