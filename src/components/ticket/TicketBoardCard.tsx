import { Ticket, UserProfile } from '../../types';
import { UrgencyBadge } from '../ui/UrgencyBadge';

interface TicketBoardCardProps {
    ticket: Ticket;
    user?: UserProfile;
    onClick: () => void;
    isSelected: boolean;
}

export function TicketBoardCard({ ticket, user, onClick, isSelected }: TicketBoardCardProps) {

    return (
        <div
            onClick={onClick}
            className={`bg-white p-3 rounded-lg border shadow-sm cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all mb-3 group ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-md' : 'border-gray-200'}`}
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                    #{ticket.id.slice(0, 6)}
                </span>
                <UrgencyBadge urgency={ticket.urgency} />
            </div>

            <h4 className="text-sm font-medium text-gray-900 line-clamp-3 mb-3 leading-snug group-hover:text-indigo-600 transition-colors">
                {ticket.subject}sadasd
            </h4>

            <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-2">
                <div className="flex items-center gap-1.5" title={user?.name || 'Sin asignar'}>
                    {user ? (
                        <div className="w-5 h-5 bg-indigo-50 rounded-full flex items-center justify-center text-[10px] text-indigo-700 font-bold border border-indigo-100">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                    ) : (
                        <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px] text-gray-400">
                            ?
                        </div>
                    )}
                    <span className="text-xs text-gray-500 truncate max-w-[80px]">
                        {user?.name?.split(' ')[0] || 'Unassigned'}
                    </span>
                </div>

                {/* You could add more icons here like attachment count if available */}
            </div>
        </div>
    );
}
