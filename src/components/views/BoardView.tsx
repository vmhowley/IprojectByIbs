import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface Column<T> {
    id: string;
    title: string;
    items: T[];
    /** Ink of the column head, matching the stamps. */
    inkClass?: string;
}

interface BoardViewProps<T> {
    columns: Column<T>[];
    renderItem: (item: T) => ReactNode;
    onItemClick?: (item: T) => void;
    emptyMessage?: string;
}

/** Trays side by side: one per status, each with its stack of sheets. */
export function BoardView<T extends { id: string }>({
    columns,
    renderItem,
    emptyMessage = 'Vacío'
}: BoardViewProps<T>) {
    return (
        <div className="flex h-full gap-4 overflow-x-auto pb-4">
            {columns.map((column) => (
                <section key={column.id} className="flex w-72 shrink-0 flex-col" aria-label={column.title}>
                    <h3 className="mb-2 flex items-center justify-between px-1 text-[13px] font-semibold text-ink">
                        <span className={cn('flex items-center gap-2', column.inkClass)}>
                            <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
                            <span className="text-ink">{column.title}</span>
                        </span>
                        <span className="text-xs font-medium tabular-nums text-ink-3">{column.items.length}</span>
                    </h3>

                    <div className="min-h-[150px] flex-1 overflow-y-auto rounded-sheet border border-rule bg-shelf/60 p-2">
                        {column.items.length === 0 ? (
                            <div className="flex h-20 items-center justify-center rounded-control border border-dashed border-rule-strong/40 text-xs text-ink-3">
                                {emptyMessage}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {column.items.map((item) => (
                                    <div key={item.id}>
                                        {renderItem(item)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            ))}
        </div>
    );
}
