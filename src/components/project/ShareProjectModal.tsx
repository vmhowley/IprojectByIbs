import { Share2, Trash2, UserPlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ProjectMember, memberService } from '../../services/memberService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

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

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
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

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Share2 size={20} className="text-gray-500" />
                        Compartir "{projectName}"
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
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
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as 'viewer' | 'editor')}
                                className="rounded-md border border-gray-300 text-sm px-2 focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="viewer">Lector</option>
                                <option value="editor">Editor</option>
                            </select>
                        </div>
                        {error && <p className="text-red-500 text-xs">{error}</p>}

                        <Button type="submit" isLoading={isLoading} className="w-full">
                            <UserPlus size={16} className="mr-2" />
                            Invitar
                        </Button>
                    </form>

                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Miembros del proyecto
                        </h3>

                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            {members.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">No hay miembros compartidos.</p>
                            ) : (
                                members.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                                {member.user?.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{member.user?.name}</p>
                                                <p className="text-xs text-gray-500">{member.role === 'editor' ? 'Puede editar' : 'Solo lectura'}</p>
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
        </div>
    );
}
