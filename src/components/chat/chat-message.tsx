import type { ChatMessage } from '@/hooks/use-realtime-chat'
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/format'

interface ChatMessageItemProps {
    message: ChatMessage
    isOwnMessage: boolean
    showHeader: boolean
}

/** One note in the conversation. Own notes sit on the right, on a darker slip. */
export const ChatMessageItem = ({ message, isOwnMessage, showHeader }: ChatMessageItemProps) => {
    return (
        <div className={cn('flex', showHeader ? 'mt-3' : 'mt-1', isOwnMessage ? 'justify-end' : 'justify-start')}>
            <div className={cn('flex w-fit max-w-[78%] flex-col gap-1', isOwnMessage && 'items-end')}>
                {showHeader && (
                    <div className={cn('flex items-baseline gap-2 px-1 text-xs', isOwnMessage && 'flex-row-reverse')}>
                        <span className="font-semibold text-ink">{isOwnMessage ? 'Tú' : message.user.name}</span>
                        <time dateTime={message.createdAt} className="text-ink-3">
                            {formatDate(message.createdAt, 'datetime')}
                        </time>
                    </div>
                )}
                <div
                    className={cn(
                        'w-fit whitespace-pre-wrap break-words rounded-sheet border px-3 py-2 text-sm leading-relaxed',
                        isOwnMessage ? 'border-rule-strong/40 bg-shelf text-ink' : 'border-rule bg-paper text-ink',
                        message.pending && 'opacity-60'
                    )}
                >
                    {message.content}
                </div>
            </div>
        </div>
    )
}
