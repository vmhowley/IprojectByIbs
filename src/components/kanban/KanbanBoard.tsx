import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Ticket } from '../../types';
import { Column } from './Column';

interface KanbanBoardProps {
  tickets: Ticket[];
  onTicketClick: (ticketId: string) => void;
  onStatusChange: (ticketId: string, newStatus: Ticket['status']) => void;
}

export function KanbanBoard({ tickets, onTicketClick, onStatusChange }: KanbanBoardProps) {
  const todoTickets = tickets.filter(t => t.status === 'pending_analysis');
  const inProgressTickets = tickets.filter(t => t.status === 'ongoing');
  const doneTickets = tickets.filter(t => t.status === 'completed');

  const handleDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result;

    if (!destination) return;

    const newStatus = destination.droppableId as Ticket['status'];
    onStatusChange(draggableId, newStatus);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-3 gap-4 h-full">
        <Column
          title="Pendiente"
          status="pending_analysis"
          tickets={todoTickets}
          onTicketClick={onTicketClick}
        />
        <Column
          title="En Desarrollo"
          status="ongoing"
          tickets={inProgressTickets}
          onTicketClick={onTicketClick}
        />
        <Column
          title="Completado"
          status="completed"
          tickets={doneTickets}
          onTicketClick={onTicketClick}
        />
      </div>
    </DragDropContext>
  );
}
