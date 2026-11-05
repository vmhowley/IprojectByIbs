import { FormEvent, useState } from 'react';
import toast from 'react-hot-toast'; // Assuming react-toastify for toast messages
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthShell, GoogleMark } from '../components/auth/AuthShell';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { authErrorMessage } from '../utils/errors';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/dashboard';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isResetMode) {
        await authService.resetPassword(email);
        toast.success('Te enviamos un correo para restablecer tu contraseña.');
        setIsResetMode(false);
      } else {
        await login({ email, password });
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(authErrorMessage(err, isResetMode ? 'No se pudo enviar el correo de restablecimiento.' : 'No se pudo iniciar sesión.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError('');
    setLoading(true);

    try {
      await loginWithGoogle();
      // Redirect will happen automatically
    } catch (err) {
      setError(authErrorMessage(err, 'No se pudo iniciar sesión con Google.'));
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={isResetMode ? 'Restablecer contraseña' : 'Iniciar sesión'}
      subtitle={isResetMode ? 'Escribe tu correo y te enviamos un enlace para crear una nueva.' : 'Entra para ver tus proyectos y clientes.'}
      footer={
        isResetMode ? (
          <button
            type="button"
            onClick={() => {
              setIsResetMode(false);
              setError('');
            }}
            className="font-semibold text-ink underline-offset-2 hover:underline"
          >
            Volver a iniciar sesión
          </button>
        ) : (
          <>
            ¿No tienes una cuenta?{' '}
            <Link to="/register" className="font-semibold text-ink underline-offset-2 hover:underline">
              Crear una
            </Link>
          </>
        )
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Correo"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          autoFocus
          placeholder="nombre@empresa.com"
          disabled={loading}
        />

        {!isResetMode && (
          <div>
            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => {
                setIsResetMode(true);
                setError('');
              }}
              className="mt-1.5 text-[13px] font-medium text-ink-2 underline-offset-2 hover:text-ink hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-control border border-st-red/40 bg-st-red/[0.06] px-3 py-2 text-sm text-st-red">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" isLoading={loading}>
          {isResetMode ? 'Enviar enlace' : 'Iniciar sesión'}
        </Button>
      </form>

      {!isResetMode && (
        <>
          <div className="my-5 flex items-center gap-3 text-xs text-ink-3" aria-hidden="true">
            <span className="h-px flex-1 bg-rule" />o<span className="h-px flex-1 bg-rule" />
          </div>
          <Button type="button" variant="secondary" size="lg" className="w-full" onClick={handleGoogleLogin} disabled={loading}>
            <GoogleMark className="h-[18px] w-[18px]" />
            Continuar con Google
          </Button>
        </>
      )}
    </AuthShell>
  );
}
