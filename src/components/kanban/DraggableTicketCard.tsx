import { Draggable } from '@hello-pangea/dnd';
import { Ticket, UserProfile } from '../../types';
import { TicketBoardCard } from '../ticket/TicketBoardCard';

interface DraggableTicketCardProps {
  ticket: Ticket;
  index: number;
  onClick: () => void;
  user?: UserProfile;
  number?: string;
  isSelected?: boolean;
  isDragDisabled?: boolean;
}

export function DraggableTicketCard({ ticket, index, onClick, user, number, isSelected = false, isDragDisabled = false }: DraggableTicketCardProps) {
  return (
    <Draggable draggableId={ticket.id} index={index} isDragDisabled={isDragDisabled}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          aria-roledescription="Ticket que se puede arrastrar"
        >
          <TicketBoardCard
            ticket={ticket}
            user={user}
            number={number}
            onClick={onClick}
            isSelected={isSelected}
            isDragging={snapshot.isDragging}
          />
        </div>
      )}
    </Draggable>
  );
}
