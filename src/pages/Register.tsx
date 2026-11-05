import { MailCheck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthShell } from '../components/auth/AuthShell';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { authErrorMessage } from '../utils/errors';

export function Register() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      await signUp({ name, email, password, company });
      setNeedsConfirmation(true);
    } catch (err) {
      setError(authErrorMessage(err, 'No se pudo crear la cuenta.'));
    } finally {
      setLoading(false);
    }
  }

  if (needsConfirmation) {
    return (
      <AuthShell title="Revisa tu correo" subtitle={<>Enviamos un enlace de confirmación a <strong className="font-semibold text-ink">{email}</strong>.</>}>
        <div className="flex items-start gap-3 rounded-control border border-rule bg-well p-3 text-sm text-ink-2">
          <MailCheck size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-st-green" />
          <p>Abre el enlace para activar tu cuenta y luego inicia sesión. Si no lo ves, revisa la carpeta de correo no deseado.</p>
        </div>
        <Link
          to="/login"
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-control border border-brand bg-brand px-4 text-[15px] font-semibold text-on-brand hover:border-brand-strong hover:bg-brand-strong"
        >
          Ir a iniciar sesión
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Gratis hasta 3 proyectos y 3 clientes. Sin tarjeta."
      footer={
        <>
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="font-semibold text-ink underline-offset-2 hover:underline">
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="María Rodríguez"
          autoComplete="name"
          required
          autoFocus
          disabled={loading}
        />
        <Input
          label="Empresa"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Rodríguez & Asociados"
          autoComplete="organization"
          hint="El nombre de tu equipo en ibPulse. Opcional; si te invitaron, entrarás al equipo que te invitó."
          maxLength={120}
          disabled={loading}
        />
        <Input
          label="Correo de trabajo"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nombre@empresa.com"
          autoComplete="email"
          hint="Si tu empresa ya usa ibPulse con este dominio, entrarás a su equipo."
          required
          disabled={loading}
        />
        <Input
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          hint="Mínimo 6 caracteres."
          required
          minLength={6}
          disabled={loading}
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={6}
          disabled={loading}
        />

        {error && (
          <p role="alert" className="rounded-control border border-st-red/40 bg-st-red/[0.06] px-3 py-2 text-sm text-st-red">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" isLoading={loading}>
          Crear cuenta
        </Button>
      </form>
    </AuthShell>
  );
}
