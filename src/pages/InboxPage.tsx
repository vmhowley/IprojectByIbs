import { AtSign, Bell, CheckCheck, Inbox, Info, LucideIcon, MessageSquare, UserPlus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonRows } from '../components/ui/Skeleton';
import { useAuth } from '../hooks/useAuth';
import NProgress from '../lib/nprogress';
import { cn } from '../lib/utils';
import { Notification, notificationService } from '../services/notificationService';
import { daysFromToday, formatDate, timeAgo } from '../utils/format';

const TYPES: Record<Notification['type'], { label: string; icon: LucideIcon }> = {
    assignment: { label: 'Asignación', icon: UserPlus },
    comment: { label: 'Comentario', icon: MessageSquare },
    mention: { label: 'Mención', icon: AtSign },
    system: { label: 'Sistema', icon: Info },
    info: { label: 'Aviso', icon: Bell },
};

/** "Hoy", "Ayer", or the full date, for the day headings of the inbox. */
function dayLabel(value: string) {
    const days = daysFromToday(value);
    if (days === 0) return 'Hoy';
    if (days === -1) return 'Ayer';
    const label = formatDate(value, 'long');
    return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Everything that happened to you: assignments, comments and mentions, newest first. */
export const InboxPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const onlyUnread = searchParams.get('filter') === 'unread';

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

    const handleMarkAsRead = async (id: string) => {
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

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const groups = useMemo(() => {
        const list = onlyUnread ? notifications.filter(n => !n.is_read) : notifications;
        const byDay: { label: string; items: Notification[] }[] = [];
        for (const notification of list) {
            const label = dayLabel(notification.created_at);
            const last = byDay[byDay.length - 1];
            if (last && last.label === label) last.items.push(notification);
            else byDay.push({ label, items: [notification] });
        }
        return byDay;
    }, [notifications, onlyUnread]);

    if (!user) return null;

    return (
        <div className="flex min-h-full flex-col">
            <PageHeader
                title="Notificaciones"
                subtitle={
                    loading
                        ? 'Cargando…'
                        : unreadCount > 0
                            ? `${unreadCount} sin leer. Se guardan las últimas 50.`
                            : 'Estás al día. Se guardan las últimas 50.'
                }
            >
                {unreadCount > 0 && (
                    <Button variant="secondary" onClick={handleMarkAllRead}>
                        <CheckCheck size={16} aria-hidden="true" />
                        Marcar todo como leído
                    </Button>
                )}
            </PageHeader>

            <div className="w-full max-w-4xl px-4 py-5 sm:px-6">
                <div role="group" aria-label="Mostrar" className="mb-4 flex gap-1">
                    {[
                        { id: 'all', label: 'Todas', count: notifications.length },
                        { id: 'unread', label: 'Sin leer', count: unreadCount },
                    ].map((option) => {
                        const active = (option.id === 'unread') === onlyUnread;
                        return (
                            <button
                                key={option.id}
                                type="button"
                                aria-pressed={active}
                                onClick={() => setSearchParams(option.id === 'unread' ? { filter: 'unread' } : {}, { replace: true })}
                                className={cn(
                                    'inline-flex h-7 items-center gap-1.5 rounded-control px-2.5 text-[13px] font-medium transition-colors',
                                    active ? 'bg-brand/10 text-brand-strong' : 'text-ink-2 hover:bg-ink/[0.06] hover:text-ink'
                                )}
                            >
                                {option.label}
                                <span className={cn('text-xs tabular-nums', active ? 'text-brand-strong/75' : 'text-ink-3')}>{option.count}</span>
                            </button>
                        );
                    })}
                </div>

                {loading ? (
                    <div className="sheet"><SkeletonRows rows={6} columns={2} /></div>
                ) : groups.length === 0 ? (
                    <EmptyState icon={Inbox} title={onlyUnread ? 'Nada sin leer' : 'Estás al día'}>
                        {onlyUnread
                            ? 'Leíste todas tus notificaciones.'
                            : 'Aquí llegan las asignaciones, los comentarios y las menciones de tus proyectos.'}
                    </EmptyState>
                ) : (
                    <div className="space-y-5">
                        {groups.map((group) => (
                            <section key={group.label} aria-label={group.label}>
                                <h2 className="caption mb-1.5 px-1">{group.label}</h2>
                                <ul className="sheet divide-y divide-rule overflow-hidden">
                                    {group.items.map((notification) => {
                                        const type = TYPES[notification.type] || TYPES.info;
                                        const Icon = type.icon;
                                        const unread = !notification.is_read;
                                        const body = (
                                            <>
                                                <Icon size={16} aria-hidden="true" className={cn('mt-0.5 shrink-0', unread ? 'text-ink' : 'text-ink-3')} />
                                                <span className="min-w-0 flex-1">
                                                    <span className="flex flex-wrap items-baseline gap-x-2">
                                                        <span className={cn('text-sm', unread ? 'font-semibold text-ink' : 'font-medium text-ink-2')}>
                                                            {notification.title}
                                                        </span>
                                                        <span className="text-xs text-ink-3">{type.label}</span>
                                                    </span>
                                                    <span className={cn('mt-0.5 block text-[13px] leading-relaxed', unread ? 'text-ink-2' : 'text-ink-3')}>
                                                        {notification.content}
                                                    </span>
                                                </span>
                                                <time
                                                    dateTime={notification.created_at}
                                                    title={formatDate(notification.created_at, 'datetime')}
                                                    className="shrink-0 pt-0.5 text-xs tabular-nums text-ink-3"
                                                >
                                                    {timeAgo(notification.created_at)}
                                                </time>
                                            </>
                                        );
                                        return (
                                            <li key={notification.id} className={cn('flex items-stretch', unread && 'bg-brand/[0.035]')}>
                                                <span className="flex w-5 shrink-0 justify-end pt-[1.15rem]" aria-hidden="true">
                                                    {unread && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                                                </span>
                                                {notification.link ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleNotificationClick(notification)}
                                                        className="flex min-w-0 flex-1 items-start gap-3 py-3 pl-2 pr-4 text-left outline-none transition-colors hover:bg-ink/[0.03] focus-visible:bg-ink/[0.05] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
                                                    >
                                                        {unread && <span className="sr-only">Sin leer:</span>}
                                                        {body}
                                                    </button>
                                                ) : (
                                                    <div className="flex min-w-0 flex-1 items-start gap-3 py-3 pl-2 pr-4">
                                                        {unread && <span className="sr-only">Sin leer:</span>}
                                                        {body}
                                                    </div>
                                                )}
                                                {unread && (
                                                    <div className="flex shrink-0 items-center border-l border-rule px-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleMarkAsRead(notification.id)}
                                                            aria-label={`Marcar como leída: ${notification.title}`}
                                                        >
                                                            <CheckCheck size={14} aria-hidden="true" />
                                                            <span className="max-sm:sr-only">Leída</span>
                                                        </Button>
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
