import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Calendar, CheckSquare, ChevronRight, Clock, FileText, Play } from 'lucide-react';
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

            if (data.audio_url) {
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

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-slate-500 font-medium animate-pulse">Analizando detalles de la reunión...</p>
            </div>
        </div>
    );

    if (!meeting) return null;

    return (
        <div className="min-h-screen bg-slate-50/50 pb-12">
            <div className="max-w-5xl mx-auto px-6 pt-8 space-y-8">
                <button
                    onClick={() => navigate('/meetings')}
                    className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-all font-medium"
                >
                    <div className="p-2 bg-white rounded-lg border border-slate-200 group-hover:border-slate-300 shadow-sm transition-all">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    <span>Volver a Reuniones</span>
                </button>

                <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-10 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10 pb-8 border-b border-slate-100">
                        <div className="space-y-3">
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                                {meeting.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-slate-500">
                                <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                    {format(new Date(meeting.date), "PPP", { locale: es })}
                                </div>
                                <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                                    {format(new Date(meeting.date), "HH:mm", { locale: es })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {audioUrl && (
                        <div className="bg-slate-50 rounded-2xl p-6 mb-10 border border-slate-100">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    <Play className="w-3 h-3 fill-current" />
                                    Grabación Original
                                </div>
                                <audio controls className="w-full h-10 accent-emerald-500" src={audioUrl}>
                                    Tu navegador no soporta el elemento de audio.
                                </audio>
                            </div>
                        </div>
                    )}

                    <div className="grid lg:grid-cols-5 gap-10">
                        <div className="lg:col-span-3 space-y-6">
                            <div className="flex items-center gap-3 text-emerald-600 font-bold text-xl">
                                <div className="p-2 bg-emerald-50 rounded-xl">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <h2>Resumen Ejecutivo</h2>
                            </div>
                            <div className="bg-slate-50/50 p-8 rounded-2xl border border-slate-100 leading-relaxed text-slate-700 font-medium text-lg whitespace-pre-wrap">
                                {meeting.summary || 'No hay resumen disponible.'}
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center gap-3 text-blue-600 font-bold text-xl">
                                <div className="p-2 bg-blue-50 rounded-xl">
                                    <CheckSquare className="w-6 h-6" />
                                </div>
                                <h2>Action Items</h2>
                            </div>
                            {meeting.action_items && meeting.action_items.length > 0 ? (
                                <ul className="space-y-4">
                                    {meeting.action_items.map((item, index) => (
                                        <li key={index} className="flex items-start gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:border-blue-300 transition-colors group">
                                            <div className="mt-1 min-w-6 h-6 rounded-lg border-2 border-slate-200 group-hover:border-blue-500 group-hover:bg-blue-50 transition-all flex items-center justify-center">
                                                <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <span className="text-slate-700 font-medium leading-tight">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-slate-400 italic p-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center">
                                    No se detectaron tareas pendientes.
                                </div>
                            )}
                        </div>
                    </div>

                    {meeting.transcription && (
                        <div className="mt-12 pt-10 border-t border-slate-100">
                            <details className="group">
                                <summary className="flex items-center justify-between cursor-pointer list-none bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg border border-slate-200">
                                            <FileText className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <span className="font-bold text-slate-600 uppercase tracking-wider text-xs">Transcripción Completa</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-400 group-open:rotate-90 transition-transform" />
                                </summary>
                                <div className="mt-4 p-8 bg-white border border-slate-200 rounded-2xl text-slate-600 text-sm leading-loose whitespace-pre-wrap max-h-[500px] overflow-y-auto shadow-inner">
                                    {meeting.transcription}
                                </div>
                            </details>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
