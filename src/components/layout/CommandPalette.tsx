import {
  BookOpen,
  Building2,
  CalendarDays,
  CornerDownLeft,
  FileText,
  FolderKanban,
  GanttChart,
  Home,
  Inbox,
  LifeBuoy,
  ListChecks,
  LucideIcon,
  MessagesSquare,
  Mic,
  Search,
  Settings
} from 'lucide-react';
import { KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { clientService } from '../../services/clientService';
import { projectService } from '../../services/projectService';
import { ticketService } from '../../services/ticketService';
import { Client, Project, Ticket } from '../../types';
import { formatSequence, normalizeText, ticketSequence, ticketTitle } from '../../utils/tickets';
import { statusLabel } from '../ui/StatusBadge';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface Entry {
  id: string;
  group: string;
  label: string;
  detail?: string;
  to: string;
  icon: LucideIcon;
  haystack: string;
}

const PAGES: { label: string; to: string; icon: LucideIcon; guest?: boolean }[] = [
  { label: 'Inicio', to: '/dashboard', icon: Home, guest: true },
  { label: 'Proyectos', to: '/projects', icon: FolderKanban, guest: true },
  { label: 'Tareas', to: '/tasks', icon: ListChecks, guest: true },
  { label: 'Agenda', to: '/calendar', icon: CalendarDays, guest: true },
  { label: 'Notificaciones', to: '/inbox', icon: Inbox, guest: true },
  { label: 'Mensajes', to: '/messages', icon: MessagesSquare },
  { label: 'Reuniones', to: '/meetings', icon: Mic, guest: true },
  { label: 'Cronograma', to: '/roadmaps', icon: GanttChart },
  { label: 'Clientes', to: '/clients', icon: Building2 },
  { label: 'Documentación', to: '/documentation', icon: BookOpen, guest: true },
  { label: 'Configuración', to: '/settings', icon: Settings },
  { label: 'Ayuda y soporte', to: '/help', icon: LifeBuoy, guest: true },
];

const GROUP_LIMIT = 6;

/** Ctrl+K: jump to any project, ticket, client or page by typing part of its name. */
export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [data, setData] = useState<{ projects: Project[]; tickets: Ticket[]; clients: Client[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const isGuest = user?.role === 'guest';

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => inputRef.current?.focus());
    document.body.style.overflow = 'hidden';
    if (!data && !loading) {
      setLoading(true);
      Promise.allSettled([
        projectService.getAll(),
        ticketService.getAll(),
        isGuest ? Promise.resolve([] as Client[]) : clientService.getAll(),
      ]).then(([projects, tickets, clients]) => {
        setData({
          projects: projects.status === 'fulfilled' ? projects.value : [],
          tickets: tickets.status === 'fulfilled' ? tickets.value : [],
          clients: clients.status === 'fulfilled' ? clients.value : [],
        });
        setLoading(false);
      });
    }
    return () => {
      document.body.style.overflow = '';
      previouslyFocused?.focus?.();
    };
    // Data is loaded once per session; reopening reuses it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const entries = useMemo<Entry[]>(() => {
    const list: Entry[] = PAGES.filter((page) => !isGuest || page.guest).map((page) => ({
      id: `page:${page.to}`,
      group: 'Ir a',
      label: page.label,
      to: page.to,
      icon: page.icon,
      haystack: normalizeText(page.label),
    }));
    if (!data) return list;
    const projectNames = new Map(data.projects.map((p) => [p.id, p.name]));
    for (const project of data.projects) {
      const client = project.clients?.name;
      list.push({
        id: `project:${project.id}`,
        group: 'Proyectos',
        label: project.name,
        detail: [client, statusLabel(project.status)].filter(Boolean).join(' · '),
        to: `/project/${project.id}`,
        icon: FolderKanban,
        haystack: normalizeText(`${project.name} ${client || ''}`),
      });
    }
    const sequence = ticketSequence(data.tickets);
    for (const ticket of data.tickets) {
      const title = ticketTitle(ticket);
      const projectName = ticket.projects?.name || projectNames.get(ticket.project_id) || '';
      list.push({
        id: `ticket:${ticket.id}`,
        group: 'Tickets',
        label: title,
        detail: [projectName, formatSequence(sequence.get(ticket.id))].filter(Boolean).join(' · '),
        to: `/ticket/${ticket.id}`,
        icon: FileText,
        haystack: normalizeText(`${title} ${projectName} ${ticket.clients?.name || ''} ${ticket.request_type || ''}`),
      });
    }
    for (const client of data.clients) {
      list.push({
        id: `client:${client.id}`,
        group: 'Clientes',
        label: client.name,
        detail: client.email || undefined,
        to: `/clients?client=${client.id}`,
        icon: Building2,
        haystack: normalizeText(`${client.name} ${client.email || ''}`),
      });
    }
    return list;
  }, [data, isGuest]);

  const results = useMemo(() => {
    const terms = normalizeText(query).split(/\s+/).filter(Boolean);
    const counts = new Map<string, number>();
    const matches: Entry[] = [];
    for (const entry of entries) {
      if (terms.length === 0 && entry.group !== 'Ir a') continue;
      if (!terms.every((term) => entry.haystack.includes(term))) continue;
      const count = counts.get(entry.group) || 0;
      if (count >= GROUP_LIMIT) continue;
      counts.set(entry.group, count + 1);
      matches.push(entry);
    }
    // Records first when searching; pages first when the box is empty.
    const order = terms.length ? ['Proyectos', 'Tickets', 'Clientes', 'Ir a'] : ['Ir a'];
    return order.flatMap((group) => matches.filter((m) => m.group === group));
  }, [entries, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!open) return null;

  const go = (entry: Entry | undefined) => {
    if (!entry) return;
    onClose();
    navigate(entry.to);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => Math.min(results.length - 1, i + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      go(results[activeIndex]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    } else if (event.key === 'Tab') {
      // Focus stays in the search box while the palette is open.
      event.preventDefault();
    }
  };

  let lastGroup = '';

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-start justify-center px-3 pt-[10vh]" onKeyDown={onKeyDown}>
      <div className="absolute inset-0 bg-[oklch(0.18_0.02_260/0.45)] animate-fade" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Buscar"
        className="sheet relative flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden border-t-2 border-t-brand shadow-lift animate-sheet-in"
      >
        <div className="flex items-center gap-2.5 border-b border-rule px-4">
          <Search size={17} aria-hidden="true" className="shrink-0 text-ink-3" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Proyecto, ticket, cliente o página"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={results[activeIndex] ? `${listId}-${activeIndex}` : undefined}
            aria-autocomplete="list"
            className="h-12 w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3"
          />
          <kbd className="shrink-0 rounded-inner border border-rule px-1.5 font-mono text-[11px] text-ink-3">Esc</kbd>
        </div>

        <div ref={listRef} id={listId} role="listbox" aria-label="Resultados" className="overflow-y-auto py-1.5">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-3">
              {loading ? 'Cargando proyectos y tickets…' : `Nada coincide con «${query}».`}
            </p>
          ) : (
            results.map((entry, index) => {
              const showGroup = entry.group !== lastGroup;
              lastGroup = entry.group;
              const Icon = entry.icon;
              return (
                <div key={entry.id}>
                  {showGroup && <p className="caption px-4 pb-1 pt-2.5">{entry.group}</p>}
                  <div
                    id={`${listId}-${index}`}
                    data-index={index}
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseMove={() => setActiveIndex(index)}
                    onClick={() => go(entry)}
                    className={cn(
                      'mx-1.5 flex cursor-pointer items-center gap-3 rounded-inner px-2.5 py-2',
                      index === activeIndex && 'bg-ink/[0.06]'
                    )}
                  >
                    <Icon size={16} aria-hidden="true" className="shrink-0 text-ink-3" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">{entry.label}</span>
                      {entry.detail && <span className="block truncate text-xs text-ink-3">{entry.detail}</span>}
                    </span>
                    {index === activeIndex && <CornerDownLeft size={14} aria-hidden="true" className="shrink-0 text-ink-3" />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
