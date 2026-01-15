import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, ChevronRight, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { meetingService } from '../services/meetingService';
import { Meeting } from '../types/meeting';

export function Meetings() {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadMeetings();
    }, []);

    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = meetings.filter(m =>
                m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.summary?.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredMeetings(filtered);
        } else {
            setFilteredMeetings(meetings);
        }
    }, [searchQuery, meetings]);

    const loadMeetings = async () => {
        try {
            const data = await meetingService.getAll();
            setMeetings(data);
            setFilteredMeetings(data);
        } catch (error) {
            console.error('Failed to load meetings', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Reuniones</h1>
                    <p className="text-slate-500 mt-1">Gestiona y revisa tus reuniones analizadas por IA</p>
                </div>
                <button
                    onClick={() => navigate('/meetings/new')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm hover:shadow-emerald-600/20 active:scale-95 font-medium"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Reunión
                </button>
            </div>

            <div className="relative group max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar reuniones..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm"
                />
            </div>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-2xl border border-slate-200" />
                    ))}
                </div>
            ) : filteredMeetings.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900">No se encontraron reuniones</h3>
                    <p className="text-slate-500 mt-2 max-w-xs mx-auto">
                        {searchQuery ? 'Prueba con otra búsqueda o limpia los filtros' : 'Graba tu primera reunión para que la IA la procese aquí'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredMeetings.map((meeting) => (
                        <div
                            key={meeting.id}
                            onClick={() => navigate(`/meetings/${meeting.id}`)}
                            className="bg-white border border-slate-200 rounded-2xl p-5 cursor-pointer transition-all hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 group flex flex-col h-full"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1 mb-1">
                                {meeting.title}
                            </h3>

                            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-4">
                                <span>{format(new Date(meeting.date), "d 'de' MMM, yyyy", { locale: es })}</span>
                                <span>•</span>
                                <span>{format(new Date(meeting.date), "HH:mm", { locale: es })}</span>
                            </div>

                            {meeting.summary && (
                                <p className="text-slate-500 line-clamp-3 text-sm grow mb-4 leading-relaxed">
                                    {meeting.summary}
                                </p>
                            )}

                            <div className="flex items-center gap-3 pt-4 border-t border-slate-50 mt-auto">
                                <div className="flex -space-x-2">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">AI</div>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Analizada por Gemini</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
