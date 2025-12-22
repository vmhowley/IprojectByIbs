import { ReactNode } from 'react';

interface Column<T> {
    id: string;
    title: string;
    items: T[];
}

interface BoardViewProps<T> {
    columns: Column<T>[];
    renderItem: (item: T) => ReactNode;
    onItemClick?: (item: T) => void;
    emptyMessage?: string;
}

export function BoardView<T extends { id: string }>({
    columns,
    renderItem,
    emptyMessage = 'No items found'
}: BoardViewProps<T>) {
    return (
        <div className="flex h-full overflow-x-auto gap-6 pb-4">
            {columns.map((column) => (
                <div key={column.id} className="w-80 shrink-0 flex flex-col">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
                            {column.title}
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium border border-gray-200">
                                {column.items.length}
                            </span>
                        </h3>
                    </div>

                    <div className="flex-1 bg-gray-50/50 rounded-xl p-3 border border-gray-200/50 overflow-y-auto min-h-[150px]">
                        {column.items.length === 0 ? (
                            <div className="h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-400">
                                Vacío
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {column.items.map((item) => (
                                    <div key={item.id}>
                                        {renderItem(item)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
