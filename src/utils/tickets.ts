// Tickets have no stored number. The team refers to them by their position in
// the project, so "12/37" is the 12th ticket opened out of 37.

interface Numberable {
  id: string;
  project_id: string;
  created_at: string;
}

export interface TicketSequence {
  number: number;
  total: number;
}

/** Position of every ticket inside its project, oldest first. */
export function ticketSequence(tickets: Numberable[]): Map<string, TicketSequence> {
  const byProject = new Map<string, Numberable[]>();
  for (const ticket of tickets) {
    const list = byProject.get(ticket.project_id) || [];
    list.push(ticket);
    byProject.set(ticket.project_id, list);
  }
  const result = new Map<string, TicketSequence>();
  for (const list of byProject.values()) {
    const sorted = [...list].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
    sorted.forEach((ticket, index) => result.set(ticket.id, { number: index + 1, total: sorted.length }));
  }
  return result;
}

export function formatSequence(sequence: TicketSequence | undefined): string {
  return sequence ? `${sequence.number}/${sequence.total}` : '';
}

/** The line a person reads first: the subject, else the start of the description. */
export function ticketTitle(ticket: { subject?: string | null; description?: string | null }): string {
  const subject = ticket.subject?.trim();
  if (subject) return subject;
  const firstLine = ticket.description?.trim().split('\n')[0]?.trim();
  if (firstLine) return firstLine.length > 90 ? `${firstLine.slice(0, 87)}…` : firstLine;
  return 'Ticket sin asunto';
}

/** Lowercase without accents, for search that forgives "analisis" for "análisis". */
export function normalizeText(value: string | null | undefined): string {
  return (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
