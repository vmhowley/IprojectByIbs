import { Draggable } from '@hello-pangea/dnd';
import { Ticket } from '../../types';
import { TicketCard } from './TicketCard';

interface DraggableTicketCardProps {
  ticket: Ticket;
  index: number;
  onClick: () => void;
}

export function DraggableTicketCard({ ticket, index, onClick }: DraggableTicketCardProps) {
  return (
    <Draggable draggableId={ticket.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={snapshot.isDragging ? 'opacity-50' : ''}
        >
          <TicketCard ticket={ticket} onClick={onClick} />
        </div>
      )}
    </Draggable>
  );
}
