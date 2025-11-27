export * from './Ticket';
export * from './Project';
export * from './User';
export * from './Comment';

export interface TicketProgram {
  id: string;
  ticket_id: string;
  object_name: string;
  object_type: string;
  attribute: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}
