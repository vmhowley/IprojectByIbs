import { Book, ChevronRight, ExternalLink, FileText, Layout, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { UploadDocModal } from '../components/documentation/UploadDocModal';
import NProgress from '../lib/nprogress';
import { documentationService } from '../services/documentationService';
import { ProjectDocument } from '../types/Project';
import { confirmAction } from '../utils/confirmationToast';

export function DocumentationPage() {
    const [documents, setDocuments] = useState<ProjectDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'general' | 'project'>('all');
    const [showUploadModal, setShowUploadModal] = useState(false);

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
            toast.error('Error al cargar la documentación');
        } finally {
            setIsLoading(false);
            NProgress.done();
        }
    };

    const handleDelete = (doc: ProjectDocument) => {
        confirmAction({
            message: `¿Estás seguro de que deseas eliminar permanentemente el documento "${doc.name}"?`,
            onConfirm: async () => {
                try {
                    await documentationService.delete(doc.id);
                    toast.success('Documento eliminado');
                    loadDocuments();
                } catch (error) {
                    console.error('Error deleting doc:', error);
                    toast.error('Error al eliminar el documento');
                }
            },
            confirmText: 'Eliminar',
            cancelText: 'Cancelar'
        });
    };

    const filteredDocs = documents.filter(doc => {
        const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (doc.description || '').toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilter = filterType === 'all' ||
            (filterType === 'general' && !doc.project_id) ||
            (filterType === 'project' && doc.project_id);

        return matchesSearch && matchesFilter;
    });

    const categories = [
        { id: 'all', title: 'Todos los Documentos', icon: Book },
        { id: 'general', title: 'Documentación General', icon: FileText },
        { id: 'project', title: 'Documentos de Proyectos', icon: Layout },
    ];

    return (
        <div className="flex bg-gray-50 dark:bg-[#0B1120] h-screen overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-64 bg-white dark:bg-[#0B1120] border-r border-gray-200 dark:border-slate-800 shrink-0 flex flex-col">
                <div className="p-6">
                    <Link to="/help" className="text-sm text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center mb-6 transition-colors">
                        ← Volver a Ayuda
                    </Link>
                    <h3 className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-4">
                        Documentación
                    </h3>
                    <nav className="space-y-1">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setFilterType(cat.id as any)}
                                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-all ${filterType === cat.id
                                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                                    : 'text-gray-700 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-slate-200'
                                    }`}
                            >
                                <div className="flex items-center">
                                    <cat.icon className={`mr-3 h-5 w-5 ${filterType === cat.id ? 'text-indigo-500' : 'text-gray-400 dark:text-slate-500'
                                        }`} />
                                    {cat.title}
                                </div>
                                {filterType === cat.id && (
                                    <ChevronRight className="h-4 w-4 text-indigo-500" />
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto p-6 border-t border-gray-100 dark:border-slate-800/50">
                    <div className="bg-indigo-50 dark:bg-indigo-500/5 rounded-xl p-4 border border-indigo-100 dark:border-indigo-500/10">
                        <p className="text-xs text-indigo-700 dark:text-indigo-400 font-medium mb-2">Pase a Producción</p>
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-300/70 mb-3 leading-relaxed">
                            Recuerda que puedes generar pases a producción directamente desde los detalles de cada ticket.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Fixed Header Content Area */}
                <div className="bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 px-8 py-6 sticky top-0 z-10">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 max-w-xl relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar en la documentación..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm text-gray-900 dark:text-white"
                            />
                        </div>
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 text-sm font-medium whitespace-nowrap active:scale-95"
                        >
                            <Plus size={18} />
                            Subir Documento
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 lg:p-12 scroll-smooth">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                    {categories.find(c => c.id === filterType)?.title}
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                                    Explora y gestiona los recursos técnicos de la empresa.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                                <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 px-2 uppercase tracking-widest">{filteredDocs.length} DOCS</span>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 animate-pulse">
                                        <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-xl mb-4"></div>
                                        <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-3/4 mb-2"></div>
                                        <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-1/2"></div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredDocs.length === 0 ? (
                            <div className="text-center py-24 bg-white dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-800">
                                <Book className="mx-auto h-16 w-16 text-gray-300 dark:text-slate-700 mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">No se han encontrado documentos</h3>
                                <p className="text-gray-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">Prueba ajustando los filtros o sube un nuevo archivo para comenzar.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredDocs.map((doc, index) => (
                                    <div
                                        key={doc.id}
                                        className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all p-6 flex flex-col"
                                    >
                                        <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-black text-gray-400 dark:text-slate-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                            {index + 1}
                                        </div>

                                        <div className="flex items-start justify-between mb-6">
                                            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:rotate-6 shadow-sm">
                                                <FileText size={28} />
                                            </div>
                                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-4">
                                                <button
                                                    onClick={() => window.open(doc.url, '_blank')}
                                                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-xl transition-colors"
                                                    title="Ver documento"
                                                >
                                                    <ExternalLink size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(doc)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-xl transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2 mb-6 flex-1">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                                                {doc.name}
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                                                {doc.description || 'Sin descripción adicional para este recurso técnico.'}
                                            </p>
                                        </div>

                                        <div className="pt-5 border-t border-gray-50 dark:border-slate-800/50 mt-auto">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">MIME TYPE</span>
                                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                    {doc.file_type.split('/')[1]?.toUpperCase() || 'FILE'}
                                                </span>
                                            </div>
                                            {doc.project_id && (
                                                <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-xl text-[10px] font-bold text-indigo-700 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-500/10">
                                                    <Layout size={14} className="opacity-70" />
                                                    <span className="truncate">VINCULADO: {(doc as any).projects?.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <UploadDocModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onSuccess={loadDocuments}
            />
        </div>
    );
}
