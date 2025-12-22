import { ReactNode } from 'react';

export interface ColumnDef<T> {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => ReactNode;
    className?: string; // For customized width/align
}

interface TableViewProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    onRowClick?: (item: T) => void;
    isLoading?: boolean;
}

export function TableView<T extends { id: string }>({
    data,
    columns,
    onRowClick,
    isLoading
}: TableViewProps<T>) {

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Cargando tabla...</div>;
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    scope="col"
                                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.className || ''}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500 text-sm">
                                    No hay datos para mostrar
                                </td>
                            </tr>
                        ) : (
                            data.map((item) => (
                                <tr
                                    key={item.id}
                                    onClick={() => onRowClick && onRowClick(item)}
                                    className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                                >
                                    {columns.map((col, idx) => (
                                        <td key={idx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {col.cell ? col.cell(item) : (col.accessorKey ? String(item[col.accessorKey]) : '')}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
