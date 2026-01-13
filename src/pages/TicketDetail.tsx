import { useNavigate, useParams } from 'react-router-dom';
import { TicketDetailView } from '../components/ticket/TicketDetailView';

export function TicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();

  if (!ticketId) {
    return null;
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col pt-4">
      <div className="flex-1 max-w-5xl mx-auto w-full bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200 my-4 h-[calc(100vh-2rem)]">
        <TicketDetailView
          ticketId={ticketId}
          onClose={() => navigate(-1)}
          onDelete={() => navigate(-1)}
        />
      </div>
    </div>
  );
}
