import { AlertTriangle, ChevronLeft, ChevronRight, FileText, FolderKanban, LucideIcon, Mic } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { statusInkClass, statusLabel } from '../components/ui/StatusBadge';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { meetingService } from '../services/meetingService';
import { projectService } from '../services/projectService';
import { ticketService } from '../services/ticketService';
import { Meeting, Project, Ticket } from '../types';
import { daysFromToday, formatDate, isFinished, isOverdue, parseDate } from '../utils/format';
import { ticketTitle } from '../utils/tickets';

type Kind = 'ticket' | 'project' | 'meeting';

interface AgendaItem {
  id: string;
  kind: Kind;
  date: Date;
  title: string;
  detail: string;
  to: string;
  status?: string;
  overdue: boolean;
  finished: boolean;
  mine: boolean;
}

const KIND: Record<Kind, { label: string; icon: LucideIcon }> = {
  ticket: { label: 'Tickets', icon: FileText },
  project: { label: 'Entregas', icon: FolderKanban },
  meeting: { label: 'Reuniones', icon: Mic },
};

const WEEKDAYS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
const monthTitle = new Intl.DateTimeFormat('es-DO', { month: 'long', year: 'numeric' });
const dayTitle = new Intl.DateTimeFormat('es-DO', { weekday: 'long', day: 'numeric', month: 'long' });

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Deadlines, deliveries and meetings on one desk calendar. */
export function CalendarPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [kinds, setKinds] = useState<Record<Kind, boolean>>({ ticket: true, project: true, meeting: true });
  const [onlyMine, setOnlyMine] = useState(false);

  useEffect(() => {
    Promise.allSettled([projectService.getAll(), ticketService.getAll(), meetingService.getAll()]).then(
      ([p, t, m]) => {
        if (p.status === 'fulfilled') setProjects(p.value);
        if (t.status === 'fulfilled') setTickets(t.value);
        if (m.status === 'fulfilled') setMeetings(m.value as Meeting[]);
        setLoading(false);
      }
    );
  }, []);

  const items = useMemo<AgendaItem[]>(() => {
    const list: AgendaItem[] = [];
    const projectNames = new Map(projects.map((p) => [p.id, p.name]));
    for (const ticket of tickets) {
      const date = parseDate(ticket.deadline);
      if (!date) continue;
      list.push({
        id: `t-${ticket.id}`,
        kind: 'ticket',
        date,
        title: ticketTitle(ticket),
        detail: ticket.projects?.name || projectNames.get(ticket.project_id) || 'Ticket',
        to: `/ticket/${ticket.id}`,
        status: ticket.status,
        overdue: isOverdue(ticket.deadline, ticket.status),
        finished: isFinished(ticket.status),
        mine: !!user && (ticket.assigned_to === user.id || ticket.created_by === user.id),
      });
    }
    for (const project of projects) {
      const date = parseDate(project.end_date);
      if (!date) continue;
      list.push({
        id: `p-${project.id}`,
        kind: 'project',
        date,
        title: project.name,
        detail: project.clients?.name ? `Entrega · ${project.clients.name}` : 'Entrega',
        to: `/project/${project.id}`,
        status: project.status,
        overdue: isOverdue(project.end_date, project.status),
        finished: isFinished(project.status),
        mine: !!user && (project.assignee === user.id || project.created_by === user.id),
      });
    }
    for (const meeting of meetings) {
      const date = parseDate(meeting.date);
      if (!date) continue;
      list.push({
        id: `m-${meeting.id}`,
        kind: 'meeting',
        date,
        title: meeting.title,
        detail: `Reunión · ${formatDate(meeting.date, 'time')}`,
        to: `/meetings/${meeting.id}`,
        overdue: false,
        finished: date.getTime() < Date.now(),
        mine: !!user && meeting.user_id === user.id,
      });
    }
    return list
      .filter((item) => kinds[item.kind] && (!onlyMine || item.mine))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [projects, tickets, meetings, kinds, onlyMine, user]);

  const byDay = useMemo(() => {
    const map = new Map<string, AgendaItem[]>();
    for (const item of items) {
      const key = dayKey(item.date);
      map.set(key, [...(map.get(key) || []), item]);
    }
    return map;
  }, [items]);

  // Six weeks starting on the Monday on or before the 1st.
  const days = useMemo(() => {
    const offset = (month.getDay() + 6) % 7;
    const start = new Date(month.getFullYear(), month.getMonth(), 1 - offset);
    return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }, [month]);

  const overdue = items.filter((item) => item.overdue);
  const upcoming = items.filter((item) => {
    const d = daysFromToday(item.date);
    return d !== null && d >= 0 && d <= 14 && !item.finished;
  });
  const upcomingByDay = upcoming.reduce<{ key: string; date: Date; items: AgendaItem[] }[]>((groups, item) => {
    const key = dayKey(item.date);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(item);
    else groups.push({ key, date: item.date, items: [item] });
    return groups;
  }, []);

  const todayKey = dayKey(new Date());
  const shiftMonth = (delta: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="Agenda"
        subtitle="Fechas límite de tickets, entregas de proyectos y reuniones, en un solo calendario."
      >
        <div role="group" aria-label="Mostrar" className="flex flex-wrap items-center gap-1.5">
          {(Object.keys(KIND) as Kind[]).map((kind) => {
            const Icon = KIND[kind].icon;
            return (
              <button
                key={kind}
                type="button"
                aria-pressed={kinds[kind]}
                onClick={() => setKinds((k) => ({ ...k, [kind]: !k[kind] }))}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-control border px-2.5 text-[13px] font-medium transition-colors',
                  kinds[kind] ? 'border-ink/70 bg-paper text-ink' : 'border-rule text-ink-3 hover:text-ink-2'
                )}
              >
                <Icon size={14} aria-hidden="true" />
                {KIND[kind].label}
              </button>
            );
          })}
          <button
            type="button"
            aria-pressed={onlyMine}
            onClick={() => setOnlyMine((v) => !v)}
            className={cn(
              'inline-flex h-8 items-center rounded-control border px-2.5 text-[13px] font-medium transition-colors',
              onlyMine ? 'border-ink/70 bg-paper text-ink' : 'border-rule text-ink-3 hover:text-ink-2'
            )}
          >
            Solo lo mío
          </button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 flex-1 gap-5 px-4 py-5 sm:px-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Month */}
        <section className="sheet hidden min-w-0 md:block" aria-label={capitalize(monthTitle.format(month))}>
          <div className="flex items-center justify-between gap-3 border-b border-rule px-4 py-3">
            <h2 className="text-base font-semibold text-ink">{capitalize(monthTitle.format(month))}</h2>
            <div className="flex items-center gap-1">
              <Button variant="secondary" size="sm" onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>
                Hoy
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Mes anterior" onClick={() => shiftMonth(-1)}>
                <ChevronLeft size={18} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Mes siguiente" onClick={() => shiftMonth(1)}>
                <ChevronRight size={18} />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-7 border-b border-rule bg-well">
            {WEEKDAYS.map((d) => (
              <div key={d} className="caption px-2 py-1.5">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              const key = dayKey(day);
              const dayItems = byDay.get(key) || [];
              const inMonth = day.getMonth() === month.getMonth();
              const isToday = key === todayKey;
              const weekend = index % 7 >= 5;
              return (
                <div
                  key={key}
                  className={cn(
                    'min-h-[7.5rem] border-b border-r border-rule p-1.5 [&:nth-child(7n)]:border-r-0',
                    weekend && 'bg-well/70',
                    !inMonth && 'bg-desk/60'
                  )}
                >
                  <div className="mb-1 flex items-center justify-between px-0.5">
                    <span
                      className={cn(
                        'inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs tabular-nums',
                        isToday ? 'bg-brand font-bold text-on-brand' : inMonth ? 'font-medium text-ink-2' : 'text-ink-3/70'
                      )}
                      aria-label={isToday ? `Hoy, ${day.getDate()}` : undefined}
                    >
                      {day.getDate()}
                    </span>
                  </div>
                  {loading ? (
                    index % 5 === 0 && <Skeleton className="h-4 w-4/5" />
                  ) : (
                    <ul className="space-y-0.5">
                      {dayItems.slice(0, 3).map((item) => (
                        <li key={item.id}>
                          <AgendaChip item={item} />
                        </li>
                      ))}
                      {dayItems.length > 3 && (
                        <li className="px-1 text-[11px] font-medium text-ink-3">+{dayItems.length - 3} más</li>
                      )}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Next two weeks */}
        <aside className="space-y-5" aria-label="Próximos días">
          {overdue.length > 0 && (
            <section className="sheet">
              <h2 className="flex items-center gap-2 border-b border-rule px-4 py-2.5 text-sm font-semibold text-st-red">
                <AlertTriangle size={15} aria-hidden="true" />
                Vencidos ({overdue.length})
              </h2>
              <ul className="divide-y divide-rule">
                {overdue.slice(0, 8).map((item) => (
                  <li key={item.id}>
                    <AgendaRow item={item} />
                  </li>
                ))}
              </ul>
              {overdue.length > 8 && (
                <p className="border-t border-rule px-4 py-2 text-xs text-ink-3">Y {overdue.length - 8} más en la vista de mes.</p>
              )}
            </section>
          )}

          <section className="sheet">
            <h2 className="border-b border-rule px-4 py-2.5 text-sm font-semibold text-ink">Próximos 14 días</h2>
            {loading ? (
              <div className="space-y-3 p-4">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            ) : upcomingByDay.length === 0 ? (
              <p className="px-4 py-5 text-sm text-ink-3">
                Nada vence en las próximas dos semanas. Las fechas límite se ponen al crear o editar un ticket.
              </p>
            ) : (
              upcomingByDay.map((group) => (
                <div key={group.key}>
                  <p className="caption border-b border-rule bg-well px-4 py-1.5">
                    {capitalize(relativeHeading(group.date))}
                  </p>
                  <ul className="divide-y divide-rule">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <AgendaRow item={item} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function relativeHeading(date: Date) {
  const d = daysFromToday(date);
  if (d === 0) return `hoy · ${dayTitle.format(date)}`;
  if (d === 1) return `mañana · ${dayTitle.format(date)}`;
  return dayTitle.format(date);
}

function AgendaChip({ item }: { item: AgendaItem }) {
  const Icon = KIND[item.kind].icon;
  return (
    <Link
      to={item.to}
      title={`${item.title} — ${item.detail}${item.status ? ` · ${statusLabel(item.status)}` : ''}`}
      className={cn(
        'flex items-center gap-1 rounded-inner px-1 py-0.5 text-[11.5px] leading-tight hover:bg-ink/[0.06]',
        item.overdue ? 'text-st-red' : item.finished ? 'text-ink-3 line-through decoration-ink-3/60' : 'text-ink'
      )}
    >
      <Icon size={11} aria-hidden="true" className={cn('shrink-0', item.status ? statusInkClass(item.status) : 'text-ink-3')} />
      <span className="truncate">{item.title}</span>
    </Link>
  );
}

function AgendaRow({ item }: { item: AgendaItem }) {
  const Icon = KIND[item.kind].icon;
  return (
    <Link to={item.to} className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-ink/[0.03]">
      <Icon size={15} aria-hidden="true" className={cn('mt-0.5 shrink-0', item.status ? statusInkClass(item.status) : 'text-ink-3')} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink">{item.title}</span>
        <span className="block truncate text-xs text-ink-3">
          {item.detail}
          {item.overdue && <span className="font-semibold text-st-red"> · venció {formatDate(item.date, 'day')}</span>}
        </span>
      </span>
    </Link>
  );
}
