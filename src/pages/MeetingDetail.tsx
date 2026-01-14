import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Calendar, CheckSquare, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { meetingService } from '../services/meetingService';
import { Meeting } from '../types/meeting';

export function MeetingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [meeting, setMeeting] = useState<Meeting | null>(null);
    const [loading, setLoading] = useState(true);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    useEffect(() => {
        if (id) loadMeeting(id);
    }, [id]);

    const loadMeeting = async (meetingId: string) => {
        try {
            const data = await meetingService.getById(meetingId);
            setMeeting(data);

            // Get signed URL for audio if exists
            if (data.audio_url) {
                // Assume audio_url stored is the path
                const signedUrl = await meetingService.getAudioUrl(data.audio_url);
                setAudioUrl(signedUrl);
            }
        } catch (error) {
            console.error('Failed to load meeting', error);
            toast.error('Error al cargar la reunión');
            navigate('/meetings');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center py-12 text-slate-400">Cargando detalles...</div>;
    if (!meeting) return null;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8">
            <button
                onClick={() => navigate('/meetings')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Volver a Reuniones
            </button>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-100 mb-2">{meeting.title}</h1>
                        <div className="flex items-center gap-2 text-slate-400">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(meeting.date), "PPP 'a las' p", { locale: es })}
                        </div>
                    </div>
                </div>

                {audioUrl && (
                    <div className="bg-slate-900/50 rounded-lg p-4 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-slate-400 font-medium uppercase tracking-wider mb-2 hidden">Grabación de Audio</div>
                            <audio controls className="w-full h-8" src={audioUrl}>
                                Tu navegador no soporta el elemento de audio.
                            </audio>
                        </div>
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-emerald-400 font-medium text-lg">
                            <FileText className="w-5 h-5" />
                            <h2>Resumen Ejecutivo</h2>
                        </div>
                        <div className="prose prose-invert max-w-none text-slate-300 bg-slate-900/30 p-6 rounded-xl leading-relaxed whitespace-pre-wrap">
                            {meeting.summary || 'No hay resumen disponible.'}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-blue-400 font-medium text-lg">
                            <CheckSquare className="w-5 h-5" />
                            <h2>Action Items</h2>
                        </div>
                        {meeting.action_items && meeting.action_items.length > 0 ? (
                            <ul className="space-y-3">
                                {meeting.action_items.map((item, index) => (
                                    <li key={index} className="flex items-start gap-3 bg-slate-900/30 p-4 rounded-xl border border-slate-800/50">
                                        <div className="mt-1 min-w-5 h-5 rounded border-2 border-slate-600"></div>
                                        <span className="text-slate-300">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-slate-500 italic p-4 bg-slate-900/30 rounded-xl">No se detectaron tareas pendientes.</div>
                        )}
                    </div>
                </div>

                {meeting.transcription && (
                    <div className="mt-8 pt-8 border-t border-slate-700">
                        <details className="group">
                            <summary className="flex items-center cursor-pointer text-slate-500 hover:text-slate-300">
                                <span className="font-medium mr-2">Ver Transcripción Completa</span>
                            </summary>
                            <div className="mt-4 p-6 bg-slate-900/30 rounded-xl text-slate-400 text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                                {meeting.transcription}
                            </div>
                        </details>
                    </div>
                )}
            </div>
        </div>
    );
}
