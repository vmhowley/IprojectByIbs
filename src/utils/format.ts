// Formatting shared by every screen: one money format, one date format.

const moneyFormatters = new Map<string, Intl.NumberFormat>();

/** "US$12,500.00", "RD$950,000.00". Unknown codes fall back to "EUR 1,000.00". */
export function formatMoney(amount: number, currency: string | null | undefined = 'USD'): string {
  const code = (currency || 'USD').toUpperCase();
  let formatter = moneyFormatters.get(code);
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat('es-DO', { style: 'currency', currency: code });
    } catch {
      formatter = new Intl.NumberFormat('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    moneyFormatters.set(code, formatter);
  }
  return formatter.format(amount);
}

/** Currencies in the order every table shows them. */
export const CURRENCY_ORDER = ['USD', 'DOP'];

export function sortCurrencies(codes: string[]): string[] {
  return [...codes].sort((a, b) => {
    const ia = CURRENCY_ORDER.indexOf(a);
    const ib = CURRENCY_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

/** Adds amounts per currency. Different currencies are never added together. */
export function sumByCurrency<T>(
  items: T[],
  pick: (item: T) => { amount?: number | null; currency?: string | null }
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const item of items) {
    const { amount, currency } = pick(item);
    if (amount === null || amount === undefined || Number.isNaN(Number(amount))) continue;
    const code = (currency || 'USD').toUpperCase();
    totals[code] = (totals[code] || 0) + Number(amount);
  }
  return totals;
}

/**
 * Parses dates from the database. Date-only strings ("2026-11-05") are read as
 * local dates, so a deadline does not move to the previous day in UTC-4.
 * Ticket deadlines are stored as midnight UTC of the chosen day
 * ("2026-11-05T00:00:00+00:00"); those are read as that same calendar day.
 */
export function parseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const dateOnly =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) ||
    /^(\d{4})-(\d{2})-(\d{2})[T ]00:00:00(?:\.0+)?(?:Z|\+00(?::?00)?)$/.exec(value);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "YYYY-MM-DD" for an <input type="date">, from any stored date. */
export function toDateInputValue(value: string | Date | null | undefined): string {
  const date = parseDate(value);
  if (!date) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Stores a chosen day the way deadlines are kept: midnight UTC of that day. */
export function dateInputToDeadline(value: string): string | null {
  return value ? `${value}T00:00:00.000Z` : null;
}

const shortDate = new Intl.DateTimeFormat('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' });
const dayMonth = new Intl.DateTimeFormat('es-DO', { day: 'numeric', month: 'short' });
const longDate = new Intl.DateTimeFormat('es-DO', { day: 'numeric', month: 'long', year: 'numeric' });
const dateTime = new Intl.DateTimeFormat('es-DO', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
});
const timeOnly = new Intl.DateTimeFormat('es-DO', { hour: 'numeric', minute: '2-digit' });

export type DateStyle = 'short' | 'day' | 'long' | 'datetime' | 'time';

/** "04/11/2026" (short), "4 nov" (day), "4 de noviembre de 2026" (long). */
export function formatDate(value: string | Date | null | undefined, style: DateStyle = 'short'): string {
  const date = parseDate(value);
  if (!date) return '';
  switch (style) {
    case 'day':
      return dayMonth.format(date).replace('.', '');
    case 'long':
      return longDate.format(date);
    case 'datetime':
      return dateTime.format(date).replace('.', '');
    case 'time':
      return timeOnly.format(date);
    default:
      return shortDate.format(date);
  }
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Whole days from today to the date: 0 today, 1 tomorrow, -1 yesterday. */
export function daysFromToday(value: string | Date | null | undefined): number | null {
  const date = parseDate(value);
  if (!date) return null;
  const ms = startOfDay(date).getTime() - startOfDay(new Date()).getTime();
  return Math.round(ms / 86_400_000);
}

/** "hoy", "mañana", "en 3 días", "hace 2 días", or the date past a week. */
export function relativeDay(value: string | Date | null | undefined): string {
  const days = daysFromToday(value);
  if (days === null) return '';
  if (days === 0) return 'hoy';
  if (days === 1) return 'mañana';
  if (days === -1) return 'ayer';
  if (days > 1 && days <= 7) return `en ${days} días`;
  if (days < -1 && days >= -7) return `hace ${-days} días`;
  return formatDate(value, 'day');
}

/** "hace 5 min", "hace 3 h", then the date. */
export function timeAgo(value: string | Date | null | undefined): string {
  const date = parseDate(value);
  if (!date) return '';
  const minutes = Math.round((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return days === 1 ? 'ayer' : `hace ${days} días`;
  return formatDate(date, 'day');
}

const FINISHED = new Set(['completed', 'done', 'approved_closed', 'cancelled', 'archived']);

export function isFinished(status: string | null | undefined): boolean {
  return !!status && FINISHED.has(status);
}

/** A deadline that passed while the work is still open. */
export function isOverdue(deadline: string | null | undefined, status?: string | null): boolean {
  const days = daysFromToday(deadline);
  return days !== null && days < 0 && !isFinished(status);
}

/** Initials for avatars: "Ana María Pérez" -> "AP". */
export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** "820 B", "14.2 KB", "3.1 MB". */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || Number.isNaN(Number(bytes))) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Office and OpenDocument MIME subtypes are too long for a column.
const MIME_KINDS: Record<string, string> = {
  msword: 'DOC',
  'vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'vnd.ms-excel': 'XLS',
  'vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'vnd.ms-powerpoint': 'PPT',
  'vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'vnd.oasis.opendocument.text': 'ODT',
  'vnd.oasis.opendocument.spreadsheet': 'ODS',
  'vnd.oasis.opendocument.presentation': 'ODP',
  plain: 'TXT',
  'x-zip-compressed': 'ZIP',
};

/** Short file kind for a column: "PDF", "DOCX", from the name or URL, else the MIME subtype. */
export function fileKind(nameOrUrl: string | null | undefined, mime?: string | null): string {
  const path = (nameOrUrl || '').split('?')[0].split('#')[0];
  const ext = path.includes('.') ? path.split('.').pop() || '' : '';
  if (ext && ext.length <= 5 && !ext.includes('/')) return ext.toUpperCase();
  const sub = (mime || '').split('/')[1] || '';
  if (MIME_KINDS[sub]) return MIME_KINDS[sub];
  return sub && sub.length <= 6 ? sub.toUpperCase() : 'ARCHIVO';
}
