import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { AuthShell } from '../components/auth/AuthShell';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { authService } from '../services/authService';

export function UpdatePassword() {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) return;
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setLoading(true);
        try {
            await authService.updatePassword(password);
            toast.success('Contraseña actualizada');
            navigate('/');
        } catch (error) {
            console.error(error);
            setError('No se pudo actualizar la contraseña. Pide un enlace nuevo e inténtalo otra vez.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell title="Nueva contraseña" subtitle="Escribe la contraseña que usarás desde ahora.">
            <form className="space-y-4" onSubmit={handleSubmit}>
                <Input
                    label="Nueva contraseña"
                    type="password"
                    required
                    autoComplete="new-password"
                    autoFocus
                    hint="Mínimo 6 caracteres."
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                    }}
                    minLength={6}
                    error={error || undefined}
                    disabled={loading}
                />
                <Button type="submit" size="lg" className="w-full" isLoading={loading}>
                    Guardar contraseña
                </Button>
            </form>
        </AuthShell>
    );
}
