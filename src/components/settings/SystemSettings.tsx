import { AlertTriangle, Database, Plus, Settings2, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { requestTypeService, TicketRequestType } from '../../services/requestTypeService';

export function SystemSettings() {
    const [types, setTypes] = useState<TicketRequestType[]>([]);
    const [newTypeLabel, setNewTypeLabel] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadTypes();
    }, []);

    const loadTypes = async () => {
        try {
            setLoading(true);
            const data = await requestTypeService.getAll();
            setTypes(data);
        } catch (err: any) {
            console.error('Error loading request types:', err);
            if (err.code === '42P01' || err.message?.includes('does not exist')) {
                setError('La tabla de configuración no existe. Por favor ejecuta la migración de base de datos.');
            } else {
                setError('Error cargando los tipos de solicitud.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAddType = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTypeLabel.trim()) return;

        try {
            setError(null);
            const newType = await requestTypeService.create(newTypeLabel.trim());
            setTypes([...types, newType]);
            setNewTypeLabel('');
        } catch (err: any) {
            console.error('Error adding request type:', err);
            setError(err.message || 'Error agregando el tipo.');
        }
    };

    const handleDeleteType = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este tipo de solicitud?')) return;

        try {
            setError(null);
            await requestTypeService.delete(id);
            setTypes(types.filter(t => t.id !== id));
        } catch (err: any) {
            console.error('Error deleting request type:', err);
            setError(err.message || 'Error eliminando el tipo.');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">
                    Parametrización del Sistema
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                    Configura los valores predeterminados y listas desplegables que se utilizan en toda la aplicación.
                </p>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                    <AlertTriangle size={20} />
                    <span>{error}</span>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                {/* Request Types Card */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:border-indigo-200 transition-colors">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 rounded text-indigo-600">
                                <Database size={16} />
                            </div>
                            <h3 className="font-semibold text-gray-900 text-sm">Tipos de Solicitud</h3>
                        </div>
                        <span className="text-xs font-medium bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                            {types.length} activos
                        </span>
                    </div>

                    <div className="p-4">
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={newTypeLabel}
                                onChange={(e) => setNewTypeLabel(e.target.value)}
                                placeholder="Nuevo tipo (ej. Incidente, Mejora)..."
                                className="flex-1 text-sm border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddType(e)}
                            />
                            <button
                                onClick={handleAddType}
                                disabled={!newTypeLabel.trim()}
                                className="px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                <Plus size={16} />
                                <span className="hidden sm:inline">Agregar</span>
                            </button>
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {loading && types.length === 0 ? (
                                <p className="text-center text-gray-400 text-sm py-4">Cargando...</p>
                            ) : types.length === 0 ? (
                                <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-lg">
                                    <p className="text-xs text-gray-400">No hay tipos definidos</p>
                                </div>
                            ) : (
                                types.map(type => (
                                    <div key={type.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100 group hover:border-indigo-100 hover:bg-indigo-50/30 transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-700">{type.label}</span>
                                            <span className="text-[10px] text-gray-400 font-mono">{type.value}</span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteType(type.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Placeholder for future settings (e.g. Priorities) */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm opacity-60">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-gray-200 rounded text-gray-500">
                                <Settings2 size={16} />
                            </div>
                            <h3 className="font-semibold text-gray-900 text-sm">Prioridades (Próximamente)</h3>
                        </div>
                    </div>
                    <div className="p-6 text-center">
                        <p className="text-sm text-gray-400 italic">Esta configuración estará disponible en una futura actualización.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
