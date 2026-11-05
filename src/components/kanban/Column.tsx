import { Droppable } from '@hello-pangea/dnd';
import { cn } from '../../lib/utils';
import { Ticket, UserProfile } from '../../types';
import { DraggableTicketCard } from './DraggableTicketCard';

interface ColumnProps {
  title: string;
  status: Ticket['status'];
  tickets: Ticket[];
  onTicketClick: (ticketId: string) => void;
  /** Ink of the column head, matching the stamps. */
  inkClass?: string;
  usersById?: Map<string, UserProfile>;
  numbers?: Map<string, string>;
  selectedId?: string | null;
  readOnly?: boolean;
}

/** One tray of the board. Dropping a ticket here gives it this status. */
export function Column({ title, status, tickets, onTicketClick, inkClass, usersById, numbers, selectedId, readOnly }: ColumnProps) {
  return (
    <section className="flex w-72 shrink-0 flex-col" aria-label={`${title}: ${tickets.length}`}>
      <h3 className="mb-2 flex items-center justify-between px-1 text-[13px] font-semibold text-ink">
        <span className={cn('flex items-center gap-2', inkClass)}>
          <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
          <span className="text-ink">{title}</span>
        </span>
        <span className="text-xs font-medium tabular-nums text-ink-3">{tickets.length}</span>
      </h3>

      <Droppable droppableId={status} isDropDisabled={readOnly}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'min-h-[200px] flex-1 space-y-2 overflow-y-auto rounded-sheet border p-2 transition-colors',
              snapshot.isDraggingOver ? 'border-ink/40 bg-well' : 'border-rule bg-shelf/60'
            )}
          >
            {tickets.map((ticket, index) => (
              <DraggableTicketCard
                key={ticket.id}
                ticket={ticket}
                index={index}
                user={ticket.assigned_to ? usersById?.get(ticket.assigned_to) : undefined}
                number={numbers?.get(ticket.id)}
                isSelected={selectedId === ticket.id}
                isDragDisabled={readOnly}
                onClick={() => onTicketClick(ticket.id)}
              />
            ))}
            {provided.placeholder}
            {tickets.length === 0 && !snapshot.isDraggingOver && (
              <p className="flex h-16 items-center justify-center rounded-control border border-dashed border-rule-strong/40 text-xs text-ink-3">
                {readOnly ? 'Vacío' : 'Arrastra un ticket aquí'}
              </p>
            )}
          </div>
        )}
      </Droppable>
    </section>
  );
}
