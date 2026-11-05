import { Bell, LifeBuoy, LogOut, Menu, Search, Settings, Shield } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import { cn } from '../../lib/utils';
import { notificationService } from '../../services/notificationService';
import { Avatar } from '../ui/Avatar';
import { Logo } from '../ui/Logo';
import { Popover } from '../ui/Popover';
import { ThemeToggle } from '../ui/ThemeToggle';

interface NavbarProps {
  onOpenMenu: () => void;
  onOpenSearch: () => void;
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  user: 'Equipo',
  guest: 'Invitado',
  support_agent: 'Agente de soporte',
};

/** The letterhead across the top of every page: find, notifications, who you are. */
export function Navbar({ onOpenMenu, onOpenSearch }: NavbarProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count || 0);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadUnreadCount();
    const handleNotificationUpdate = () => loadUnreadCount();
    window.addEventListener('notification-updated', handleNotificationUpdate);
    // Reload the count on every new notification, for consistency.
    const sub = notificationService.subscribe(user.id, () => loadUnreadCount());
    return () => {
      sub.unsubscribe();
      window.removeEventListener('notification-updated', handleNotificationUpdate);
    };
  }, [user?.id, loadUnreadCount]);

  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);
  const inboxActive = location.pathname === '/inbox';

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-rule bg-paper px-3 sm:px-4">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Abrir menú"
        className="inline-flex h-9 w-9 items-center justify-center rounded-control text-ink-2 hover:bg-ink/[0.06] md:hidden"
      >
        <Menu size={20} />
      </button>
      <Link to="/dashboard" className="md:hidden" aria-label="Inicio">
        <Logo variant="mark" className="h-7 w-7" />
      </Link>

      <button
        type="button"
        onClick={onOpenSearch}
        aria-keyshortcuts="Control+K Meta+K"
        className="group ml-1 flex h-9 min-w-0 flex-1 items-center gap-2 rounded-control border border-rule bg-well px-3 text-left text-sm text-ink-3 transition-colors hover:border-rule-strong hover:text-ink-2 sm:max-w-md"
      >
        <Search size={15} aria-hidden="true" className="shrink-0" />
        <span className="truncate">Buscar proyecto, ticket o cliente</span>
        <kbd className="ml-auto hidden shrink-0 rounded-inner border border-rule bg-paper px-1.5 font-mono text-[11px] text-ink-3 sm:inline">
          {isMac ? '⌘K' : 'Ctrl K'}
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <Link
          to="/inbox"
          aria-label={unreadCount > 0 ? `Notificaciones: ${unreadCount} sin leer` : 'Notificaciones'}
          aria-current={inboxActive ? 'page' : undefined}
          className={cn(
            'relative inline-flex h-9 w-9 items-center justify-center rounded-control transition-colors',
            inboxActive ? 'bg-ink/[0.07] text-ink' : 'text-ink-2 hover:bg-ink/[0.06] hover:text-ink'
          )}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full border-2 border-paper bg-brand px-1 text-center text-2xs font-bold leading-[14px] text-on-brand tabular-nums">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>
        <ThemeToggle className="h-9 w-9" />
        <UserMenu />
      </div>
    </header>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const { isPro } = useSubscription();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const itemClass =
    'flex w-full items-center gap-2.5 rounded-inner px-2.5 py-2 text-left text-sm text-ink hover:bg-ink/[0.06]';

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Cuenta de ${user.name}`}
        className="ml-1 flex h-9 items-center gap-2 rounded-control px-1.5 hover:bg-ink/[0.06]"
      >
        <Avatar name={user.name} src={user.avatar} size="sm" />
        <span className="hidden max-w-[10rem] truncate text-sm font-medium text-ink lg:inline">{user.name}</span>
      </button>

      <Popover anchorRef={buttonRef} open={open} onClose={close} align="end" className="w-64">
        <div className="border-b border-rule px-3 py-3">
          <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
          <p className="truncate text-xs text-ink-3">{user.email}</p>
          <p className="mt-1.5 text-xs text-ink-2">
            {ROLE_LABEL[user.role] || user.role}
            {isPro && <span className="ml-1.5 font-semibold text-brand">· Pro</span>}
          </p>
        </div>
        <div role="menu" aria-label="Cuenta" className="p-1" onClick={close}>
          {(user.role === 'support_agent' || user.role === 'admin') && (
            <>
              <Link role="menuitem" to="/admin/support" className={itemClass}>
                <LifeBuoy size={16} aria-hidden="true" className="text-ink-3" />
                Cola de soporte
              </Link>
              <Link role="menuitem" to="/admin" className={itemClass}>
                <Shield size={16} aria-hidden="true" className="text-ink-3" />
                Usuarios y permisos
              </Link>
            </>
          )}
          {user.role !== 'guest' && (
            <Link role="menuitem" to="/settings" className={itemClass}>
              <Settings size={16} aria-hidden="true" className="text-ink-3" />
              Configuración
            </Link>
          )}
          <button role="menuitem" type="button" onClick={handleLogout} className={cn(itemClass, 'text-st-red')}>
            <LogOut size={16} aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </Popover>
    </>
  );
}
