export * from './Auth';
export * from './ChatMessage';
export * from './Client';
export * from './Comment';
export * from './meeting';
export * from './Project';
export * from './Subscription';
export * from './Ticket';
export * from './User';


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
