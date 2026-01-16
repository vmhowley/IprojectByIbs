import { Bell, Check, CheckCheck, ChevronRight, Clock, Info, MessageSquare, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { useAuth } from '../hooks/useAuth';
import NProgress from '../lib/nprogress';
import { Notification, notificationService } from '../services/notificationService';


export const InboxPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();

        if (user) {
            const sub = notificationService.subscribe(user.id, (notification) => {
                setNotifications(prev => [notification, ...prev]);
            });
            return () => {
                sub.unsubscribe();
            };
        }
    }, [user?.id]);

    const loadNotifications = async () => {
        try {
            NProgress.start();
            const data = await notificationService.getAll();
            setNotifications(data);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
            NProgress.done();
        }
    };


    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_read) {
            // Call service directly, bypassing handleMarkAsRead to avoid event issues
            try {
                notificationService.markAsRead(notification.id); // fire and forget
                setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
            } catch (err) {
                console.error(err);
            }
        }
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'assignment': return <User className="w-5 h-5 text-blue-500" />;
            case 'comment': return <MessageSquare className="w-5 h-5 text-green-500" />;
            case 'system': return <Info className="w-5 h-5 text-orange-500" />;
            case 'mention': return <User className="w-5 h-5 text-purple-500" />;
            default: return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    if (!user) return null;

    return (
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950">
            <PageHeader
                title="Notificaciones"
                subtitle="Mantente al día con lo que sucede en tus proyectos."
            >
                {notifications.some(n => !n.is_read) && (
                    <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                    >
                        <CheckCheck size={16} />
                        Marcar todo como leído
                    </button>
                )}
            </PageHeader>

            <div className="max-w-4xl mx-auto p-6">

                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden min-h-[400px]">
                    {loading ? (
                        null
                    ) : notifications.length === 0 ? (

                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                <Check className="w-8 h-8 text-gray-400 dark:text-slate-600" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Estás al día</h3>
                            <p className="text-gray-500 dark:text-slate-400 mt-1">No tienes nuevas notificaciones por ahora.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-slate-800">
                            {notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`p-4 flex gap-4 transition-colors relative group border-l-4 ${notification.link ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50' : ''
                                        } ${!notification.is_read ? 'bg-indigo-50/30 dark:bg-indigo-500/5 border-indigo-500' : 'border-transparent'}`}
                                >
                                    <div className={`mt-1 shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${!notification.is_read ? 'bg-white dark:bg-slate-800 shadow-sm' : 'bg-gray-100 dark:bg-slate-800/50'}`}>
                                        {getIcon(notification.type)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className={`text-sm font-semibold ${!notification.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-slate-300'}`}>
                                                {notification.title}
                                            </h4>
                                            <span className="text-xs text-gray-400 dark:text-slate-500 whitespace-nowrap flex items-center gap-1">
                                                <Clock size={12} />
                                                {new Date(notification.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className={`text-sm mt-1 ${!notification.is_read ? 'text-gray-800 dark:text-slate-200' : 'text-gray-500 dark:text-slate-400'}`}>
                                            {notification.content}
                                        </p>
                                        {notification.link && (
                                            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                Ver detalles <ChevronRight size={12} />
                                            </p>
                                        )}
                                    </div>

                                    {!notification.is_read && (
                                        <button
                                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                                            title="Marcar como leído"
                                            className="shrink-0 self-center p-2 text-indigo-400 dark:text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
