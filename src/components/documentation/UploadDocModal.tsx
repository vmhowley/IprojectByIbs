import { FileText, Link as LinkIcon, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { documentationService } from "../../services/documentationService";
import { projectService } from "../../services/projectService";
import { Project } from "../../types/Project";
import { Input } from "../ui/Input";

interface UploadDocModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialProjectId?: string;
}

export function UploadDocModal({ isOpen, onClose, onSuccess, initialProjectId }: UploadDocModalProps) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || '');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const data = await projectService.getAll();
            setProjects(data);
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !name.trim()) {
            toast.error('Nombre y archivo son requeridos');
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading('Subiendo documentación...');

        try {
            // 1. Upload to Storage
            const { url } = await documentationService.uploadFile(file, selectedProjectId || undefined);

            // 2. Save to DB
            await documentationService.create({
                name,
                description: description.trim() || null,
                url,
                project_id: selectedProjectId || null,
                file_type: file.type,
                file_size: file.size
            });

            toast.success('Documentación subida correctamente', { id: toastId });
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error uploading doc:', error);
            toast.error('Error al subir: ' + (error.message || 'Error desconocido'), { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-60 flex items-center justify-center">
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => !isSubmitting && onClose()}
            />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Upload size={20} className="text-indigo-600" />
                        Subir Documentación
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={isSubmitting}
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre documento <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Manual de Usuario v1.0"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px] text-sm"
                            placeholder="Describe brevemente el contenido..."
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Proyecto Vinculado (Opcional)
                        </label>
                        <div className="relative">
                            <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <select
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
                                disabled={isSubmitting || !!initialProjectId}
                            >
                                <option value="">Documentación General (Sin proyecto)</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Archivo <span className="text-red-500">*</span>
                        </label>
                        <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-colors ${file ? 'border-indigo-300 bg-indigo-50/30' : 'border-gray-200 hover:border-indigo-300'}`}>
                            <div className="space-y-1 text-center">
                                <FileText className={`mx-auto h-12 w-12 ${file ? 'text-indigo-500' : 'text-gray-400'}`} />
                                <div className="flex text-sm text-gray-600">
                                    <label className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                                        <span>{file ? 'Cambiar archivo' : 'Seleccionar archivo'}</span>
                                        <input
                                            type="file"
                                            className="sr-only"
                                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                                            disabled={isSubmitting}
                                        />
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500">
                                    {file ? file.name : 'PDF, DOCX, ZIP hasta 10MB'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !file || !name.trim()}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSubmitting ? 'Subiendo...' : 'Subir Documentación'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
