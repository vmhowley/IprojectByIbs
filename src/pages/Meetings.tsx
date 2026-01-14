import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, ChevronRight, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { meetingService } from '../services/meetingService';
import { Meeting } from '../types/meeting';

export function Meetings() {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadMeetings();
    }, []);

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
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Reuniones</h1>
                    <p className="text-slate-400">Gestiona y revisa tus reuniones grabadas</p>
                </div>
                <button
                    onClick={() => navigate('/meetings/new')}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Nueva Reunión
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-400">Cargando reuniones...</div>
            ) : meetings.length === 0 ? (
                <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
                    <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-300">No hay reuniones registradas</h3>
                    <p className="text-slate-500 mt-1">Graba tu primera reunión para verla aquí</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {meetings.map((meeting) => (
                        <div
                            key={meeting.id}
                            onClick={() => navigate(`/meetings/${meeting.id}`)}
                            className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl p-4 cursor-pointer transition-all hover:border-emerald-500/50 group"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-medium text-slate-200 group-hover:text-emerald-400 transition-colors">
                                        {meeting.title}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                                        <Calendar className="w-4 h-4" />
                                        {format(new Date(meeting.date), "d 'de' MMMM, yyyy - HH:mm", { locale: es })}
                                    </div>
                                    {meeting.summary && (
                                        <p className="mt-3 text-slate-400 line-clamp-2 text-sm">
                                            {meeting.summary}
                                        </p>
                                    )}
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-500 transition-colors" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
