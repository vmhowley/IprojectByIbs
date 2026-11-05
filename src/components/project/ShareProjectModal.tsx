import { Trash2, UserPlus } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../hooks/useSubscription';
import { ProjectMember, memberService } from '../../services/memberService';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { confirmDialog } from '../ui/ConfirmDialog';
import { Modal } from '../ui/Modal';
import { errorMessage } from '../../utils/errors';

interface ShareProjectModalProps {
    projectId: string;
    projectName: string;
    onClose: () => void;
}

/** Who else works on this project, and with what rights. */
export function ShareProjectModal({ projectId, projectName, onClose }: ShareProjectModalProps) {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'viewer' | 'editor'>('viewer');
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadMembers();
    }, []);

    const loadMembers = async () => {
        try {
            const data = await memberService.getMembers(projectId);
            setMembers(data);
        } catch (err) {
            console.error('Failed to load members', err);
        } finally {
            setLoadingMembers(false);
        }
    };

    const { isPro, limits } = useSubscription();

    const handleInvite = async (e: FormEvent) => {
        e.preventDefault();

        // Enforce Plan Limits
        if (!isPro && members.length >= limits.maxMembers) {
            const upgrade = await confirmDialog({
                title: 'Llegaste al límite del plan Gratis',
                message: `El plan Gratis permite ${limits.maxMembers} colaboradores por proyecto. Con Pro no hay límite.`,
                confirmText: 'Ver planes',
                cancelText: 'Ahora no',
                tone: 'primary',
            });
            if (upgrade) {
                onClose();
                navigate('/pricing');
            }
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await memberService.addMember(projectId, email, role);
            toast.success(`${email} ahora tiene acceso`);
            setEmail('');
            await loadMembers();
        } catch (err) {
            setError(errorMessage(err, '') === 'User not found'
                ? 'No hay ninguna cuenta con ese correo. La persona debe registrarse primero.'
                : 'No se pudo invitar. Inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemove = async (member: ProjectMember) => {
        const ok = await confirmDialog({
            title: 'Quitar acceso',
            message: `${member.user?.name || 'Esta persona'} dejará de ver «${projectName}».`,
            confirmText: 'Quitar acceso',
        });
        if (!ok) return;
        try {
            await memberService.removeMember(member.id);
            setMembers(members.filter(m => m.id !== member.id));
        } catch (err) {
            console.error('Error removing member', err);
            toast.error('No se pudo quitar el acceso.');
        }
    };

    return (
        <Modal isOpen onClose={onClose} size="md" title="Miembros del proyecto" description={projectName}>
            <form onSubmit={handleInvite} className="space-y-2">
                <label htmlFor="share-email" className="caption block">Invitar por correo</label>
                <div className="flex gap-2">
                    <input
                        id="share-email"
                        type="email"
                        placeholder="nombre@empresa.com.do"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? 'share-error' : undefined}
                        className="field min-w-0 flex-1"
                        required
                    />
                    <label htmlFor="share-role" className="sr-only">Permiso</label>
                    <select
                        id="share-role"
                        value={role}
                        onChange={(e) => setRole(e.target.value as 'viewer' | 'editor')}
                        className="field w-28 shrink-0"
                    >
                        <option value="viewer">Lector</option>
                        <option value="editor">Editor</option>
                    </select>
                    <Button type="submit" isLoading={isLoading} className="shrink-0">
                        {!isLoading && <UserPlus size={16} aria-hidden="true" />}
                        Invitar
                    </Button>
                </div>
                {error && <p id="share-error" className="text-[13px] font-medium text-st-red">{error}</p>}
            </form>

            <h3 className="caption mt-6">Con acceso</h3>
            <ul className="mt-2 divide-y divide-rule rounded-control border border-rule">
                {loadingMembers ? (
                    <li className="px-3 py-3 text-sm text-ink-3">Cargando…</li>
                ) : members.length === 0 ? (
                    <li className="px-3 py-3 text-sm text-ink-3">Nadie más tiene acceso todavía. El equipo de tu dominio ya ve el proyecto.</li>
                ) : (
                    members.map((member) => (
                        <li key={member.id} className="flex items-center gap-3 px-3 py-2">
                            <Avatar name={member.user?.name} src={member.user?.avatar} size="sm" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-ink">{member.user?.name}</p>
                                <p className="truncate text-xs text-ink-3">
                                    {member.user?.email} · {member.role === 'editor' ? 'puede editar' : 'solo lectura'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemove(member)}
                                aria-label={`Quitar acceso a ${member.user?.name}`}
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-ink-3 hover:bg-st-red/10 hover:text-st-red"
                            >
                                <Trash2 size={15} />
                            </button>
                        </li>
                    ))
                )}
            </ul>
        </Modal>
    );
}
