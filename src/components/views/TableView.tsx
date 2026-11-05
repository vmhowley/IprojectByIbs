import { ArrowDown, ArrowUp } from 'lucide-react';
import { ReactNode, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { SkeletonRows } from '../ui/Skeleton';

export interface ColumnDef<T> {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => ReactNode;
    className?: string; // For customized width/align
    align?: 'left' | 'right';
    /** Makes the column sortable by this value. */
    sortValue?: (item: T) => string | number | null | undefined;
    /** Hide below this breakpoint to keep small screens readable. */
    hideBelow?: 'sm' | 'md' | 'lg' | 'xl';
}

interface TableViewProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    onRowClick?: (item: T) => void;
    /** Where a click on the row goes; the row also stays a normal link target for its first cell. */
    rowHref?: (item: T) => string;
    isLoading?: boolean;
    emptyMessage?: ReactNode;
    /** Rows for <tfoot>, e.g. totals under a double rule. */
    footer?: ReactNode;
    caption?: string;
    defaultSort?: { index: number; dir: 'asc' | 'desc' };
    className?: string;
    rowClassName?: (item: T) => string | undefined;
}

const HIDE: Record<NonNullable<ColumnDef<unknown>['hideBelow']>, string> = {
    sm: 'max-sm:hidden',
    md: 'max-md:hidden',
    lg: 'max-lg:hidden',
    xl: 'max-xl:hidden',
};

/** A ruled register: caption heads, one line per record, totals under a double rule. */
export function TableView<T extends { id: string }>({
    data,
    columns,
    onRowClick,
    rowHref,
    isLoading,
    emptyMessage = 'No hay registros para mostrar.',
    footer,
    caption,
    defaultSort,
    className,
    rowClassName,
}: TableViewProps<T>) {
    const navigate = useNavigate();
    const [sort, setSort] = useState(defaultSort);

    const rows = useMemo(() => {
        if (!sort) return data;
        const getter = columns[sort.index]?.sortValue;
        if (!getter) return data;
        const dir = sort.dir === 'asc' ? 1 : -1;
        return [...data].sort((a, b) => {
            const va = getter(a);
            const vb = getter(b);
            if (va === vb) return 0;
            if (va === null || va === undefined || va === '') return 1;
            if (vb === null || vb === undefined || vb === '') return -1;
            if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
            return String(va).localeCompare(String(vb), 'es') * dir;
        });
    }, [data, columns, sort]);

    if (isLoading) {
        return (
            <div className={cn('sheet', className)}>
                <SkeletonRows rows={8} columns={Math.min(columns.length, 5)} />
            </div>
        );
    }

    const clickable = !!(onRowClick || rowHref);

    return (
        <div className={cn('sheet overflow-hidden', className)}>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    {caption && <caption className="sr-only">{caption}</caption>}
                    <thead>
                        <tr className="border-b border-rule bg-well">
                            {columns.map((col, idx) => {
                                const active = sort?.index === idx;
                                return (
                                    <th
                                        key={idx}
                                        scope="col"
                                        aria-sort={col.sortValue ? (active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : 'none') : undefined}
                                        className={cn(
                                            'whitespace-nowrap px-4 py-2',
                                            col.align === 'right' ? 'text-right' : 'text-left',
                                            col.hideBelow && HIDE[col.hideBelow],
                                            col.className
                                        )}
                                    >
                                        {col.sortValue ? (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSort((s) =>
                                                        s?.index === idx
                                                            ? { index: idx, dir: s.dir === 'asc' ? 'desc' : 'asc' }
                                                            : { index: idx, dir: 'asc' }
                                                    )
                                                }
                                                className={cn('caption inline-flex items-center gap-1 hover:text-ink', active && 'text-ink')}
                                            >
                                                {col.header}
                                                {active && (sort!.dir === 'asc' ? <ArrowUp size={11} aria-hidden="true" /> : <ArrowDown size={11} aria-hidden="true" />)}
                                            </button>
                                        ) : (
                                            <span className="caption">{col.header}</span>
                                        )}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-rule">
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-ink-3">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            rows.map((item) => (
                                <tr
                                    key={item.id}
                                    onClick={(event) => {
                                        // Let real links and buttons inside the row do their own job.
                                        if ((event.target as HTMLElement).closest('a, button, input, select, textarea')) return;
                                        if (onRowClick) onRowClick(item);
                                        else if (rowHref) navigate(rowHref(item));
                                    }}
                                    className={cn('transition-colors', clickable && 'cursor-pointer hover:bg-ink/[0.03]', rowClassName?.(item))}
                                >
                                    {columns.map((col, idx) => (
                                        <td
                                            key={idx}
                                            className={cn(
                                                'px-4 py-2.5 align-middle text-ink',
                                                col.align === 'right' && 'text-right tabular-nums',
                                                col.hideBelow && HIDE[col.hideBelow],
                                                col.className
                                            )}
                                        >
                                            {col.cell ? col.cell(item) : (col.accessorKey ? String(item[col.accessorKey] ?? '') : '')}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                    {footer && rows.length > 0 && <tfoot>{footer}</tfoot>}
                </table>
            </div>
        </div>
    );
}
