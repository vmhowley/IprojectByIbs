import { RealtimeChat } from '@/components/chat/realtime-chat';
import { ArrowLeft, Lock, MessagesSquare, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { cn } from '../lib/utils';
import { directMessageService } from '../services/directMessageService';
import { getUsers } from '../services/usersService';
import { normalizeText } from '../utils/tickets';

interface Person {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

/** Direct messages between two people of the team. */
export function MessagesPage() {
  const { user: currentUser } = useAuth();
  const { limits } = useSubscription();
  const [searchParams, setSearchParams] = useSearchParams();
  const [people, setPeople] = useState<Person[]>([]);
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const selectedId = searchParams.get('with');

  const loadUnread = useCallback(async () => {
    try {
      setUnread(await directMessageService.getUnreadBySender());
    } catch (error) {
      console.error('Error loading unread messages:', error);
    }
  }, []);

  useEffect(() => {
    const loadPeople = async () => {
      try {
        const data = await getUsers();
        // Filter out the current user from the list
        setPeople((data || []).filter((u: Person) => u.id !== currentUser?.id));
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPeople();
    loadUnread();
    window.addEventListener('direct-messages-read', loadUnread);
    return () => window.removeEventListener('direct-messages-read', loadUnread);
  }, [currentUser?.id, loadUnread]);

  const visiblePeople = useMemo(() => {
    const term = normalizeText(filter.trim());
    const list = term
      ? people.filter((p) => normalizeText(`${p.name} ${p.email}`).includes(term))
      : people;
    // People with unread messages first, then by name.
    return [...list].sort((a, b) => (unread[b.id] || 0) - (unread[a.id] || 0) || a.name.localeCompare(b.name));
  }, [people, filter, unread]);

  const selected = people.find((p) => p.id === selectedId) || null;

  if (!currentUser) return null;

  if (!limits.hasChat) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <EmptyState
          icon={Lock}
          title="Los mensajes directos son parte del plan Pro"
          action={
            <Link
              to="/pricing"
              className="inline-flex h-9 items-center rounded-control border border-brand bg-brand px-3.5 text-sm font-semibold text-on-brand hover:bg-brand-strong"
            >
              Ver planes
            </Link>
          }
        >
          Con Pro cada persona del equipo puede escribir a otra en privado, con el historial guardado. Los canales del equipo
          siguen disponibles en tu plan actual.
        </EmptyState>
      </div>
    );
  }

  const choose = (personId: string | null) => {
    setSearchParams(personId ? { with: personId } : {});
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1">
        {/* People */}
        <aside
          className={cn(
            'flex w-full min-w-0 flex-col border-r border-rule bg-paper md:w-72 lg:w-80',
            selected && 'max-md:hidden'
          )}
          aria-label="Personas"
        >
          <div className="border-b border-rule px-4 pb-3 pt-4">
            <h1 className="text-lg font-semibold text-ink">Mensajes</h1>
            <div className="relative mt-3">
              <Search size={14} aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
              <input
                type="search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Buscar persona"
                aria-label="Buscar persona"
                className="field h-8 pl-8 text-[13px]"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {loading ? (
              <div className="space-y-3 px-4 py-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-3.5 w-2/3" />
                  </div>
                ))}
              </div>
            ) : visiblePeople.length === 0 ? (
              <p className="px-4 py-6 text-sm text-ink-3">
                {filter ? `Nadie coincide con «${filter}».` : 'Cuando alguien más se una a tu equipo aparecerá aquí.'}
              </p>
            ) : (
              visiblePeople.map((person) => {
                const active = person.id === selectedId;
                const count = unread[person.id] || 0;
                return (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => choose(person.id)}
                    aria-current={active ? 'true' : undefined}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                      active ? 'bg-focus/[0.08]' : 'hover:bg-ink/[0.04]'
                    )}
                  >
                    <Avatar name={person.name} src={person.avatar} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className={cn('block truncate text-sm text-ink', (active || count > 0) && 'font-semibold')}>
                        {person.name}
                      </span>
                      <span className="block truncate text-xs text-ink-3">{person.email}</span>
                    </span>
                    {count > 0 && (
                      <span
                        className="min-w-[20px] rounded-full bg-brand px-1.5 text-center text-[11px] font-bold leading-5 text-on-brand tabular-nums"
                        aria-label={`${count} sin leer`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Conversation */}
        <section className={cn('flex min-w-0 flex-1 flex-col bg-desk', !selected && 'max-md:hidden')} aria-label="Conversación">
          {selected ? (
            <>
              <div className="flex h-14 shrink-0 items-center gap-3 border-b border-rule bg-paper px-4">
                <button
                  type="button"
                  onClick={() => choose(null)}
                  aria-label="Volver a la lista"
                  className="-ml-1 inline-flex h-8 w-8 items-center justify-center rounded-control text-ink-2 hover:bg-ink/[0.06] md:hidden"
                >
                  <ArrowLeft size={18} />
                </button>
                <Avatar name={selected.name} src={selected.avatar} size="md" />
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-ink">{selected.name}</h2>
                  <p className="truncate text-xs text-ink-3">{selected.email}</p>
                </div>
              </div>
              <div className="min-h-0 flex-1">
                <RealtimeChat
                  key={selected.id}
                  me={{ id: currentUser.id, name: currentUser.name }}
                  other={{ id: selected.id, name: selected.name }}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8">
              <EmptyState icon={MessagesSquare} title="Elige a alguien de la lista" className="max-w-sm">
                Los mensajes directos quedan entre tú y esa persona. Para hablar con todo el equipo usa un canal.
              </EmptyState>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
