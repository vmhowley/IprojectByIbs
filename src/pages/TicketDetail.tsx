import { useNavigate, useParams } from 'react-router-dom';
import { TicketDetailView } from '../components/ticket/TicketDetailView';

/** A ticket on its own page: the work order on a full sheet. */
export function TicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();

  if (!ticketId) {
    return null;
  }

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/tasks'));

  return (
    <div className="px-0 py-0 sm:px-6 sm:py-5">
      <div className="sheet mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-6xl flex-col overflow-hidden border-t-2 border-t-brand max-sm:rounded-none max-sm:border-x-0 sm:min-h-[calc(100dvh-6rem)]">
        <TicketDetailView
          ticketId={ticketId}
          variant="page"
          onClose={goBack}
          onDelete={goBack}
        />
      </div>
    </div>
  );
}
