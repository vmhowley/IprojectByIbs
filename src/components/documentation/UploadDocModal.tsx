import { FileText, Lock, Upload } from "lucide-react";
import { DragEvent, FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { usePermissions } from "../../hooks/usePermissions";
import { cn } from "../../lib/utils";
import { documentationService } from "../../services/documentationService";
import { projectService } from "../../services/projectService";
import { Project } from "../../types/Project";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";
import { errorMessage } from "../../utils/errors";

interface UploadDocModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialProjectId?: string;
}

/** File a manual, specification or guide in the archive, alone or with a project. */
export function UploadDocModal({ isOpen, onClose, onSuccess, initialProjectId }: UploadDocModalProps) {
    const { isAdmin } = usePermissions();
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || '');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [dragging, setDragging] = useState(false);
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

    const pickFile = (picked: File | null) => {
        setFile(picked);
        // Suggest a name from the file so the common case is one click.
        if (picked && !name.trim()) setName(picked.name.replace(/\.[^.]+$/, ''));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!file || !name.trim()) {
            toast.error('Pon un nombre y elige el archivo.');
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading('Subiendo documento…');

        try {
            // 1. Upload to Storage
            const { url } = await documentationService.uploadFile(file, selectedProjectId || undefined);

            // 2. Save to DB
            await documentationService.create({
                name: name.trim(),
                description: description.trim() || null,
                url,
                project_id: selectedProjectId || null,
                file_type: file.type,
                file_size: file.size
            });

            toast.success('Documento archivado', { id: toastId });
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error uploading doc:', error);
            toast.error('No se pudo subir: ' + errorMessage(error, 'error desconocido'), { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const onDrop = (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        setDragging(false);
        pickFile(event.dataTransfer.files?.[0] || null);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            dismissible={!isSubmitting}
            size="md"
            title="Subir documento"
            description="Manuales, especificaciones y guías técnicas."
            footer={
                <>
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button type="submit" form="upload-doc-form" isLoading={isSubmitting} disabled={!file || !name.trim()}>
                        Subir documento
                    </Button>
                </>
            }
        >
            <form id="upload-doc-form" onSubmit={handleSubmit} className="space-y-4">
                <label
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    className={cn(
                        'flex cursor-pointer flex-col items-center gap-1 rounded-control border border-dashed px-4 py-5 text-center transition-colors focus-within:border-focus',
                        dragging ? 'border-ink bg-well' : file ? 'border-ink/50 bg-well/60' : 'border-rule-strong/60 hover:border-ink/60 hover:bg-well/60'
                    )}
                >
                    <input
                        type="file"
                        className="sr-only"
                        onChange={(e) => pickFile(e.target.files?.[0] || null)}
                        disabled={isSubmitting}
                    />
                    {file ? <FileText size={20} aria-hidden="true" className="text-ink-2" /> : <Upload size={20} aria-hidden="true" className="text-ink-3" />}
                    <span className="text-sm text-ink">
                        {file ? (
                            <>
                                <span className="font-semibold">{file.name}</span>{' '}
                                <span className="text-ink-3">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                            </>
                        ) : (
                            <><span className="font-semibold underline decoration-rule-strong">Elige un archivo</span> o arrástralo aquí</>
                        )}
                    </span>
                    <span className="text-xs text-ink-3">{file ? 'Haz clic para cambiarlo' : 'PDF, DOCX o ZIP, hasta 10 MB'}</span>
                </label>

                <Input
                    label="Nombre"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej.: Manual de usuario v1.0"
                    required
                    disabled={isSubmitting}
                />

                <Textarea
                    label="Descripción"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="De qué trata y para quién es"
                    rows={3}
                    disabled={isSubmitting}
                />

                <Select
                    label="Proyecto"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    disabled={isSubmitting || !!initialProjectId}
                    hint={initialProjectId ? 'Se archiva en este proyecto.' : 'Déjalo vacío para documentación general.'}
                >
                    <option value="">Documentación general (sin proyecto)</option>
                    {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </Select>

                {/* Documents are open to the whole team; prices are not. */}
                {isAdmin() && (
                    <p className="flex items-start gap-1.5 text-xs text-ink-3">
                        <Lock size={13} aria-hidden="true" className="mt-0.5 shrink-0" />
                        ¿Es una cotización? Súbela en el proyecto, en Cotización: allí solo la ven los administradores.
                    </p>
                )}
            </form>
        </Modal>
    );
}
