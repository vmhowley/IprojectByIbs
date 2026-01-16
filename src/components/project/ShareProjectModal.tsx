import { Share2, Trash2, UserPlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSubscription } from '../../hooks/useSubscription';
import { ProjectMember, memberService } from '../../services/memberService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface ShareProjectModalProps {
    projectId: string;
    projectName: string;
    onClose: () => void;
}

export function ShareProjectModal({ projectId, projectName, onClose }: ShareProjectModalProps) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'viewer' | 'editor'>('viewer');
    const [members, setMembers] = useState<ProjectMember[]>([]);
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
        }
    };

    const { isPro, limits } = useSubscription();

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();

        // Enforce Plan Limits
        if (!isPro && members.length >= limits.maxMembers) {
            alert(`Has alcanzado el límite de ${limits.maxMembers} colaboradores en el plan Gratis.\n\nActualiza a Business para colaboradores ilimitados.`);
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await memberService.addMember(projectId, email, role);
            setEmail('');
            await loadMembers();
        } catch (err: any) {
            setError(err.message === 'User not found' ? 'Usuario no encontrado' : 'Error al invitar usuario');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemove = async (memberId: string) => {
        if (!confirm('¿Estás seguro de eliminar a este usuario?')) return;
        try {
            await memberService.removeMember(memberId);
            setMembers(members.filter(m => m.id !== memberId));
        } catch (err) {
            console.error('Error removing member', err);
        }
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-slate-800">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Share2 size={20} className="text-gray-500 dark:text-slate-400" />
                        Compartir "{projectName}"
                    </h2>
                    <button onClick={onClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4">
                    <form onSubmit={handleInvite} className="space-y-4 mb-6">
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Input
                                    type="email"
                                    placeholder="Email del usuario"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <Select
                                value={role}
                                onChange={(e) => setRole(e.target.value as 'viewer' | 'editor')}
                                className="w-32"
                                options={[
                                    { value: 'viewer', label: 'Lector' },
                                    { value: 'editor', label: 'Editor' },
                                ]}
                            />
                        </div>
                        {error && <p className="text-red-500 dark:text-red-400 text-xs">{error}</p>}

                        <Button type="submit" isLoading={isLoading} className="w-full">
                            <UserPlus size={16} className="mr-2" />
                            Invitar
                        </Button>
                    </form>

                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wider">
                            Miembros del proyecto
                        </h3>

                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                            {members.length === 0 ? (
                                <p className="text-sm text-gray-500 dark:text-slate-500 italic">No hay miembros compartidos.</p>
                            ) : (
                                members.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800/50">
                                                {member.user?.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{member.user?.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-slate-400">{member.role === 'editor' ? 'Puede editar' : 'Solo lectura'}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemove(member.id)}
                                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
