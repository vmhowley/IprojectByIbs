import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Ticket, UserProfile } from '../../types';
import { Column } from './Column';

interface KanbanBoardProps {
  tickets: Ticket[];
  onTicketClick: (ticketId: string) => void;
  onStatusChange: (ticketId: string, newStatus: Ticket['status']) => void;
  users?: UserProfile[];
  numbers?: Map<string, string>;
  selectedId?: string | null;
  /** People linked to a client see the board but cannot move tickets. */
  readOnly?: boolean;
}

// One tray per step of the route; "done" tickets sit with the completed ones.
const TRAYS: { status: Ticket['status']; title: string; inkClass: string }[] = [
  { status: 'pending_analysis', title: 'Análisis', inkClass: 'text-st-graphite' },
  { status: 'pending_approval', title: 'Aprobación del cliente', inkClass: 'text-st-ochre' },
  { status: 'approved', title: 'Aprobado', inkClass: 'text-st-blue' },
  { status: 'ongoing', title: 'En desarrollo', inkClass: 'text-st-violet' },
  { status: 'completed', title: 'Completado', inkClass: 'text-st-green' },
];

/** The project's trays. Drag a ticket (or lift it with Space and move it with the arrows) to change its status. */
export function KanbanBoard({ tickets, onTicketClick, onStatusChange, users = [], numbers, selectedId, readOnly = false }: KanbanBoardProps) {
  const usersById = new Map(users.map((u) => [u.id, u]));

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination || destination.droppableId === source.droppableId) return;

    const newStatus = destination.droppableId as Ticket['status'];
    onStatusChange(draggableId, newStatus);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex h-full gap-3 overflow-x-auto pb-4">
        {TRAYS.map((tray) => (
          <Column
            key={tray.status}
            title={tray.title}
            status={tray.status}
            inkClass={tray.inkClass}
            tickets={tickets.filter((t) => t.status === tray.status || (tray.status === 'completed' && t.status === 'done'))}
            onTicketClick={onTicketClick}
            usersById={usersById}
            numbers={numbers}
            selectedId={selectedId}
            readOnly={readOnly}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
