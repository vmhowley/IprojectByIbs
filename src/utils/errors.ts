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

// The database guards answer in English too; these are the ones a person can run into.
const DB_MESSAGES: [RegExp, string][] = [
  [/your organization has other members/i, 'Tu equipo actual tiene más personas. Solo puedes cambiarte de equipo si trabajas solo.'],
  [/invitation not found/i, 'La invitación ya no existe. Pide que te inviten de nuevo.'],
  [/already uses the portal of another company/i, 'Esa cuenta ya tiene acceso al portal de otra empresa.'],
  [/you cannot change your own role or client link/i, 'No puedes darte acceso a ti mismo ni cambiar tu propio rol.'],
  [/you can only link users to clients you manage/i, 'Solo puedes dar acceso a clientes que administras.'],
  [/you can only claim the domain of your own email/i, 'Solo puedes usar el dominio de tu propio correo.'],
  [/organization_invitations_organization_id_email_key/i, 'Ya invitaste a ese correo.'],
  [/organizations_email_domain_key/i, 'Otro equipo ya usa ese dominio.'],
  [/organization_invitations_email_check/i, 'Ese correo no es válido.'],
  // Staff register (Personal)
  [/falls outside the employment dates/i, 'La ausencia cae fuera del empleo: antes del ingreso o después de la salida.'],
  [/overlaps another absence/i, 'Se cruza con otra ausencia de esa persona. Cambia las fechas o edita la otra.'],
  [/employee_absences_hours_one_day/i, 'Un permiso por horas es de un solo día.'],
  [/employees_one_per_account/i, 'Esa cuenta ya está vinculada a otra persona del registro.'],
  [/employees_exit_after_hire/i, 'La salida no puede ser antes del ingreso.'],
  [/employees_opening_after_hire/i, 'El día del saldo inicial no puede ser antes del ingreso.'],
  [/hr_holidays_one_per_day/i, 'Ya hay un feriado ese día.'],
  [/row-level security policy for table "(employees|employee_absences|hr_settings|hr_holidays)"/i, 'Solo los administradores del equipo cambian el registro de personal, y solo con cuentas del equipo.'],
  [/(could not find|does not exist).*(employees|employee_absences|hr_settings|hr_holidays|my_leave_record)/i, 'El registro de personal aún no está activado. Falta aplicar su actualización en la base de datos.'],
];

/** errorMessage for the database, with the guards' English answers in Spanish. */
export function dbErrorMessage(error: unknown, fallback: string): string {
  const message = errorMessage(error, '');
  const known = DB_MESSAGES.find(([pattern]) => pattern.test(message));
  return known ? known[1] : message || fallback;
}

/** The database error code of anything thrown, e.g. "23503" for a row still in use. */
export function errorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String((error as { code: unknown }).code);
  }
  return undefined;
}
