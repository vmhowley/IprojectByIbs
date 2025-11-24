import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Ticket } from '../../types';
import { Column } from './Column';

interface KanbanBoardProps {
  tickets: Ticket[];
  onTicketClick: (ticketId: string) => void;
  onStatusChange: (ticketId: string, newStatus: Ticket['status']) => void;
}

export function KanbanBoard({ tickets, onTicketClick, onStatusChange }: KanbanBoardProps) {
  const todoTickets = tickets.filter(t => t.status === 'todo');
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress');
  const doneTickets = tickets.filter(t => t.status === 'done');

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
          title="To Do"
          status="todo"
          tickets={todoTickets}
          onTicketClick={onTicketClick}
        />
        <Column
          title="In Progress"
          status="in_progress"
          tickets={inProgressTickets}
          onTicketClick={onTicketClick}
        />
        <Column
          title="Done"
          status="done"
          tickets={doneTickets}
          onTicketClick={onTicketClick}
        />
      </div>
    </DragDropContext>
  );
}
