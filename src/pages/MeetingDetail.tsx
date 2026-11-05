import { ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { confirmDialog } from '../components/ui/ConfirmDialog';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../hooks/useAuth';
import { meetingService } from '../services/meetingService';
import { Meeting } from '../types/meeting';
import { formatDate } from '../utils/format';

/** The minutes of one meeting: summary, follow-ups, recording and transcript. */
export function MeetingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [meeting, setMeeting] = useState<Meeting | null>(null);
    const [loading, setLoading] = useState(true);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [audioMissing, setAudioMissing] = useState(false);
    const [renaming, setRenaming] = useState(false);
    const [titleDraft, setTitleDraft] = useState('');
    const [savingTitle, setSavingTitle] = useState(false);

    useEffect(() => {
        if (id) loadMeeting(id);
    }, [id]);

    const loadMeeting = async (meetingId: string) => {
        try {
            const data = await meetingService.getById(meetingId);
            setMeeting(data);

            if (data.audio_url) {
                // A lost recording must not hide the summary: the meeting opens without it.
                try {
                    setAudioUrl(await meetingService.getAudioUrl(data.audio_url));
                } catch (audioError) {
                    console.error('Failed to sign meeting audio', audioError);
                    setAudioMissing(true);
                }
            }
        } catch (error) {
            console.error('Failed to load meeting', error);
            toast.error('No se pudo abrir la reunión.');
            navigate('/meetings');
        } finally {
            setLoading(false);
        }
    };

    // Only whoever recorded it can rename or delete it; the database applies the same rule.
    const isOwner = !!meeting && meeting.user_id === user?.id;

    const handleRename = async (e: FormEvent) => {
        e.preventDefault();
        if (!meeting || !titleDraft.trim()) return;
        setSavingTitle(true);
        try {
            const updated = await meetingService.update(meeting.id, { title: titleDraft.trim() });
            setMeeting((prev) => (prev ? { ...prev, title: updated.title } : prev));
            setRenaming(false);
            toast.success('Título actualizado');
        } catch (error) {
            console.error('Failed to rename meeting', error);
            toast.error('No se pudo cambiar el título.');
        } finally {
            setSavingTitle(false);
        }
    };

    const handleDelete = async () => {
        if (!meeting) return;
        const ok = await confirmDialog({
            title: 'Eliminar reunión',
            message: `Se eliminará «${meeting.title}» con su resumen, pendientes y transcripción.`,
            confirmText: 'Eliminar reunión',
            tone: 'danger',
        });
        if (!ok) return;
        try {
            await meetingService.delete(meeting.id);
            toast.success('Reunión eliminada');
            navigate('/meetings');
        } catch (error) {
            console.error('Failed to delete meeting', error);
            toast.error('No se pudo eliminar la reunión.');
        }
    };

    if (loading) {
        return (
            <div className="space-y-5 px-4 py-5 sm:px-6" role="status" aria-label="Cargando">
                <Skeleton className="h-7 w-80 max-w-full" />
                <Skeleton className="h-4 w-56" />
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-48" />
                </div>
            </div>
        );
    }

    if (!meeting) return null;

    const items = meeting.action_items || [];

    return (
        <div className="flex min-h-full flex-col">
            <PageHeader
                back={{ to: '/meetings', label: 'Reuniones' }}
                title={meeting.title}
                subtitle={
                    <>
                        <span className="tabular-nums">{formatDate(meeting.date, 'long')}, {formatDate(meeting.date, 'time')}</span>
                        {meeting.user_profiles?.name && <> · Grabó {meeting.user_profiles.name}</>}
                    </>
                }
            >
                {isOwner && (
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setTitleDraft(meeting.title);
                                setRenaming(true);
                            }}
                        >
                            <Pencil size={15} aria-hidden="true" />
                            Cambiar título
                        </Button>
                        <Button variant="danger" size="icon" onClick={handleDelete} aria-label="Eliminar reunión" title="Eliminar reunión">
                            <Trash2 size={16} />
                        </Button>
                    </>
                )}
            </PageHeader>

            <div className="grid grid-cols-1 items-start gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="min-w-0 space-y-5">
                    <section className="sheet" aria-labelledby="meeting-summary">
                        <h2 id="meeting-summary" className="border-b border-rule px-5 py-3 text-[15px] font-semibold text-ink">
                            Resumen
                        </h2>
                        <p className="max-w-[72ch] whitespace-pre-wrap px-5 py-4 text-[15px] leading-relaxed text-ink-2">
                            {meeting.summary || 'No hay resumen para esta reunión.'}
                        </p>
                    </section>

                    {meeting.transcription && (
                        <details className="sheet group">
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 hover:bg-ink/[0.02] [&::-webkit-details-marker]:hidden">
                                <span className="text-[15px] font-semibold text-ink">Transcripción</span>
                                <span className="flex items-center gap-1 text-[13px] text-ink-3">
                                    <span className="group-open:hidden">Mostrar</span>
                                    <span className="hidden group-open:inline">Ocultar</span>
                                    <ChevronRight size={15} aria-hidden="true" className="transition-transform group-open:rotate-90" />
                                </span>
                            </summary>
                            <div className="max-h-[32rem] overflow-y-auto border-t border-rule px-5 py-4">
                                <p className="max-w-[72ch] whitespace-pre-wrap text-sm leading-7 text-ink-2">{meeting.transcription}</p>
                            </div>
                        </details>
                    )}
                </div>

                <aside className="space-y-5">
                    <section className="sheet" aria-labelledby="meeting-items">
                        <h2 id="meeting-items" className="border-b border-rule px-5 py-3 text-[15px] font-semibold text-ink">
                            Pendientes <span className="font-normal tabular-nums text-ink-3">{items.length}</span>
                        </h2>
                        {items.length > 0 ? (
                            <ol className="divide-y divide-rule">
                                {items.map((item, index) => (
                                    <li key={index} className="flex gap-3 px-5 py-2.5 text-sm leading-snug text-ink">
                                        <span className="w-5 shrink-0 text-right text-xs font-semibold tabular-nums text-ink-3">{index + 1}.</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="px-5 py-4 text-sm text-ink-3">La IA no encontró pendientes en esta reunión.</p>
                        )}
                    </section>

                    {(audioUrl || audioMissing) && (
                        <section className="sheet" aria-labelledby="meeting-audio">
                            <h2 id="meeting-audio" className="border-b border-rule px-5 py-3 text-[15px] font-semibold text-ink">
                                Grabación
                            </h2>
                            <div className="px-5 py-4">
                                {audioUrl ? (
                                    <>
                                        <audio controls className="h-10 w-full" src={audioUrl}>
                                            Tu navegador no puede reproducir este audio.
                                        </audio>
                                        <p className="mt-2 text-xs text-ink-3">El enlace de la grabación vence en una hora. Recarga la página para renovarlo.</p>
                                    </>
                                ) : (
                                    <p className="text-sm text-ink-3">No se encontró el archivo de audio. El resumen y la transcripción siguen disponibles.</p>
                                )}
                            </div>
                        </section>
                    )}
                </aside>
            </div>

            {renaming && (
                <Modal
                    isOpen
                    onClose={() => setRenaming(false)}
                    dismissible={!savingTitle}
                    size="sm"
                    title="Cambiar título"
                    footer={
                        <>
                            <Button type="button" variant="secondary" onClick={() => setRenaming(false)} disabled={savingTitle}>
                                Cancelar
                            </Button>
                            <Button type="submit" form="meeting-title-form" isLoading={savingTitle} disabled={!titleDraft.trim()}>
                                Guardar
                            </Button>
                        </>
                    }
                >
                    <form id="meeting-title-form" onSubmit={handleRename}>
                        <Input label="Título" value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)} autoFocus required />
                    </form>
                </Modal>
            )}
        </div>
    );
}
