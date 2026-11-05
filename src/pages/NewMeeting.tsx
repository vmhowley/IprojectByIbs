import { PageHeader } from '../components/layout/PageHeader';
import { MeetingRecorder } from '../components/meetings/MeetingRecorder';

export function NewMeeting() {
    return (
        <div className="flex min-h-full flex-col">
            <PageHeader
                back={{ to: '/meetings', label: 'Reuniones' }}
                title="Nueva reunión"
                subtitle="Graba la reunión o sube su audio. La IA escribe el resumen, los pendientes y la transcripción."
            />
            <div className="px-4 py-5 sm:px-6">
                <MeetingRecorder />
            </div>
        </div>
    );
}
