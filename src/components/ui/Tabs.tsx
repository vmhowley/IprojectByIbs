import { LucideIcon } from 'lucide-react';
import { KeyboardEvent, ReactNode, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

export interface TabItem<T extends string = string> {
  id: T;
  label: ReactNode;
  icon?: LucideIcon;
  count?: number;
}

interface TabsProps<T extends string> {
  tabs: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  /** Accessible name of the tab list. */
  label: string;
  /** Prefix for tab and panel ids; panels use `${idBase}-panel-${id}`. */
  idBase: string;
  className?: string;
}

/**
 * Folder tabs: the active tab is the sheet in front, joined to the page below.
 * Arrow keys move between tabs (WAI-ARIA tabs pattern, automatic activation).
 */
export function Tabs<T extends string>({ tabs, active, onChange, label, idBase, className }: TabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);

  const focusTab = (index: number) => {
    const next = tabs[(index + tabs.length) % tabs.length];
    onChange(next.id);
    requestAnimationFrame(() => listRef.current?.querySelector<HTMLButtonElement>(`[data-tab="${next.id}"]`)?.focus());
  };

  // On a narrow screen the row scrolls sideways: keep the active tab in view.
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLButtonElement>(`[data-tab="${active}"]`)
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [active]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = tabs.findIndex((tab) => tab.id === active);
    if (event.key === 'ArrowRight') { event.preventDefault(); focusTab(index + 1); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); focusTab(index - 1); }
    else if (event.key === 'Home') { event.preventDefault(); focusTab(0); }
    else if (event.key === 'End') { event.preventDefault(); focusTab(tabs.length - 1); }
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn('flex gap-0.5 overflow-x-auto border-b border-rule', className)}
    >
      {tabs.map(({ id, label: tabLabel, icon: Icon, count }) => {
        const selected = id === active;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            data-tab={id}
            id={`${idBase}-tab-${id}`}
            aria-controls={`${idBase}-panel-${id}`}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(id)}
            className={cn(
              'relative -mb-px inline-flex shrink-0 items-center gap-1.5 rounded-t-control border px-2.5 py-2 text-[13px] font-medium transition-colors sm:px-3',
              selected
                ? 'border-rule border-b-paper bg-paper text-ink before:absolute before:inset-x-[-1px] before:-top-px before:h-0.5 before:rounded-t-control before:bg-brand'
                : 'border-transparent text-ink-2 hover:bg-ink/[0.04] hover:text-ink'
            )}
          >
            {Icon && <Icon size={14} aria-hidden="true" className="max-sm:hidden" />}
            {tabLabel}
            {count !== undefined && (
              <span className={cn('text-xs tabular-nums', selected ? 'text-ink-2' : 'text-ink-3')}>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Props for the panel that belongs to a tab. */
export function tabPanelProps(idBase: string, id: string) {
  return {
    role: 'tabpanel',
    id: `${idBase}-panel-${id}`,
    'aria-labelledby': `${idBase}-tab-${id}`,
    tabIndex: 0,
  } as const;
}
