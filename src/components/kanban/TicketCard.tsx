import { Ticket } from '../../types';
import { MessageSquare } from 'lucide-react';

interface TicketCardProps {
  ticket: Ticket;
  onClick?: () => void;
}

export function TicketCard({ ticket, onClick }: TicketCardProps) {
  const priorityColors = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700'
  };

  const priorityColor = priorityColors[ticket.urgency] || priorityColors.medium;

  return (
    <div
      onClick={onClick}
      className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-medium text-sm text-gray-900 flex-1">{ticket.title}</h3>
        <span className={`px-2 py-0.5 text-xs font-medium rounded ${priorityColor}`}>
          {ticket.urgency}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="font-mono">{ticket.ticket_number}</span>
        {ticket.comment_count > 0 && (
          <div className="flex items-center gap-1">
            <MessageSquare size={14} />
            <span>{ticket.comment_count}</span>
          </div>
        )}
      </div>

      {ticket.tags && ticket.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {ticket.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
            >
              {tag}
            </span>
          ))}
          {ticket.tags.length > 3 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
              +{ticket.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
