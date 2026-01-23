import { Kanban, LayoutGrid, List } from 'lucide-react';

export type ViewType = 'grid' | 'list' | 'board';

interface ViewSwitcherProps {
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
}

export function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
    return (
        <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
            <button
                onClick={() => onViewChange('grid')}
                title="Cuadrícula"
                className={`p-1.5 rounded-md transition-all ${currentView === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                    }`}
            >
                <LayoutGrid size={18} />
            </button>
            <button
                onClick={() => onViewChange('list')}
                title="Lista"
                className={`p-1.5 rounded-md transition-all ${currentView === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                    }`}
            >
                <List size={18} />
            </button>
            <button
                onClick={() => onViewChange('board')}
                title="Tablero"
                className={`p-1.5 rounded-md transition-all ${currentView === 'board'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                    }`}
            >
                <Kanban size={18} />
            </button>
        </div>
    );
}
