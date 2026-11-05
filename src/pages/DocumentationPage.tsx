import { BookOpen, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useSearchParams } from 'react-router-dom';
import { UploadDocModal } from '../components/documentation/UploadDocModal';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { confirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { TableView } from '../components/views/TableView';
import NProgress from '../lib/nprogress';
import { cn } from '../lib/utils';
import { documentationService } from '../services/documentationService';
import { ProjectDocument } from '../types/Project';
import { fileKind, formatDate, formatFileSize } from '../utils/format';
import { normalizeText } from '../utils/tickets';

type DocWithProject = ProjectDocument & { projects?: { name: string } | null };
type Filter = 'all' | 'general' | 'project';

const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'general', label: 'Generales' },
    { id: 'project', label: 'De proyectos' },
];

/** The archive: manuals, specs and deliverables, general or tied to a project. */
export function DocumentationPage() {
    const [documents, setDocuments] = useState<DocWithProject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchParams, setSearchParams] = useSearchParams();
    const [showUploadModal, setShowUploadModal] = useState(false);
    const filterType = (searchParams.get('type') as Filter) || 'all';

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            NProgress.start();
            setIsLoading(true);
            const data = await documentationService.getAll();
            setDocuments(data);
        } catch (error) {
            console.error('Error loading documents:', error);
            toast.error('No se pudo cargar la documentación.');
        } finally {
            setIsLoading(false);
            NProgress.done();
        }
    };

    const handleDelete = async (doc: ProjectDocument) => {
        const ok = await confirmDialog({
            title: 'Eliminar documento',
            message: `Se eliminará «${doc.name}» de la documentación.`,
            confirmText: 'Eliminar',
            tone: 'danger',
        });
        if (!ok) return;
        try {
            await documentationService.delete(doc.id);
            toast.success('Documento eliminado');
            loadDocuments();
        } catch (error) {
            console.error('Error deleting doc:', error);
            toast.error('No se pudo eliminar el documento.');
        }
    };

    const searched = useMemo(() => {
        const term = normalizeText(searchQuery.trim());
        if (!term) return documents;
        return documents.filter((doc) => normalizeText(`${doc.name} ${doc.description || ''} ${doc.projects?.name || ''}`).includes(term));
    }, [documents, searchQuery]);

    const counts: Record<Filter, number> = {
        all: searched.length,
        general: searched.filter((d) => !d.project_id).length,
        project: searched.filter((d) => !!d.project_id).length,
    };

    const filteredDocs = searched.filter((doc) =>
        filterType === 'all' || (filterType === 'general' ? !doc.project_id : !!doc.project_id)
    );

    return (
        <div className="flex min-h-full flex-col">
            <PageHeader
                title="Documentación"
                subtitle="Manuales, especificaciones y entregables, generales o de cada proyecto."
                search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Buscar documento o proyecto' }}
                actions={[{ label: 'Subir documento', icon: Plus, onClick: () => setShowUploadModal(true) }]}
            />

            <div className="px-4 py-5 sm:px-6">
                <div role="group" aria-label="Mostrar" className="mb-4 flex flex-wrap gap-1">
                    {FILTERS.map(({ id, label }) => {
                        const active = filterType === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                aria-pressed={active}
                                onClick={() => setSearchParams(id === 'all' ? {} : { type: id }, { replace: true })}
                                className={cn(
                                    'inline-flex h-7 items-center gap-1.5 rounded-control px-2.5 text-[13px] font-medium transition-colors',
                                    active ? 'bg-brand/10 text-brand-strong' : 'text-ink-2 hover:bg-ink/[0.06] hover:text-ink'
                                )}
                            >
                                {label}
                                <span className={cn('text-xs tabular-nums', active ? 'text-brand-strong/75' : 'text-ink-3')}>{counts[id]}</span>
                            </button>
                        );
                    })}
                </div>

                {!isLoading && documents.length === 0 ? (
                    <EmptyState icon={BookOpen} title="Todavía no hay documentos">
                        Sube manuales, especificaciones o entregables. Puedes dejarlos generales o vincularlos a un proyecto.
                    </EmptyState>
                ) : (
                    <TableView
                        caption="Documentos"
                        data={filteredDocs}
                        isLoading={isLoading}
                        defaultSort={{ index: 4, dir: 'desc' }}
                        emptyMessage="Ningún documento coincide con la búsqueda."
                        columns={[
                            {
                                header: 'Documento',
                                sortValue: (doc) => doc.name.toLowerCase(),
                                cell: (doc) => (
                                    <div className="min-w-0">
                                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="line-clamp-1 font-medium text-ink hover:underline">
                                            {doc.name}
                                        </a>
                                        {doc.description && <p className="line-clamp-1 max-w-2xl text-[13px] text-ink-3">{doc.description}</p>}
                                    </div>
                                ),
                            },
                            {
                                header: 'Tipo',
                                hideBelow: 'sm',
                                sortValue: (doc) => fileKind(doc.url, doc.file_type),
                                cell: (doc) => (
                                    <span className="rounded-inner border border-rule bg-well px-1.5 py-0.5 font-mono text-[11px] font-semibold text-ink-2">
                                        {fileKind(doc.url, doc.file_type)}
                                    </span>
                                ),
                            },
                            {
                                header: 'Proyecto',
                                hideBelow: 'md',
                                sortValue: (doc) => doc.projects?.name?.toLowerCase() || '',
                                cell: (doc) =>
                                    doc.project_id ? (
                                        <Link to={`/project/${doc.project_id}?tab=docs`} className="line-clamp-1 text-[13px] text-ink-2 hover:text-ink hover:underline">
                                            {doc.projects?.name || 'Proyecto'}
                                        </Link>
                                    ) : (
                                        <span className="text-[13px] text-ink-3">General</span>
                                    ),
                            },
                            {
                                header: 'Tamaño',
                                hideBelow: 'lg',
                                align: 'right',
                                sortValue: (doc) => doc.file_size || 0,
                                cell: (doc) => <span className="whitespace-nowrap text-[13px] text-ink-2">{formatFileSize(doc.file_size) || '—'}</span>,
                            },
                            {
                                header: 'Subido',
                                hideBelow: 'sm',
                                sortValue: (doc) => doc.created_at,
                                cell: (doc) => <span className="text-[13px] tabular-nums text-ink-2">{formatDate(doc.created_at)}</span>,
                            },
                            {
                                header: 'Acciones',
                                align: 'right',
                                cell: (doc) => (
                                    <span className="inline-flex items-center gap-1">
                                        <a
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={`Abrir ${doc.name}`}
                                            title="Abrir"
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-control text-ink-2 hover:bg-ink/[0.06] hover:text-ink"
                                        >
                                            <ExternalLink size={15} />
                                        </a>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 hover:bg-st-red/10 hover:text-st-red"
                                            onClick={() => handleDelete(doc)}
                                            aria-label={`Eliminar ${doc.name}`}
                                            title="Eliminar"
                                        >
                                            <Trash2 size={15} />
                                        </Button>
                                    </span>
                                ),
                            },
                        ]}
                    />
                )}

                <p className="mt-4 text-xs text-ink-3">
                    Los pases a producción se generan desde cada ticket aprobado o completado.
                </p>
            </div>

            <UploadDocModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onSuccess={loadDocuments}
            />
        </div>
    );
}
