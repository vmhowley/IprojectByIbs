import {
  BookOpen,
  Building2,
  CalendarDays,
  FolderKanban,
  GanttChart,
  Hash,
  HelpCircle,
  Home,
  LifeBuoy,
  ListChecks,
  LucideIcon,
  MessagesSquare,
  Mic,
  Plus,
  X
} from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { useSubscription } from '../../hooks/useSubscription';
import { cn } from '../../lib/utils';
import { channelService } from '../../services/channelService';
import { Channel as TeamChannel } from '../../types/Channel';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Logo } from '../ui/Logo';
import { Modal } from '../ui/Modal';

interface SidebarProps {
  onNewProject?: () => void;
  isOpen?: boolean;
  onClose: () => void;
}

interface NavEntry {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Other paths that belong to this entry, e.g. a project's own page. */
  match?: string[];
  hideForGuest?: boolean;
}

const MAIN: NavEntry[] = [
  { to: '/dashboard', label: 'Inicio', icon: Home },
  { to: '/messages', label: 'Mensajes', icon: MessagesSquare, hideForGuest: true },
];

const WORK: NavEntry[] = [
  { to: '/projects', label: 'Proyectos', icon: FolderKanban, match: ['/project/', '/ticket/'] },
  { to: '/tasks', label: 'Tareas', icon: ListChecks },
  { to: '/calendar', label: 'Agenda', icon: CalendarDays },
  { to: '/meetings', label: 'Reuniones', icon: Mic, match: ['/meetings/'] },
  { to: '/roadmaps', label: 'Cronograma', icon: GanttChart, hideForGuest: true },
  { to: '/clients', label: 'Clientes', icon: Building2, hideForGuest: true },
  { to: '/documentation', label: 'Documentación', icon: BookOpen },
];

/** The binder's index: every section of the work, one line each. */
export function Sidebar({ onNewProject, isOpen = false, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPro, limits } = useSubscription();
  const { canCreate } = usePermissions();
  const isGuest = user?.role === 'guest';

  const [channels, setChannels] = useState<TeamChannel[]>([]);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'guest') {
      loadChannels();
    }
  }, [user?.id, user?.role]);

  // Close the drawer with Escape on small screens.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const loadChannels = async () => {
    try {
      const data = await channelService.getAll();
      setChannels(data);
    } catch (error) {
      console.error('Error loading channels:', error);
    }
  };

  const isActive = (entry: NavEntry) =>
    location.pathname === entry.to ||
    (entry.match || []).some((prefix) => location.pathname.startsWith(prefix));

  const renderEntry = (entry: NavEntry) => {
    if (entry.hideForGuest && isGuest) return null;
    const active = isActive(entry);
    const Icon = entry.icon;
    return (
      <Link
        key={entry.to}
        to={entry.to}
        onClick={onClose}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex h-8 items-center gap-2.5 rounded-control border px-2 text-sm transition-colors',
          active
            ? 'border-transparent bg-brand/10 font-semibold text-brand-strong'
            : 'border-transparent text-ink-2 hover:bg-ink/[0.05] hover:text-ink'
        )}
      >
        <Icon size={16} aria-hidden="true" className={active ? 'text-brand' : 'text-ink-3'} />
        <span className="truncate">{entry.label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[oklch(0.18_0.02_260/0.45)] animate-fade md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Navegación principal"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-full w-64 shrink-0 flex-col border-r border-rule bg-paper md:static md:w-60',
          'transition-[transform,visibility] duration-200 ease-out',
          isOpen ? 'translate-x-0' : 'max-md:invisible max-md:-translate-x-full'
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-rule px-4">
          <Link to="/dashboard" onClick={onClose} className="flex min-w-0 flex-col items-start gap-0.5 py-1">
            <Logo className="h-[22px]" />
            <span className="caption leading-none [word-spacing:0.2em]">BY IBSYSTEMS.SRL</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="inline-flex h-8 w-8 items-center justify-center rounded-control text-ink-2 hover:bg-ink/[0.06] md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          <div className="space-y-0.5">{MAIN.map(renderEntry)}</div>

          <div>
            <p className="caption px-2 pb-1.5">Trabajo</p>
            <div className="space-y-0.5">{WORK.map(renderEntry)}</div>
          </div>

          {!isGuest && (
            <div>
              <div className="flex items-center justify-between pb-1 pl-2">
                <p className="caption">Canales</p>
                <button
                  type="button"
                  onClick={() => setIsChannelModalOpen(true)}
                  aria-label="Crear canal"
                  title="Crear canal"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-control text-ink-3 hover:bg-ink/[0.06] hover:text-ink"
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="space-y-0.5">
                {channels.length === 0 && (
                  <p className="px-2 py-1 text-xs leading-relaxed text-ink-3">
                    Los canales reúnen las conversaciones del equipo por tema.
                  </p>
                )}
                {channels.map((channel) => {
                  const path = `/channels/${channel.id}`;
                  const active = location.pathname === path;
                  return (
                    <Link
                      key={channel.id}
                      to={path}
                      onClick={onClose}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex h-8 items-center gap-2 rounded-control border px-2 text-sm transition-colors',
                        active
                          ? 'border-transparent bg-brand/10 font-semibold text-brand-strong'
                          : 'border-transparent text-ink-2 hover:bg-ink/[0.05] hover:text-ink'
                      )}
                    >
                      <Hash size={14} aria-hidden="true" className={active ? 'text-brand' : 'text-ink-3'} />
                      <span className="truncate">{channel.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        <div className="shrink-0 space-y-3 border-t border-rule px-3 py-3">
          {onNewProject && canCreate() && (
            <Button variant="secondary" size="sm" className="w-full" onClick={() => { onClose(); onNewProject(); }}>
              <Plus size={15} aria-hidden="true" />
              Nuevo proyecto
            </Button>
          )}

          {!isPro && !isGuest && (
            <p className="px-1 text-xs leading-relaxed text-ink-2">
              Plan Gratis: hasta {limits.maxProjects} proyectos y {limits.maxClients} clientes.{' '}
              <Link to="/pricing" className="font-semibold text-ink underline decoration-rule-strong hover:decoration-ink">
                Ver planes
              </Link>
            </p>
          )}

          <div className="space-y-0.5">
            <Link
              to="/help"
              onClick={onClose}
              aria-current={location.pathname === '/help' ? 'page' : undefined}
              className="flex h-8 items-center gap-2.5 rounded-control px-2 text-sm text-ink-2 transition-colors hover:bg-ink/[0.05] hover:text-ink"
            >
              <HelpCircle size={16} aria-hidden="true" className="text-ink-3" />
              Ayuda y soporte
            </Link>
            {/* Opens the live support slip (SupportChatWidget listens for this event). */}
            <button
              type="button"
              onClick={() => {
                onClose();
                window.dispatchEvent(new Event('open-support-chat'));
              }}
              className="flex h-8 w-full items-center gap-2.5 rounded-control px-2 text-left text-sm text-ink-2 transition-colors hover:bg-ink/[0.05] hover:text-ink"
            >
              <LifeBuoy size={16} aria-hidden="true" className="text-ink-3" />
              Chat en vivo
            </button>
          </div>
        </div>
      </aside>

      <NewChannelModal
        isOpen={isChannelModalOpen}
        onClose={() => setIsChannelModalOpen(false)}
        onCreated={(channel) => {
          setIsChannelModalOpen(false);
          loadChannels();
          onClose();
          navigate(`/channels/${channel.id}`);
        }}
      />
    </>
  );
}

function NewChannelModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (channel: TeamChannel) => void;
}) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setName('');
  }, [isOpen]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    // Normalize: remove # if present
    const cleanName = name.trim().replace(/^#/, '');
    if (!cleanName) return;
    setSaving(true);
    try {
      const channel = await channelService.create(cleanName);
      toast.success(`Canal #${channel.name} creado`);
      onCreated(channel);
    } catch (error) {
      console.error(error);
      toast.error('No se pudo crear el canal. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      dismissible={!saving}
      title="Nuevo canal"
      description="Todo el equipo de tu dominio podrá leerlo y escribir en él."
      size="sm"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="new-channel-form" isLoading={saving} disabled={!name.trim()}>
            Crear canal
          </Button>
        </>
      }
    >
      <form id="new-channel-form" onSubmit={handleSubmit}>
        <Input
          label="Nombre"
          placeholder="general, soporte-apap, pases…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />
      </form>
    </Modal>
  );
}
