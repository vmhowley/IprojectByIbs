import { Kanban, LayoutGrid, List, LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ViewType = 'grid' | 'list' | 'board';

interface ViewSwitcherProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  views?: ViewType[];
  className?: string;
}

const VIEWS: Record<ViewType, { label: string; icon: LucideIcon }> = {
  list: { label: 'Lista', icon: List },
  grid: { label: 'Fichas', icon: LayoutGrid },
  board: { label: 'Bandejas', icon: Kanban },
};

export function ViewSwitcher({ currentView, onViewChange, views = ['list', 'grid', 'board'], className }: ViewSwitcherProps) {
  return (
    <div role="group" aria-label="Vista" className={cn('segmented h-9', className)}>
      {views.map((view) => {
        const { label, icon: Icon } = VIEWS[view];
        const active = currentView === view;
        return (
          <button
            key={view}
            type="button"
            onClick={() => onViewChange(view)}
            aria-pressed={active}
            title={label}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-inner px-2.5 text-[13px] font-medium transition-colors',
              active ? 'bg-raised text-ink shadow-control' : 'text-ink-2 hover:text-ink'
            )}
          >
            <Icon size={15} aria-hidden="true" />
            <span className="hidden lg:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
