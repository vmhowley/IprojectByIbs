
import { MessageCircle, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { useSupportChat } from '../../hooks/use-support-chat';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

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
    const scrollRef = useRef<HTMLDivElement>(null);
    const hasInitialized = useRef(false);

    useEffect(() => {
        if (isOpen && user && !hasInitialized.current) {
            initChat();
            hasInitialized.current = true;
        }
    }, [isOpen, user, initChat]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await sendMessage(newMessage);
            setNewMessage('');
        } catch (error) {
            // Already handled in hook
        }
    };

    if (!user) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
            {isOpen && (
                <div className="w-[350px] max-w-[calc(100vw-3rem)] h-[450px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto">
                    {/* Header */}
                    <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
                        <div>
                            <h3 className="font-semibold">Soporte en vivo</h3>
                            <p className="text-xs text-slate-400">Solemos responder en minutos</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 text-white hover:bg-slate-800 p-0 rounded-full"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-4 bg-slate-50 relative" ref={scrollRef}>
                        {isLoading ? (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
                                <div className="animate-pulse">Cargando...</div>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-sm p-6 text-center">
                                <MessageCircle className="h-12 w-12 opacity-10 mb-2" />
                                <p className="font-medium">¿En qué podemos ayudarte?</p>
                                <p className="text-xs opacity-60">Escribe tu mensaje abajo</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((msg) => {
                                    const isMe = msg.sender_id === user.id;
                                    return (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                "flex w-full",
                                                isMe ? "justify-end" : "justify-start"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                                                    isMe
                                                        ? "bg-slate-900 text-white rounded-br-none"
                                                        : "bg-white border border-gray-100 text-slate-900 rounded-bl-none"
                                                )}
                                            >
                                                {msg.content}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t bg-white">
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Escribe un mensaje..."
                                className="flex-1 bg-slate-50 border-gray-100 focus:bg-white transition-all rounded-xl"
                            />
                            <Button
                                type="submit"
                                size="sm"
                                disabled={!newMessage.trim()}
                                className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-4"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            <Button
                size="lg"
                className={cn(
                    "rounded-full h-14 w-14 shadow-xl bg-slate-900 hover:bg-slate-800 text-white transition-all transform hover:scale-110 active:scale-95 pointer-events-auto",
                    !isOpen && "opacity-80 hover:opacity-100"
                )}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
            </Button>
        </div>
    );
}
