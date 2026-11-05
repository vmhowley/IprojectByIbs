import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { requestTypeService, TicketRequestType } from '../../services/requestTypeService';
import { Button } from '../ui/Button';
import { confirmDialog } from '../ui/ConfirmDialog';
import { SkeletonRows } from '../ui/Skeleton';
import { errorCode, errorMessage } from '../../utils/errors';

/** The lists the rest of the app picks from. Today: the request types of a ticket. */
export function SystemSettings() {
    const [types, setTypes] = useState<TicketRequestType[]>([]);
    const [newTypeLabel, setNewTypeLabel] = useState('');
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadTypes();
    }, []);

    const loadTypes = async () => {
        try {
            setLoading(true);
            const data = await requestTypeService.getAll();
            setTypes(data);
        } catch (err) {
            console.error('Error loading request types:', err);
            if (errorCode(err) === '42P01' || errorMessage(err, '').includes('does not exist')) {
                setError('La tabla de configuración no existe. Ejecuta la migración de base de datos.');
            } else {
                setError('No se pudieron cargar los tipos de solicitud.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAddType = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTypeLabel.trim()) return;

        try {
            setAdding(true);
            setError(null);
            const newType = await requestTypeService.create(newTypeLabel.trim());
            setTypes([...types, newType]);
            setNewTypeLabel('');
            toast.success(`Tipo «${newType.label}» agregado`);
        } catch (err) {
            console.error('Error adding request type:', err);
            setError(errorMessage(err, 'No se pudo agregar el tipo.'));
        } finally {
            setAdding(false);
        }
    };

    const handleDeleteType = async (type: TicketRequestType) => {
        const ok = await confirmDialog({
            title: 'Eliminar tipo de solicitud',
            message: `«${type.label}» dejará de aparecer al crear tickets. Los tickets que ya lo usan lo conservan.`,
            confirmText: 'Eliminar',
            tone: 'danger',
        });
        if (!ok) return;

        try {
            setError(null);
            await requestTypeService.delete(type.id);
            setTypes(types.filter(t => t.id !== type.id));
        } catch (err) {
            console.error('Error deleting request type:', err);
            setError(errorMessage(err, 'No se pudo eliminar el tipo.'));
        }
    };

    return (
        <section className="max-w-2xl" aria-labelledby="request-types-title">
            <div className="mb-3">
                <h3 id="request-types-title" className="text-[15px] font-semibold text-ink">
                    Tipos de solicitud <span className="font-normal tabular-nums text-ink-3">{types.length}</span>
                </h3>
                <p className="mt-0.5 text-[13px] text-ink-2">La lista que aparece en «Tipo de solicitud» al crear o editar un ticket.</p>
            </div>

            {error && (
                <p role="alert" className="mb-3 rounded-control border border-st-red/40 bg-st-red/[0.06] px-3 py-2 text-sm text-st-red">
                    {error}
                </p>
            )}

            {/* Request Types Card */}
            <div className="sheet overflow-hidden">
                <form onSubmit={handleAddType} className="flex gap-2 border-b border-rule bg-well p-3">
                    <label htmlFor="new-request-type" className="sr-only">Nuevo tipo de solicitud</label>
                    <input
                        id="new-request-type"
                        type="text"
                        value={newTypeLabel}
                        onChange={(e) => setNewTypeLabel(e.target.value)}
                        placeholder="Nuevo tipo, p. ej. Incidencia de reporte"
                        className="field h-9"
                    />
                    <Button type="submit" variant="secondary" disabled={!newTypeLabel.trim()} isLoading={adding}>
                        {!adding && <Plus size={15} aria-hidden="true" />}
                        Agregar
                    </Button>
                </form>

                {loading && types.length === 0 ? (
                    <SkeletonRows rows={5} columns={2} />
                ) : types.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-ink-3">No hay tipos definidos. Agrega el primero arriba.</p>
                ) : (
                    <ul className="divide-y divide-rule">
                        {types.map(type => (
                            <li key={type.id} className="flex items-center gap-3 px-4 py-2">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm text-ink">{type.label}</p>
                                    <p className="truncate font-mono text-[11px] text-ink-3">{type.value}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-st-red/10 hover:text-st-red"
                                    onClick={() => handleDeleteType(type)}
                                    aria-label={`Eliminar ${type.label}`}
                                    title="Eliminar"
                                >
                                    <Trash2 size={15} />
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
