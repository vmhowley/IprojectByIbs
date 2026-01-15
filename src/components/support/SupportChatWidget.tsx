
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
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
            {isOpen && (
                <div className="w-[350px] h-[450px] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
                    {/* Header */}
                    <div className="bg-primary p-4 flex justify-between items-center text-primary-foreground bg-slate-900 text-white">
                        <div>
                            <h3 className="font-semibold">Support Chat</h3>
                            <p className="text-xs text-slate-300">We usually reply in a few minutes</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 text-white hover:bg-slate-700 p-0"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-4 bg-slate-50 relative" ref={scrollRef}>
                        {isLoading ? (
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                                Loading...
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground text-sm p-6 text-center">
                                <MessageCircle className="h-12 w-12 opacity-20 mb-2" />
                                <p>How can we help you today?</p>
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
                                                    "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                                                    isMe
                                                        ? "bg-slate-900 text-white rounded-br-none"
                                                        : "bg-white border border-gray-200 text-slate-900 rounded-bl-none shadow-sm"
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
                    <div className="p-3 border-t bg-white">
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1"
                            />
                            <Button type="submit" size="sm" disabled={!newMessage.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            <Button
                size="lg"
                className="rounded-full h-14 w-14 shadow-lg bg-slate-900 hover:bg-slate-800 text-white"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
            </Button>
        </div>
    );
}
