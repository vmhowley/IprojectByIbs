import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MeetingRecorder } from '../components/meetings/MeetingRecorder';

export function NewMeeting() {
    const navigate = useNavigate();

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <button
                onClick={() => navigate('/meetings')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Volver a Reuniones
            </button>

            <div>
                <h1 className="text-2xl font-bold text-slate-100">Nueva Reunión</h1>
                <p className="text-slate-400">Graba o sube una reunión para que la IA genere un resumen</p>
            </div>

            <MeetingRecorder />
        </div>
    );
}
