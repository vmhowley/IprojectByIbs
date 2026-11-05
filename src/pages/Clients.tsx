import { ArrowLeft, Building2, FolderPlus, Mail, Pencil, Phone, Plus, Trash2, UserPlus, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { DeleteClientModal } from '../components/client/DeleteClientModal';
import { LinkUserModal } from '../components/client/LinkUserModal';
import { NewClientModal } from '../components/client/NewClientModal';
import { NewContactModal } from '../components/client/NewContactModal';
import { StatCard, StatStrip } from '../components/dashboard/StatCard';
import { PageHeader } from '../components/layout/PageHeader';
import { NewProjectModal } from '../components/project/NewProjectModal';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { confirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Money, MoneyTotals } from '../components/ui/Money';
import { Skeleton, SkeletonRows } from '../components/ui/Skeleton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { TableView } from '../components/views/TableView';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { useSubscription } from '../hooks/useSubscription';
import NProgress from '../lib/nprogress';
import { cn } from '../lib/utils';
import { clientService } from '../services/clientService';
import { contactService } from '../services/contactService';
import { createProjectWithFiles } from '../services/projectCreation';
import { projectService } from '../services/projectService';
import { Project } from '../types';
import { Client, Contact } from '../types/Client';
import { User as UserType } from '../types/User';
import { formatDate, isOverdue, sortCurrencies, formatMoney, sumByCurrency } from '../utils/format';
import { errorCode } from '../utils/errors';
import { normalizeText } from '../utils/tickets';

const isOpenProject = (p: Project) => p.status === 'active' || p.status === 'on_hold';
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The client book: each company with its people, its projects and what was quoted to it. */
export function Clients() {
  const { limits, isPro } = useSubscription();
  const { user } = useAuth();
  const { isAdmin, canCreate } = usePermissions();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('client');

  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  // Linked Users state
  const [linkedUsers, setLinkedUsers] = useState<UserType[]>([]);
  const [showLinkUserModal, setShowLinkUserModal] = useState(false);
  const [showDeleteClientModal, setShowDeleteClientModal] = useState(false);

  const canSeeMoney = isAdmin();
  const selectedClient = clients.find((c) => c.id === selectedId) || null;

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadDetail(selectedId);
    } else {
      setContacts([]);
      setLinkedUsers([]);
    }
  }, [selectedId]);

  const loadClients = async () => {
    try {
      NProgress.start();
      const [clientList, projectList] = await Promise.all([
        clientService.getAll(),
        projectService.getAll().catch((error) => {
          console.error('Error loading projects:', error);
          return [] as Project[];
        }),
      ]);
      setClients(clientList);
      setProjects(projectList);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast.error('No se pudieron cargar los clientes.');
    } finally {
      setIsLoading(false);
      NProgress.done();
    }
  };

  const loadContacts = async (clientId: string) => {
    try {
      const data: Contact[] = await clientService.getContacts(clientId);
      // The main contact first, then by name.
      setContacts([...data].sort((a, b) => Number(b.is_primary) - Number(a.is_primary)));
    } catch (error) {
      console.error('Error loading contacts:', error);
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

  const loadDetail = async (clientId: string) => {
    setDetailLoading(true);
    await Promise.all([loadContacts(clientId), loadLinkedUsers(clientId)]);
    setDetailLoading(false);
  };

  const selectClient = (clientId: string | null) => {
    setSearchParams(clientId ? { client: clientId } : {});
  };

  // ── Clients ──────────────────────────────────────────────────────────────

  const handleNewClientClick = async () => {
    // If limit is reached
    if (!isPro && clients.length >= limits.maxClients) {
      const upgrade = await confirmDialog({
        title: 'Límite del plan Gratis',
        message: `Tu plan permite ${limits.maxClients} clientes. Con Pro puedes registrar todos los que necesites.`,
        confirmText: 'Ver planes',
        cancelText: 'Ahora no',
        tone: 'primary',
      });
      if (upgrade) navigate('/pricing');
      return;
    }
    setEditingClient(null);
    setShowNewClientModal(true);
  };

  const handleSaveClient = async (clientData: Partial<Client>) => {
    if (editingClient && editingClient.id === clientData.id) {
      // Update
      await clientService.update(editingClient.id, clientData);
      toast.success('Cambios guardados');
      await loadClients();
    } else {
      // Create
      const created = await clientService.create(clientData);
      toast.success(`Cliente ${created.name} registrado`);
      await loadClients();
      selectClient(created.id);
    }
    setShowNewClientModal(false);
    setEditingClient(null);
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    try {
      await clientService.delete(selectedClient.id);
    } catch (error) {
      console.error('Error al eliminar el cliente:', error);
      // 23503: rows in other tables still point at this client.
      throw new Error(
        errorCode(error) === '23503'
          ? 'Este cliente todavía tiene proyectos, tickets o usuarios vinculados.'
          : 'No se pudo eliminar el cliente. Inténtalo de nuevo.'
      );
    }
    toast.success('Cliente eliminado');
    selectClient(null);
    await loadClients();
  };

  // ── Contacts ─────────────────────────────────────────────────────────────

  const handleSaveContact = async (contactData: Partial<Contact>) => {
    if (editingContact) {
      // Update
      await contactService.update(editingContact.id, contactData);
      toast.success('Contacto actualizado');
    } else {
      // Create
      await contactService.create(contactData);
      toast.success('Contacto registrado');
    }
    await loadContacts(selectedClient?.id || '');
    setShowNewContactModal(false);
    setEditingContact(null);
  };

  const handleDeleteContact = async (contact: Contact) => {
    const ok = await confirmDialog({
      title: 'Eliminar contacto',
      message: `Se eliminará a ${contact.name} de la lista de contactos.`,
      confirmText: 'Eliminar',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await contactService.delete(contact.id);
      toast.success('Contacto eliminado');
      loadContacts(selectedClient?.id || '');
    } catch (error) {
      console.error('Error al eliminar el contacto:', error);
      toast.error(
        errorCode(error) === '23503'
          ? `${contact.name} es el contacto de algún proyecto, ticket o usuario. Cámbialo allí primero.`
          : 'No se pudo eliminar el contacto.'
      );
    }
  };

  // ── Portal access ────────────────────────────────────────────────────────

  const handleLinkUser = async (email: string) => {
    if (!selectedClient) return;
    try {
      await clientService.linkUser(email, selectedClient.id);
      await loadLinkedUsers(selectedClient.id);
      toast.success('Acceso concedido');
      setShowLinkUserModal(false);
    } catch (error) {
      console.error('Error linking user:', error);
      throw error; // Let modal handle error display
    }
  };

  const handleUnlinkUser = async (linked: UserType) => {
    const ok = await confirmDialog({
      title: 'Quitar acceso al portal',
      message: `${linked.name || linked.email} dejará de ver los proyectos y tickets de ${selectedClient?.name}.`,
      confirmText: 'Quitar acceso',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await clientService.unlinkUser(linked.id);
      if (selectedClient) {
        await loadLinkedUsers(selectedClient.id);
      }
      toast.success('Acceso retirado');
    } catch (error) {
      console.error('Error unlinking user:', error);
      toast.error('No se pudo quitar el acceso.');
    }
  };

  // ── Projects ─────────────────────────────────────────────────────────────

  const handleCreateProject = async (projectData: Partial<Project>, files: File[]) => {
    const created = await createProjectWithFiles(projectData, files);
    navigate(`/project/${created.id}`);
  };

  // ── Derived ──────────────────────────────────────────────────────────────

  const projectsByClient = useMemo(() => {
    const map = new Map<string, Project[]>();
    for (const project of projects) {
      if (!project.client_id) continue;
      const list = map.get(project.client_id) || [];
      list.push(project);
      map.set(project.client_id, list);
    }
    return map;
  }, [projects]);

  const filteredClients = useMemo(() => {
    const term = normalizeText(searchQuery.trim());
    if (!term) return clients;
    return clients.filter((client) => normalizeText(`${client.name} ${client.email || ''}`).includes(term));
  }, [clients, searchQuery]);

  const clientProjects = selectedClient ? projectsByClient.get(selectedClient.id) || [] : [];
  const pick = (p: Project) => ({ amount: p.cost, currency: p.currency });
  const quotedOpen = sumByCurrency(clientProjects.filter(isOpenProject), pick);
  const quotedDone = sumByCurrency(clientProjects.filter((p) => p.status === 'completed'), pick);
  const quotedAll = sumByCurrency(clientProjects, pick);
  const unpriced = clientProjects.filter((p) => p.cost === null || p.cost === undefined).length;
  const primaryContact = contacts.find((c) => c.is_primary);

  const canDeleteClient = !!selectedClient && (isAdmin() || selectedClient.user_id === user?.id);
  const deleteBlockers = [
    ...(clientProjects.length > 0 ? [plural(clientProjects.length, 'proyecto', 'proyectos')] : []),
    ...(linkedUsers.length > 0 ? [plural(linkedUsers.length, 'persona con acceso al portal', 'personas con acceso al portal')] : []),
  ];

  const totalCurrencies = sortCurrencies(Object.keys(quotedAll));

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="Clientes"
        subtitle={
          isLoading
            ? 'Cargando clientes…'
            : `${plural(clients.length, 'cliente', 'clientes')}. Sus contactos, sus proyectos y lo cotizado a cada uno.`
        }
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Buscar cliente',
        }}
        actions={canCreate() ? [{ label: 'Nuevo cliente', icon: Plus, onClick: handleNewClientClick }] : []}
      />

      <div className="grid grid-cols-1 flex-1 items-start gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[19rem_minmax(0,1fr)] xl:grid-cols-[22rem_minmax(0,1fr)]">
        {/* Clients List */}
        <nav
          aria-label="Lista de clientes"
          className={cn('sheet overflow-hidden lg:sticky lg:top-5', selectedClient && 'max-lg:hidden')}
        >
          <div className="flex items-center justify-between gap-3 border-b border-rule bg-well px-4 py-1.5">
            <span className="caption">Cliente</span>
            {canSeeMoney && <span className="caption">Cotizado</span>}
          </div>
          {isLoading ? (
            <SkeletonRows rows={8} columns={2} />
          ) : filteredClients.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-ink-3">
              {searchQuery ? 'Ningún cliente coincide con la búsqueda.' : 'Todavía no hay clientes registrados.'}
            </p>
          ) : (
            <ul className="divide-y divide-rule lg:max-h-[calc(100vh-15rem)] lg:overflow-y-auto">
              {filteredClients.map((client) => {
                const list = projectsByClient.get(client.id) || [];
                const open = list.filter(isOpenProject).length;
                const active = client.id === selectedId;
                return (
                  <li key={client.id}>
                    <Link
                      to={`/clients?client=${client.id}`}
                      aria-current={active ? 'true' : undefined}
                      className={cn(
                        'flex items-start gap-3 px-4 py-2.5 outline-none transition-colors focus-visible:bg-ink/[0.05] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus',
                        active ? 'bg-focus/[0.08]' : 'hover:bg-ink/[0.03]'
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className={cn('block truncate text-sm text-ink', active ? 'font-semibold' : 'font-medium')}>
                          {client.name}
                        </span>
                        <span className="block text-xs text-ink-3">
                          {list.length === 0
                            ? 'Sin proyectos'
                            : `${plural(list.length, 'proyecto', 'proyectos')}${open ? ` · ${plural(open, 'abierto', 'abiertos')}` : ''}`}
                        </span>
                      </span>
                      {canSeeMoney && (
                        <MoneyTotals
                          totals={sumByCurrency(list, pick)}
                          className="items-end pt-0.5 text-right text-xs text-ink-2"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>

        {/* Client Details & Contacts */}
        <div className={cn('min-w-0 space-y-5', !selectedClient && 'max-lg:hidden')}>
          {!selectedClient ? (
            isLoading ? (
              <div className="sheet space-y-3 p-5">
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-40" />
              </div>
            ) : (
              <EmptyState icon={Building2} title={selectedId ? 'No encontramos ese cliente' : 'Elige un cliente'}>
                {selectedId
                  ? 'Puede que se haya eliminado o que no tengas acceso a él.'
                  : 'Verás sus datos, sus proyectos con lo cotizado, sus contactos y quién tiene acceso al portal.'}
              </EmptyState>
            )
          ) : (
            <>
              {/* The client's card */}
              <article className="sheet" aria-labelledby="client-name">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-rule px-5 py-4">
                  <div className="min-w-0">
                    <Link
                      to="/clients"
                      className="mb-1.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink lg:hidden"
                    >
                      <ArrowLeft size={14} aria-hidden="true" />
                      Clientes
                    </Link>
                    <h2 id="client-name" className="text-xl font-semibold leading-tight text-ink">
                      {selectedClient.name}
                    </h2>
                    <p className="mt-1 text-[13px] text-ink-3">Cliente desde {formatDate(selectedClient.created_at, 'long')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditingClient(selectedClient);
                        setShowNewClientModal(true);
                      }}
                    >
                      <Pencil size={14} aria-hidden="true" />
                      Editar
                    </Button>
                    {canDeleteClient && (
                      <Button variant="danger" size="sm" onClick={() => setShowDeleteClientModal(true)}>
                        <Trash2 size={14} aria-hidden="true" />
                        Eliminar
                      </Button>
                    )}
                  </div>
                </div>

                <dl className="grid grid-cols-1 gap-x-6 gap-y-3 px-5 py-4 text-sm sm:grid-cols-2 2xl:grid-cols-4">
                  <div className="min-w-0">
                    <dt className="caption">Correo</dt>
                    <dd className="mt-0.5 truncate">
                      {selectedClient.email ? (
                        <a href={`mailto:${selectedClient.email}`} className="text-ink hover:underline">{selectedClient.email}</a>
                      ) : <span className="text-ink-3">—</span>}
                    </dd>
                  </div>
                  <div>
                    <dt className="caption">Teléfono</dt>
                    <dd className="mt-0.5 tabular-nums">
                      {selectedClient.phone ? (
                        <a href={`tel:${selectedClient.phone}`} className="text-ink hover:underline">{selectedClient.phone}</a>
                      ) : <span className="text-ink-3">—</span>}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="caption">Dirección</dt>
                    <dd className="mt-0.5 text-ink-2">{selectedClient.address || <span className="text-ink-3">—</span>}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="caption">Contacto principal</dt>
                    <dd className="mt-0.5 text-ink-2">
                      {detailLoading ? <Skeleton className="h-4 w-28" /> : primaryContact?.name || <span className="text-ink-3">—</span>}
                    </dd>
                  </div>
                </dl>

                {selectedClient.notes && (
                  <div className="border-t border-rule px-5 py-4">
                    <p className="caption">Notas</p>
                    <p className="mt-1 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-ink-2">{selectedClient.notes}</p>
                  </div>
                )}
              </article>

              {/* Projects and what was quoted */}
              <section className="sheet overflow-hidden" aria-labelledby="client-projects">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <h3 id="client-projects" className="text-[15px] font-semibold text-ink">
                    Proyectos <span className="font-normal tabular-nums text-ink-3">{clientProjects.length}</span>
                  </h3>
                  {canCreate() && (
                    <Button variant="secondary" size="sm" onClick={() => setShowNewProjectModal(true)}>
                      <FolderPlus size={14} aria-hidden="true" />
                      Nuevo proyecto
                    </Button>
                  )}
                </div>

                {canSeeMoney && clientProjects.length > 0 && (
                  <StatStrip className="rounded-none border-x-0 shadow-none">
                    {[
                      { label: 'Abierto', totals: quotedOpen, note: 'Activos y en espera' },
                      { label: 'Completado', totals: quotedDone, note: 'Proyectos terminados' },
                      { label: 'Total cotizado', totals: quotedAll, note: unpriced ? `${plural(unpriced, 'proyecto', 'proyectos')} sin precio` : 'Todos con precio' },
                    ].map((box) => (
                      <StatCard
                        key={box.label}
                        title={box.label}
                        value={<MoneyTotals totals={box.totals} />}
                        subtitle={box.note}
                        className="px-5"
                        valueClassName="text-lg leading-snug @xl:@max-2xl:text-base"
                      />
                    ))}
                  </StatStrip>
                )}

                {clientProjects.length === 0 ? (
                  <p className="border-t border-rule px-5 py-6 text-sm text-ink-3">
                    Este cliente aún no tiene proyectos{canCreate() ? '. Abre el primero con «Nuevo proyecto».' : '.'}
                  </p>
                ) : (
                  <TableView
                    caption={`Proyectos de ${selectedClient.name}`}
                    className="rounded-none border-0 shadow-none"
                    data={clientProjects}
                    rowHref={(p) => `/project/${p.id}`}
                    defaultSort={{ index: 1, dir: 'asc' }}
                    columns={[
                      {
                        header: 'Proyecto',
                        sortValue: (p) => p.name.toLowerCase(),
                        cell: (p) => (
                          // wrap-anywhere: names pasted with non-breaking spaces would otherwise hold the table open on phones.
                          <div className="min-w-0 wrap-anywhere">
                            <Link to={`/project/${p.id}`} className="line-clamp-1 font-medium text-ink hover:underline">
                              {p.name}
                            </Link>
                            {p.use_case_id && <p className="font-mono text-xs text-ink-3">{p.use_case_id}</p>}
                            {/* On phones the Estado column folds in here, so the price stays in view. */}
                            <div className="mt-1 sm:hidden">
                              <StatusBadge status={p.status || 'active'} size="sm" />
                            </div>
                          </div>
                        ),
                      },
                      {
                        header: 'Estado',
                        hideBelow: 'sm',
                        sortValue: (p) => ['active', 'on_hold', 'completed', 'archived'].indexOf(p.status),
                        cell: (p) => <StatusBadge status={p.status || 'active'} size="sm" />,
                      },
                      {
                        header: 'Avance',
                        hideBelow: 'md',
                        sortValue: (p) => (p.stats?.total_tasks ? p.stats.completed_tasks / p.stats.total_tasks : -1),
                        cell: (p) => (
                          <span className="whitespace-nowrap text-[13px] tabular-nums text-ink-2">
                            {p.stats?.completed_tasks || 0}/{p.stats?.total_tasks || 0} tickets
                          </span>
                        ),
                      },
                      {
                        header: 'Entrega',
                        hideBelow: 'sm',
                        sortValue: (p) => p.end_date || '',
                        cell: (p) => (
                          <span className={cn('text-[13px] tabular-nums', isOverdue(p.end_date, p.status) ? 'font-semibold text-st-red' : 'text-ink-2')}>
                            {formatDate(p.end_date) || '—'}
                          </span>
                        ),
                      },
                      ...(canSeeMoney
                        ? [{
                          header: 'Precio',
                          align: 'right' as const,
                          sortValue: (p: Project) => p.cost ?? null,
                          cell: (p: Project) => <Money amount={p.cost} currency={p.currency} className="text-[13px]" empty="—" />,
                        }]
                        : []),
                    ]}
                    footer={
                      canSeeMoney && totalCurrencies.length > 0 ? (
                        <tr className="rule-total">
                          <th scope="row" className="px-4 py-2.5 text-left text-sm font-semibold text-ink">
                            Total · {plural(clientProjects.length, 'proyecto', 'proyectos')}
                          </th>
                          {/* One empty cell per middle column, hidden at the same breakpoints. */}
                          <td className="max-sm:hidden" />
                          <td className="max-md:hidden" />
                          <td className="max-sm:hidden" />
                          <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-sm font-semibold tabular-nums text-ink">
                            {totalCurrencies.map((code) => (
                              <span key={code} className="block">{formatMoney(quotedAll[code], code)}</span>
                            ))}
                          </td>
                        </tr>
                      ) : undefined
                    }
                  />
                )}
              </section>

              <div className="grid grid-cols-1 gap-5 2xl:grid-cols-2">
                {/* Contacts */}
                <section className="sheet self-start" aria-labelledby="client-contacts">
                  <div className="flex items-center justify-between gap-3 border-b border-rule px-5 py-3">
                    <h3 id="client-contacts" className="text-[15px] font-semibold text-ink">
                      Contactos <span className="font-normal tabular-nums text-ink-3">{contacts.length}</span>
                    </h3>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditingContact(null);
                        setShowNewContactModal(true);
                      }}
                    >
                      <Plus size={14} aria-hidden="true" />
                      Agregar contacto
                    </Button>
                  </div>
                  {detailLoading ? (
                    <SkeletonRows rows={3} columns={2} />
                  ) : contacts.length === 0 ? (
                    <EmptyState compact icon={Users} title="Sin contactos">
                      Registra quién pide el trabajo y quién lo aprueba.
                    </EmptyState>
                  ) : (
                    <ul className="divide-y divide-rule">
                      {contacts.map((contact) => (
                        <li key={contact.id} className="flex items-start gap-3 px-5 py-3">
                          <Avatar name={contact.name} size="sm" className="mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="flex flex-wrap items-center gap-x-2 text-sm font-medium text-ink">
                              {contact.name}
                              {contact.is_primary && (
                                <span className="rounded-inner border border-rule-strong/60 px-1 text-2xs font-semibold uppercase tracking-wide text-ink-2">
                                  Principal
                                </span>
                              )}
                            </p>
                            {contact.position && <p className="text-[13px] text-ink-2">{contact.position}</p>}
                            {(contact.email || contact.phone) && (
                              <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                                {contact.email && (
                                  <a href={`mailto:${contact.email}`} className="inline-flex min-w-0 items-center gap-1.5 text-ink-2 hover:text-ink hover:underline">
                                    <Mail size={13} aria-hidden="true" className="shrink-0 text-ink-3" />
                                    <span className="truncate">{contact.email}</span>
                                  </a>
                                )}
                                {contact.phone && (
                                  <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-1.5 tabular-nums text-ink-2 hover:text-ink hover:underline">
                                    <Phone size={13} aria-hidden="true" className="text-ink-3" />
                                    {contact.phone}
                                  </a>
                                )}
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={`Editar a ${contact.name}`}
                              title="Editar"
                              onClick={() => {
                                setEditingContact(contact);
                                setShowNewContactModal(true);
                              }}
                            >
                              <Pencil size={15} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-st-red/10 hover:text-st-red"
                              aria-label={`Eliminar a ${contact.name}`}
                              title="Eliminar"
                              onClick={() => handleDeleteContact(contact)}
                            >
                              <Trash2 size={15} />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {/* Portal access */}
                <section className="sheet self-start" aria-labelledby="client-portal">
                  <div className="flex items-center justify-between gap-3 border-b border-rule px-5 py-3">
                    <h3 id="client-portal" className="text-[15px] font-semibold text-ink">
                      Acceso al portal <span className="font-normal tabular-nums text-ink-3">{linkedUsers.length}</span>
                    </h3>
                    <Button variant="secondary" size="sm" onClick={() => setShowLinkUserModal(true)}>
                      <UserPlus size={14} aria-hidden="true" />
                      Dar acceso
                    </Button>
                  </div>
                  <p className="border-b border-rule px-5 py-2.5 text-[13px] text-ink-2">
                    Estas personas ven los proyectos y tickets de {selectedClient.name} y pueden aprobar entregas. No pueden editar.
                  </p>
                  {detailLoading ? (
                    <SkeletonRows rows={2} columns={2} />
                  ) : linkedUsers.length === 0 ? (
                    <p className="px-5 py-5 text-sm text-ink-3">Nadie tiene acceso al portal de este cliente.</p>
                  ) : (
                    <ul className="divide-y divide-rule">
                      {linkedUsers.map((linked) => (
                        <li key={linked.id} className="flex items-center gap-3 px-5 py-3">
                          <Avatar name={linked.name} src={linked.avatar} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-ink">{linked.name || 'Sin nombre'}</p>
                            <p className="truncate text-[13px] text-ink-3">{linked.email}</p>
                          </div>
                          <Button variant="danger" size="sm" onClick={() => handleUnlinkUser(linked)}>
                            Quitar acceso
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </>
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
          onClose={() => {
            setShowNewContactModal(false);
            setEditingContact(null);
          }}
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
          blockers={deleteBlockers}
        />
      )}

      {selectedClient && showNewProjectModal && (
        <NewProjectModal
          defaultClientId={selectedClient.id}
          onClose={() => setShowNewProjectModal(false)}
          onSubmit={handleCreateProject}
        />
      )}
    </div>
  );
}
