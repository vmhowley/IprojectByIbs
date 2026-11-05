import { ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Navigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Avatar } from '../components/ui/Avatar';
import { confirmDialog } from '../components/ui/ConfirmDialog';
import { TableView } from '../components/views/TableView';
import { useAuth } from '../hooks/useAuth';
import NProgress from '../lib/nprogress';
import { supabase } from '../services/api';
import { getUsers } from '../services/usersService';
import { Client, Contact, UserProfile } from '../types';
import { formatDate } from '../utils/format';
import { normalizeText } from '../utils/tickets';

type Role = 'admin' | 'support_agent' | 'user' | 'guest';

const ROLES: { value: Role; label: string; help: string }[] = [
  { value: 'admin', label: 'Administrador', help: 'Acceso completo: edita y elimina cualquier proyecto o tarea, y ve los precios.' },
  { value: 'support_agent', label: 'Agente de soporte', help: 'Atiende el chat de soporte y edita las listas del sistema.' },
  { value: 'user', label: 'Usuario', help: 'Crea proyectos y tareas, pero solo edita o elimina los suyos.' },
  { value: 'guest', label: 'Invitado', help: 'Solo ve proyectos y tareas, sin permisos de escritura.' },
];

const roleLabel = (role: string) => ROLES.find((r) => r.value === role)?.label || role;

/** Who can use the workspace and with what role. */
export function AdminPanel() {
  const { user, loading: loadingAuth } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!loadingAuth && user && (user.role === 'admin' || user.role === 'support_agent')) {
      loadUsers();
    }
  }, [loadingAuth, user]);

  const filteredUsers = useMemo(() => {
    const term = normalizeText(searchTerm.trim());
    if (!term) return users;
    return users.filter(u => normalizeText(`${u.name} ${u.email}`).includes(term));
  }, [users, searchTerm]);

  // Redirect if not support_agent
  if (!loadingAuth && (!user || (user.role !== 'admin' && user.role !== 'support_agent'))) {
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
      toast.error('No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
      NProgress.done();
    }
  }

  async function updateUserRole(target: UserProfile, newRole: Role) {
    // Admin sees prices and can delete anything: ask before handing it out.
    if (newRole === 'admin') {
      const ok = await confirmDialog({
        title: 'Dar rol de administrador',
        message: `${target.name} podrá editar y eliminar cualquier proyecto o tarea, y verá los precios.`,
        confirmText: 'Hacer administrador',
        tone: 'primary',
      });
      if (!ok) return;
    }

    try {
      setUpdatingUserId(target.id);
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', target.id);

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(u => u.id === target.id ? { ...u, role: newRole } : u));
      toast.success(`${target.name}: ${roleLabel(newRole)}`);
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('No se pudo cambiar el rol.');
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
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, contact_id: finalContactId } : u));
      toast.success(finalContactId ? 'Contacto vinculado' : 'Contacto desvinculado');
    } catch (error) {
      console.error('Error updating user contact:', error);
      toast.error('No se pudo cambiar el contacto.');
    } finally {
      setUpdatingUserId(null);
    }
  }

  const selectClass = 'field h-8 w-auto appearance-none py-1 pr-8 text-[13px] disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="Usuarios y permisos"
        subtitle={loading ? 'Cargando usuarios…' : `${users.length} usuarios. Cambia su rol o vincúlalos con el contacto de un cliente.`}
        search={{ value: searchTerm, onChange: setSearchTerm, placeholder: 'Buscar por nombre o correo' }}
      />

      <div className="space-y-5 px-4 py-5 sm:px-6">
        <TableView
          caption="Usuarios"
          data={filteredUsers}
          isLoading={loading}
          defaultSort={{ index: 0, dir: 'asc' }}
          emptyMessage="Ningún usuario coincide con la búsqueda."
          columns={[
            {
              header: 'Usuario',
              sortValue: (u) => u.name.toLowerCase(),
              cell: (u) => (
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={u.name} src={u.avatar} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {u.name}
                      {u.id === user?.id && <span className="ml-1.5 text-xs font-normal text-ink-3">(tú)</span>}
                    </p>
                    <p className="truncate text-xs text-ink-3 md:hidden">{u.email}</p>
                  </div>
                </div>
              ),
            },
            {
              header: 'Correo',
              hideBelow: 'md',
              sortValue: (u) => u.email.toLowerCase(),
              cell: (u) => <span className="text-[13px] text-ink-2">{u.email}</span>,
            },
            {
              header: 'Rol',
              sortValue: (u) => ROLES.findIndex((r) => r.value === u.role),
              cell: (u) => (
                <div className="relative w-fit">
                  <label htmlFor={`role-${u.id}`} className="sr-only">Rol de {u.name}</label>
                  <select
                    id={`role-${u.id}`}
                    value={u.role}
                    onChange={(e) => updateUserRole(u, e.target.value as Role)}
                    disabled={updatingUserId === u.id || u.id === user?.id}
                    title={u.id === user?.id ? 'No puedes cambiar tu propio rol' : undefined}
                    className={selectClass}
                  >
                    {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  <ChevronDown size={14} aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
                </div>
              ),
            },
            {
              header: 'Contacto vinculado',
              hideBelow: 'lg',
              cell: (u) => (
                <div className="relative w-fit">
                  <label htmlFor={`contact-${u.id}`} className="sr-only">Contacto de {u.name}</label>
                  <select
                    id={`contact-${u.id}`}
                    value={u.contact_id || ''}
                    onChange={(e) => updateUserContact(u.id, e.target.value)}
                    disabled={updatingUserId === u.id}
                    className={`${selectClass} max-w-[16rem]`}
                  >
                    <option value="">Sin vincular</option>
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
                  <ChevronDown size={14} aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
                </div>
              ),
            },
            {
              header: 'Registro',
              hideBelow: 'xl',
              sortValue: (u) => u.created_at,
              cell: (u) => <span className="text-[13px] tabular-nums text-ink-2">{formatDate(u.created_at)}</span>,
            },
          ]}
        />

        <section className="sheet max-w-3xl" aria-labelledby="roles-help">
          <h2 id="roles-help" className="border-b border-rule px-5 py-3 text-[15px] font-semibold text-ink">Qué puede hacer cada rol</h2>
          <dl className="divide-y divide-rule">
            {ROLES.map((role) => (
              <div key={role.value} className="grid grid-cols-1 gap-1 px-5 py-2.5 sm:grid-cols-[11rem_1fr] sm:gap-4">
                <dt className="text-sm font-medium text-ink">{role.label}</dt>
                <dd className="text-[13px] text-ink-2">{role.help}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
