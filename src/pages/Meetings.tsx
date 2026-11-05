import { Mic, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import { TableView } from '../components/views/TableView';
import { meetingService } from '../services/meetingService';
import { Meeting } from '../types/meeting';
import { formatDate } from '../utils/format';
import { normalizeText } from '../utils/tickets';

/** The minutes book: every recorded meeting with its summary and follow-ups. */
export function Meetings() {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadMeetings();
    }, []);

    const filteredMeetings = useMemo(() => {
        const term = normalizeText(searchQuery.trim());
        if (!term) return meetings;
        return meetings.filter((m) => normalizeText(`${m.title} ${m.summary || ''}`).includes(term));
    }, [searchQuery, meetings]);

    const loadMeetings = async () => {
        try {
            const data = await meetingService.getAll();
            setMeetings(data);
        } catch (error) {
            console.error('Failed to load meetings', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-full flex-col">
            <PageHeader
                title="Reuniones"
                subtitle={
                    loading
                        ? 'Cargando reuniones…'
                        : `${meetings.length} ${meetings.length === 1 ? 'acta' : 'actas'}. Resumen, pendientes y transcripción escritos por IA a partir del audio.`
                }
                search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Buscar en títulos y resúmenes' }}
                actions={[{ label: 'Nueva reunión', icon: Plus, onClick: () => navigate('/meetings/new') }]}
            />

            <div className="px-4 py-5 sm:px-6">
                {!loading && meetings.length === 0 ? (
                    <EmptyState icon={Mic} title="Todavía no hay reuniones">
                        Graba la próxima reunión o sube su audio. La IA escribe el resumen y la lista de pendientes.
                    </EmptyState>
                ) : (
                    <TableView
                        caption="Reuniones registradas"
                        data={filteredMeetings}
                        isLoading={loading}
                        rowHref={(m) => `/meetings/${m.id}`}
                        defaultSort={{ index: 0, dir: 'desc' }}
                        emptyMessage="Ninguna reunión coincide con la búsqueda."
                        columns={[
                            {
                                header: 'Fecha',
                                sortValue: (m) => m.date,
                                className: 'w-28',
                                cell: (m) => (
                                    <span className="block tabular-nums">
                                        <span className="block text-[13px] text-ink">{formatDate(m.date)}</span>
                                        <span className="block text-xs text-ink-3">{formatDate(m.date, 'time')}</span>
                                    </span>
                                ),
                            },
                            {
                                header: 'Reunión',
                                sortValue: (m) => m.title.toLowerCase(),
                                cell: (m) => (
                                    <div className="min-w-0">
                                        <Link to={`/meetings/${m.id}`} className="line-clamp-1 font-medium text-ink hover:underline">
                                            {m.title}
                                        </Link>
                                        {m.summary && <p className="line-clamp-1 max-w-3xl text-[13px] text-ink-3">{m.summary}</p>}
                                    </div>
                                ),
                            },
                            {
                                header: 'Pendientes',
                                hideBelow: 'sm',
                                align: 'right',
                                sortValue: (m) => m.action_items?.length || 0,
                                cell: (m) => (
                                    <span className={m.action_items?.length ? 'text-[13px] text-ink' : 'text-[13px] text-ink-3'}>
                                        {m.action_items?.length || '—'}
                                    </span>
                                ),
                            },
                            {
                                header: 'Grabó',
                                hideBelow: 'lg',
                                className: 'w-48',
                                sortValue: (m) => m.user_profiles?.name?.toLowerCase(),
                                cell: (m) =>
                                    m.user_profiles?.name ? (
                                        <span className="flex items-center gap-2 text-[13px] text-ink-2">
                                            <Avatar name={m.user_profiles.name} size="xs" />
                                            <span className="line-clamp-1">{m.user_profiles.name}</span>
                                        </span>
                                    ) : (
                                        <span className="text-[13px] text-ink-3">—</span>
                                    ),
                            },
                        ]}
                    />
                )}
            </div>
        </div>
    );
}
