import { Comment } from '../types';
import { handleSupabaseResponse, supabase } from './api';
import { notificationService } from './notificationService';

export const commentService = {
  async getByTicket(ticketId: string): Promise<Comment[]> {
    return handleSupabaseResponse(
      supabase
        .from('comments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })
    );
  },



// ...

  async create(comment: { ticket_id: string; user_name: string; content: string; user_avatar?: string }): Promise<Comment> {
    const newComment = await handleSupabaseResponse<Comment>(
      supabase
        .from('comments')
        .insert([comment])
        .select()
        .single()
    );

    // Notification Logic: Notify Assignee and Creator
    try {
        const { data: ticket } = await supabase
            .from('tickets')
            .select('id, ticket_number, subject, assigned_to, created_by')
            .eq('id', comment.ticket_id)
            .single();

        if (ticket) {
            const { data: { user } } = await supabase.auth.getUser();
            const currentUserId = user?.id;

            const recipients = new Set<string>();
            if (ticket.assigned_to && ticket.assigned_to !== currentUserId) recipients.add(ticket.assigned_to);
            if (ticket.created_by && ticket.created_by !== currentUserId) recipients.add(ticket.created_by);

            recipients.forEach(userId => {
                notificationService.create(
                    userId,
                    'Nuevo Comentario',
                    `${comment.user_name} comentó en #${ticket.ticket_number}: ${ticket.subject || 'Sin asunto'}`,
                    'comment',
                    `/ticket/${ticket.id}`
                );
            });
        }
    } catch (err) {
        console.error('Error sending comment notification', err);
    }

    return newComment;
  },

  async update(id: string, content: string): Promise<Comment> {
    return handleSupabaseResponse(
      supabase
        .from('comments')
        .update({ content })
        .eq('id', id)
        .select()
        .single()
    );
  },

  async delete(id: string): Promise<void> {
    await handleSupabaseResponse(
      supabase
        .from('comments')
        .delete()
        .eq('id', id)
    );
  }
};
