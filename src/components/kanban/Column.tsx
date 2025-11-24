import { Droppable } from '@hello-pangea/dnd';
import { Ticket } from '../../types';
import { DraggableTicketCard } from './DraggableTicketCard';

interface ColumnProps {
  title: string;
  status: Ticket['status'];
  tickets: Ticket[];
  onTicketClick: (ticketId: string) => void;
}

export function Column({ title, status, tickets, onTicketClick }: ColumnProps) {
  const statusColors = {
    todo: 'border-gray-300',
    in_progress: 'border-blue-400',
    done: 'border-green-400'
  };

  return (
    <div className="flex flex-col h-full">
      <div className={`px-4 py-3 bg-gray-50 border-b-2 ${statusColors[status]} rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm text-gray-700">{title}</h2>
          <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded">
            {tickets.length}
          </span>
        </div>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-3 space-y-3 min-h-[200px] overflow-y-auto ${
              snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-50'
            } rounded-b-lg transition-colors`}
          >
            {tickets.map((ticket, index) => (
              <DraggableTicketCard
                key={ticket.id}
                ticket={ticket}
                index={index}
                onClick={() => onTicketClick(ticket.id)}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
