/** The message of anything thrown, or the fallback when it has none. */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}

// Supabase Auth answers in English; these are the answers people actually get.
const AUTH_MESSAGES: [RegExp, string][] = [
  [/invalid login credentials/i, 'Correo o contraseña incorrectos.'],
  [/email not confirmed/i, 'Confirma tu correo antes de entrar: revisa tu bandeja de entrada.'],
  [/already registered|already been registered/i, 'Ya existe una cuenta con ese correo. Inicia sesión.'],
  [/password should be at least/i, 'La contraseña debe tener al menos 6 caracteres.'],
  [/rate limit|too many requests/i, 'Demasiados intentos. Espera un momento y vuelve a intentarlo.'],
  [/unable to validate email|invalid email/i, 'Ese correo no es válido.'],
  [/failed to fetch|networkerror/i, 'No hay conexión con el servidor. Revisa tu internet.'],
];

/** errorMessage for sign-in and sign-up, with Supabase's English answers in Spanish. */
export function authErrorMessage(error: unknown, fallback: string): string {
  const message = errorMessage(error, '');
  const known = AUTH_MESSAGES.find(([pattern]) => pattern.test(message));
  return known ? known[1] : message || fallback;
}

/** The database error code of anything thrown, e.g. "23503" for a row still in use. */
export function errorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String((error as { code: unknown }).code);
  }
  return undefined;
}
