import { ChevronDown, Mail, UserPlus, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, Navigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { confirmDialog } from '../components/ui/ConfirmDialog';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { TableView } from '../components/views/TableView';
import { useAuth } from '../hooks/useAuth';
import NProgress from '../lib/nprogress';
import { supabase } from '../services/api';
import {
  isPublicEmailDomain,
  Organization,
  OrganizationInvitation,
  organizationService,
  TeamRole,
} from '../services/organizationService';
import { Client, Contact, UserProfile } from '../types';
import { dbErrorMessage } from '../utils/errors';
import { formatDate } from '../utils/format';
import { normalizeText } from '../utils/tickets';

type Role = 'admin' | 'support_agent' | 'user' | 'guest';

const ROLES: { value: Role; label: string; help: string }[] = [
  { value: 'admin', label: 'Administrador', help: 'Acceso completo: edita y elimina cualquier proyecto o tarea, ve los precios e invita personas al equipo.' },
  { value: 'support_agent', label: 'Agente de soporte', help: 'Atiende el chat de soporte y edita las listas del sistema.' },
  { value: 'user', label: 'Usuario', help: 'Crea proyectos y tareas, pero solo edita o elimina los suyos.' },
  { value: 'guest', label: 'Invitado', help: 'Solo ve proyectos y tareas, sin permisos de escritura.' },
];

const roleLabel = (role: string) => ROLES.find((r) => r.value === role)?.label || role;

// Support agents are ibPulse staff: only support grants that role.
const INVITE_ROLES = ROLES.filter((r) => r.value !== 'support_agent').map((r) => ({ value: r.value, label: r.label }));

/** Who works in the team, with what role, and who is invited to join it. */
export function AdminPanel() {
  const { user, loading: loadingAuth } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [savingDomain, setSavingDomain] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('user');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!loadingAuth && user && (user.role === 'admin' || user.role === 'support_agent')) {
      loadUsers(user.organization_id ?? null, user.role);
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

  async function loadUsers(organizationId: string | null, role: string) {
    try {
      NProgress.start();
      setLoading(true);

      // 1. Load the team and its people (Critical)
      if (!organizationId) {
        setLoadError('Tu cuenta todavía no pertenece a un equipo.');
        return;
      }
      setLoadError(null);
      const [org, members] = await Promise.all([
        organizationService.get(organizationId),
        organizationService.getMembers(organizationId),
      ]);
      setOrganization(org);
      setTeamName(org.name);
      setUsers(members);

      // Only admins invite, so only they read the pending invitations.
      if (role === 'admin') {
        organizationService
          .getInvitations()
          .then(setInvitations)
          .catch((error) => console.warn('Error loading invitations:', error));
      }

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
      setLoadError('No se pudo cargar el equipo.');
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

  const canManageTeam = user?.role === 'admin' && !!organization;
  // New accounts on the admin's own email domain can join the team, never on gmail.com and the like.
  const myDomain = user?.email?.split('@')[1]?.toLowerCase() || '';
  const canJoinByDomain = !!myDomain && !isPublicEmailDomain(myDomain);

  async function saveTeamName(e: FormEvent) {
    e.preventDefault();
    if (!organization || !teamName.trim()) return;
    try {
      setSavingName(true);
      const updated = await organizationService.rename(organization.id, teamName);
      setOrganization(updated);
      setTeamName(updated.name);
      toast.success('Nombre del equipo guardado');
    } catch (error) {
      console.error('Error renaming team:', error);
      toast.error(dbErrorMessage(error, 'No se pudo guardar el nombre.'));
    } finally {
      setSavingName(false);
    }
  }

  async function toggleJoinByDomain() {
    if (!organization) return;
    try {
      setSavingDomain(true);
      const updated = await organizationService.setAutoJoinDomain(organization.id, organization.email_domain ? null : myDomain);
      setOrganization(updated);
      toast.success(updated.email_domain ? `Quien se registre con @${updated.email_domain} entrará al equipo` : 'Unión por dominio desactivada');
    } catch (error) {
      console.error('Error changing the team domain:', error);
      toast.error(dbErrorMessage(error, 'No se pudo cambiar la unión por dominio.'));
    } finally {
      setSavingDomain(false);
    }
  }

  async function invite(e: FormEvent) {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setInviteError('Escribe un correo válido.');
      return;
    }
    if (users.some((u) => u.email.toLowerCase() === email)) {
      setInviteError('Esa persona ya es parte del equipo.');
      return;
    }
    try {
      setInviting(true);
      setInviteError(null);
      const created = await organizationService.invite(email, inviteRole);
      setInvitations((current) => [created, ...current]);
      setInviteEmail('');
      toast.success(`Invitación para ${email} guardada`);
    } catch (error) {
      console.error('Error inviting:', error);
      setInviteError(dbErrorMessage(error, 'No se pudo guardar la invitación.'));
    } finally {
      setInviting(false);
    }
  }

  async function revokeInvitation(invitation: OrganizationInvitation) {
    const ok = await confirmDialog({
      title: 'Revocar invitación',
      message: `${invitation.email} ya no entrará al equipo al registrarse.`,
      confirmText: 'Revocar',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await organizationService.revokeInvitation(invitation.id);
      setInvitations((current) => current.filter((i) => i.id !== invitation.id));
    } catch (error) {
      console.error('Error revoking invitation:', error);
      toast.error(dbErrorMessage(error, 'No se pudo revocar la invitación.'));
    }
  }

  const copySignupLink = () => {
    navigator.clipboard
      .writeText(`${window.location.origin}/register`)
      .then(() => toast.success('Enlace de registro copiado'))
      .catch(() => toast.error('No se pudo copiar el enlace.'));
  };

  const selectClass = 'field h-8 w-auto appearance-none py-1 pr-8 text-[13px] disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title={organization?.name || 'Equipo'}
        subtitle={
          loading
            ? 'Cargando el equipo…'
            : `${users.length} ${users.length === 1 ? 'persona' : 'personas'} en el equipo. Invita a más, cambia su rol o vincúlalas con el contacto de un cliente.`
        }
        search={{ value: searchTerm, onChange: setSearchTerm, placeholder: 'Buscar por nombre o correo' }}
      />

      <div className="space-y-5 px-4 py-5 sm:px-6">
        {loadError && (
          <p role="alert" className="max-w-3xl rounded-control border border-st-red/40 bg-st-red/[0.06] px-3 py-2 text-sm text-st-red">
            {loadError}
          </p>
        )}

        {canManageTeam && organization && (
          <div className="grid max-w-5xl grid-cols-1 gap-5 lg:grid-cols-2">
            <section className="sheet self-start" aria-labelledby="team-title">
              <h2 id="team-title" className="border-b border-rule px-5 py-3 text-[15px] font-semibold text-ink">
                Tu equipo
              </h2>
              <form onSubmit={saveTeamName} className="flex items-end gap-2 px-5 py-4">
                <Input
                  label="Nombre"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  maxLength={120}
                  wrapperClassName="min-w-0 flex-1"
                />
                <Button
                  type="submit"
                  variant="secondary"
                  isLoading={savingName}
                  disabled={!teamName.trim() || teamName.trim() === organization.name}
                >
                  Guardar
                </Button>
              </form>
              {canJoinByDomain && (
                <div className="flex items-start justify-between gap-4 border-t border-rule px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">Unir por dominio</p>
                    <p className="mt-0.5 text-[13px] text-ink-2">
                      {organization.email_domain
                        ? `Quien se registre con un correo @${organization.email_domain} entra a este equipo como Usuario.`
                        : `Quien se registre con un correo @${myDomain} tendrá su propio espacio hasta que lo invites.`}
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={toggleJoinByDomain} isLoading={savingDomain} className="shrink-0">
                    {organization.email_domain ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>
              )}
            </section>

            <section className="sheet self-start" aria-labelledby="invite-title">
              <h2 id="invite-title" className="border-b border-rule px-5 py-3 text-[15px] font-semibold text-ink">
                Invitar personas
              </h2>
              <form onSubmit={invite} className="space-y-3 px-5 py-4" noValidate>
                <div className="flex flex-wrap items-end gap-2">
                  <Input
                    label="Correo"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => {
                      setInviteEmail(e.target.value);
                      setInviteError(null);
                    }}
                    placeholder="nombre@empresa.com"
                    autoComplete="off"
                    error={inviteError || undefined}
                    wrapperClassName="min-w-[13rem] flex-1"
                  />
                  <Select
                    label="Rol"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as TeamRole)}
                    options={INVITE_ROLES}
                    wrapperClassName="w-40"
                  />
                  <Button type="submit" isLoading={inviting} disabled={!inviteEmail.trim()}>
                    {!inviting && <UserPlus size={15} aria-hidden="true" />}
                    Invitar
                  </Button>
                </div>
                <p className="text-[13px] leading-relaxed text-ink-2">
                  De cualquier dominio. ibPulse todavía no envía el aviso por correo: pídele que se registre con ese correo y entrará
                  directo al equipo. Si ya tiene cuenta, verá la invitación al entrar.{' '}
                  <button
                    type="button"
                    onClick={copySignupLink}
                    className="font-medium text-ink underline decoration-rule-strong underline-offset-2 hover:decoration-ink"
                  >
                    Copiar enlace de registro
                  </button>
                </p>
              </form>
              {invitations.length > 0 && (
                <ul className="divide-y divide-rule border-t border-rule" aria-label="Invitaciones pendientes">
                  {invitations.map((invitation) => (
                    <li key={invitation.id} className="flex items-center gap-3 px-5 py-2">
                      <Mail size={15} aria-hidden="true" className="shrink-0 text-ink-3" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-ink">{invitation.email}</span>
                        <span className="block text-xs text-ink-3">
                          {roleLabel(invitation.role)} · pendiente desde {formatDate(invitation.created_at)}
                        </span>
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-st-red/10 hover:text-st-red"
                        onClick={() => revokeInvitation(invitation)}
                        aria-label={`Revocar la invitación de ${invitation.email}`}
                        title="Revocar"
                      >
                        <X size={15} />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

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
                    {ROLES.filter((r) => r.value !== 'support_agent' || user?.role === 'support_agent' || u.role === 'support_agent').map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
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

        <p className="max-w-3xl text-[13px] text-ink-2">
          Las cuentas de tus clientes no son parte del equipo: dales acceso en{' '}
          <Link to="/clients" className="font-medium text-ink underline decoration-rule-strong underline-offset-2 hover:decoration-ink">
            Clientes
          </Link>
          , en Acceso al portal. Allí solo ven los proyectos de su empresa y aprueban entregas.
        </p>

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
