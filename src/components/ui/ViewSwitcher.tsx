import { Kanban, List, Table2 } from 'lucide-react';

export type ViewType = 'list' | 'board' | 'table';

interface ViewSwitcherProps {
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
}

export function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
    return (
        <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
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
            <button
                onClick={() => onViewChange('table')}
                title="Tabla"
                className={`p-1.5 rounded-md transition-all ${currentView === 'table'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                    }`}
            >
                <Table2 size={18} />
            </button>
        </div>
    );
}
