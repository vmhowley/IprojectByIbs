import { MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Ticket, UserProfile } from '../../types';
import { isOverdue, relativeDay } from '../../utils/format';
import { ticketTitle } from '../../utils/tickets';
import { Avatar } from '../ui/Avatar';
import { requestTypeLabel } from '../ui/RequestTypeBadge';
import { UrgencyBadge } from '../ui/UrgencyBadge';

interface TicketBoardCardProps {
    ticket: Ticket;
    user?: UserProfile;
    onClick: () => void;
    isSelected: boolean;
    /** "12/37": position of the ticket in its project. */
    number?: string;
    isDragging?: boolean;
}

/** A ticket slip in a tray: number, priority, subject, who has it and when it is due. */
export function TicketBoardCard({ ticket, user, onClick, isSelected, number, isDragging = false }: TicketBoardCardProps) {
    const late = isOverdue(ticket.deadline, ticket.status);
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    onClick();
                }
            }}
            aria-pressed={isSelected}
            className={cn(
                'sheet block cursor-pointer p-3 text-left transition-[box-shadow,border-color]',
                isSelected ? 'border-focus ring-1 ring-focus' : 'hover:border-rule-strong/60 hover:shadow-lift',
                isDragging && 'rotate-[0.6deg] shadow-lift'
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-semibold text-ink-3">{number || ''}</span>
                <UrgencyBadge urgency={ticket.urgency} compact />
            </div>

            <h4 className="mt-1.5 line-clamp-3 text-sm font-medium leading-snug text-ink">
                {ticketTitle(ticket)}
            </h4>
            {ticket.request_type && (
                <p className="mt-1 truncate text-xs text-ink-3">{requestTypeLabel(ticket.request_type)}</p>
            )}

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-rule pt-2 text-[11px]">
                <span className="flex min-w-0 items-center gap-1.5" title={user?.name || 'Sin asignar'}>
                    {user ? <Avatar name={user.name} src={user.avatar} size="xs" /> : null}
                    <span className="truncate text-ink-2">{user?.name?.split(' ')[0] || 'Sin asignar'}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                    {ticket.comment_count > 0 && (
                        <span className="flex items-center gap-0.5 text-ink-3" aria-label={`${ticket.comment_count} comentarios`}>
                            <MessageSquare size={11} aria-hidden="true" />
                            {ticket.comment_count}
                        </span>
                    )}
                    {ticket.deadline && (
                        <span className={cn('tabular-nums', late ? 'font-semibold text-st-red' : 'text-ink-3')}>
                            {late ? `venció ${relativeDay(ticket.deadline)}` : relativeDay(ticket.deadline)}
                        </span>
                    )}
                </span>
            </div>
        </div>
    );
}
