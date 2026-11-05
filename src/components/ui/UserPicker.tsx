import { Check, ChevronDown, Search, X } from 'lucide-react';
import { KeyboardEvent, useCallback, useEffect, useId, useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { getUsers } from '../../services/usersService';
import { UserProfile } from '../../types';
import { Avatar } from './Avatar';
import { Popover } from './Popover';

interface UserPickerProps {
  value?: string | null;
  onChange: (userId: string | null) => void;
  placeholder?: string;
  id?: string;
}

/** "Asignado a" cell: pick a team member by name or email. */
export function UserPicker({ value, onChange, placeholder = 'Sin asignar', id }: UserPickerProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await getUsers();
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }

  const close = useCallback(() => {
    setOpen(false);
    setSearchTerm('');
  }, []);

  useEffect(() => {
    if (open) {
      setActiveIndex(0);
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  const selectedUser = users.find(u => u.id === value);
  const term = searchTerm.trim().toLowerCase();
  const filteredUsers = users.filter(u =>
    (u.name || '').toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term)
  );

  function handleSelect(userId: string) {
    onChange(userId);
    close();
    buttonRef.current?.focus();
  }

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex(i => Math.min(filteredUsers.length - 1, i + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(i => Math.max(0, i - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (filteredUsers[activeIndex]) handleSelect(filteredUsers[activeIndex].id);
    }
  }

  return (
    <div className="relative flex items-center gap-1">
      <button
        ref={buttonRef}
        id={id}
        type="button"
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="field flex min-h-9 items-center justify-between gap-2 text-left"
      >
        {loading ? (
          <span className="text-sm text-ink-3">Cargando equipo…</span>
        ) : selectedUser ? (
          <span className="flex min-w-0 items-center gap-2">
            <Avatar name={selectedUser.name} src={selectedUser.avatar} size="xs" />
            <span className="truncate text-sm text-ink">{selectedUser.name}</span>
          </span>
        ) : (
          <span className="text-sm text-ink-3">{placeholder}</span>
        )}
        <ChevronDown size={14} aria-hidden="true" className="shrink-0 text-ink-3" />
      </button>
      {selectedUser && (
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Quitar asignación"
          title="Quitar asignación"
          className="inline-flex h-9 w-8 shrink-0 items-center justify-center rounded-control text-ink-3 hover:bg-ink/[0.06] hover:text-ink"
        >
          <X size={15} />
        </button>
      )}

      <Popover anchorRef={buttonRef} open={open} onClose={close} matchWidth className="min-w-[16rem]">
        <div className="border-b border-rule p-2">
          <div className="relative">
            <Search size={14} aria-hidden="true" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
            <input
              ref={searchRef}
              type="search"
              placeholder="Buscar por nombre o correo"
              aria-label="Buscar persona"
              aria-controls={listId}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setActiveIndex(0); }}
              onKeyDown={onSearchKeyDown}
              className="field h-8 pl-8 text-[13px]"
            />
          </div>
        </div>
        <div id={listId} role="listbox" aria-label="Equipo" className="max-h-60 overflow-y-auto py-1">
          {filteredUsers.length === 0 ? (
            <p className="px-3 py-3 text-center text-[13px] text-ink-3">Nadie coincide con «{searchTerm}».</p>
          ) : (
            filteredUsers.map((user, index) => {
              const selected = value === user.id;
              return (
                <div
                  key={user.id}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => handleSelect(user.id)}
                  className={cn('flex cursor-pointer items-center gap-2.5 px-3 py-2', index === activeIndex && 'bg-ink/[0.06]')}
                >
                  <Avatar name={user.name} src={user.avatar} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className={cn('block truncate text-sm text-ink', selected && 'font-semibold')}>{user.name}</span>
                    <span className="block truncate text-xs text-ink-3">{user.email}</span>
                  </span>
                  {selected && <Check size={14} aria-hidden="true" className="shrink-0 text-brand" />}
                </div>
              );
            })
          )}
        </div>
      </Popover>
    </div>
  );
}
