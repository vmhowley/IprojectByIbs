import { Send, X } from 'lucide-react';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { useChatScroll } from '../../hooks/use-chat-scroll';
import { useSupportChat } from '../../hooks/use-support-chat';
import { ChatMessageItem } from '../chat/chat-message';
import { Button } from '../ui/Button';

/** Live support: a slip in the corner with the conversation with the team. The side menu and Ayuda open it. */
export function SupportChatWidget() {
    const { user } = useAuthContext();
    const {
        messages,
        sendMessage,
        initChat,
        isOpen,
        setIsOpen,
        isLoading
    } = useSupportChat({ userId: user?.id });

    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const { containerRef, scrollToBottom } = useChatScroll();
    const hasInitialized = useRef(false);
    const composerRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen && user && !hasInitialized.current) {
            initChat();
            hasInitialized.current = true;
        }
    }, [isOpen, user, initChat]);

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen, scrollToBottom]);

    // The side menu and Ayuda open the chat with a window event.
    useEffect(() => {
        const open = () => setIsOpen(true);
        window.addEventListener('open-support-chat', open);
        return () => window.removeEventListener('open-support-chat', open);
    }, [setIsOpen]);

    // Opening puts the cursor in the composer; Escape closes and gives focus back to the opener.
    useEffect(() => {
        if (!isOpen) return;
        const opener = document.activeElement as HTMLElement | null;
        requestAnimationFrame(() => composerRef.current?.focus());
        const onKeyDown = (event: globalThis.KeyboardEvent) => {
            if (event.key === 'Escape' && !document.querySelector('[role="dialog"][aria-modal="true"]')) setIsOpen(false);
        };
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            if (opener?.isConnected) opener.focus();
        };
    }, [isOpen, setIsOpen]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const text = newMessage.trim();
        if (!text || sending) return;

        setSending(true);
        setNewMessage('');
        try {
            await sendMessage(text);
        } catch {
            // Already handled in hook
            setNewMessage(text);
        } finally {
            setSending(false);
        }
    };

    // Enter sends, Shift+Enter adds a line.
    const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    if (!user || !isOpen) return null;

    return (
        <section
            id="support-chat"
            aria-label="Soporte en vivo"
            className="fixed bottom-4 right-4 z-40 flex h-[30rem] max-h-[calc(100dvh-6rem)] w-[22rem] max-w-[calc(100vw-2rem)] animate-sheet-in flex-col overflow-hidden rounded-sheet border border-rule bg-paper shadow-lift"
        >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-rule px-4 py-3">
                <div>
                    <h2 className="text-[15px] font-semibold text-ink">Soporte en vivo</h2>
                    <p className="text-xs text-ink-3">Escribe tu duda; te responde el equipo de soporte.</p>
                </div>
                <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label="Cerrar soporte"
                    className="-mr-1 inline-flex h-8 w-8 items-center justify-center rounded-control text-ink-3 hover:bg-ink/[0.06] hover:text-ink"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Messages Body */}
            <div className="min-h-0 flex-1 overflow-y-auto bg-desk px-3 py-2" ref={containerRef} aria-live="polite">
                {isLoading ? (
                    <p className="py-10 text-center text-sm text-ink-3">Cargando…</p>
                ) : messages.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                        <p className="text-sm font-medium text-ink">¿En qué te ayudamos?</p>
                        <p className="mt-1 text-xs text-ink-3">Escribe tu mensaje abajo.</p>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <ChatMessageItem
                            key={msg.id}
                            message={{
                                id: msg.id,
                                content: msg.content,
                                user: { name: 'Soporte' },
                                createdAt: msg.created_at,
                                userId: msg.sender_id,
                            }}
                            isOwnMessage={msg.sender_id === user.id}
                            showHeader={index === 0 || messages[index - 1].sender_id !== msg.sender_id}
                        />
                    ))
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-rule bg-well p-3">
                <label htmlFor="support-composer" className="sr-only">Mensaje para soporte</label>
                <textarea
                    id="support-composer"
                    ref={composerRef}
                    rows={1}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Escribe un mensaje…"
                    className="field max-h-32 min-h-9 resize-none py-2"
                />
                <Button type="submit" size="icon" aria-label="Enviar mensaje" disabled={!newMessage.trim()} isLoading={sending}>
                    {!sending && <Send size={16} />}
                </Button>
            </form>
        </section>
    );
}
