import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Calendar, User, Tag, AlertCircle, Trash2, Edit, Paperclip, Download } from 'lucide-react';
import { Ticket, Comment } from '../types';
import { ticketService } from '../services/ticketService';
import { commentService } from '../services/commentService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { supabase } from '../lib/supabase';

export function TicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (ticketId) {
      loadTicket();
      loadComments();
      subscribeToComments();
    }
  }, [ticketId]);

  const loadTicket = async () => {
    try {
      const data = await ticketService.getById(ticketId!);
      setTicket(data);
    } catch (error) {
      console.error('Error loading ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const data = await commentService.getByTicket(ticketId!);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const subscribeToComments = () => {
    const subscription = supabase
      .channel(`ticket_comments_${ticketId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `ticket_id=eq.${ticketId}`
      }, () => {
        loadComments();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleStatusChange = async (newStatus: Ticket['status']) => {
    if (!ticket) return;

    try {
      const updated = await ticketService.updateStatus(ticket.id, newStatus);
      setTicket(updated);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !ticketId) return;

    setSubmittingComment(true);
    try {
      await commentService.create({
        ticket_id: ticketId,
        user_name: 'Guest User',
        content: newComment
      });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!ticket || !confirm('Are you sure you want to delete this ticket?')) return;

    try {
      await ticketService.delete(ticket.id);
      navigate(`/project/${ticket.project_id}`);
    } catch (error) {
      console.error('Error deleting ticket:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-600">Ticket not found</div>
      </div>
    );
  }

  const priorityColors = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700'
  };

  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'done', label: 'Done' }
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link to="/" className="hover:text-gray-900">Projects</Link>
          <ChevronRight size={16} />
          <Link to={`/project/${ticket.project_id}`} className="hover:text-gray-900">
            Project
          </Link>
          <ChevronRight size={16} />
          <span className="text-gray-900 font-medium">{ticket.ticket_number}</span>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <Card>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                    {ticket.title}
                  </h1>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 font-mono">
                      {ticket.ticket_number}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${priorityColors[ticket.urgency]}`}>
                      {ticket.urgency}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit size={16} />
                  </Button>
                  <Button variant="danger" size="sm" onClick={handleDeleteTicket}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {ticket.description || 'No description provided.'}
                </p>
              </div>

              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Attachments ({ticket.attachments.length})
                  </h3>
                  <div className="space-y-2">
                    {ticket.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">
                              {attachment.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(attachment.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <Download className="w-4 h-4 text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  Comments ({comments.length})
                </h3>

                <div className="space-y-4 mb-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium flex-shrink-0">
                        {comment.user_name[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {comment.user_name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || submittingComment}
                  >
                    {submittingComment ? 'Adding...' : 'Add Comment'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Details</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-2">
                    Status
                  </label>
                  <Select
                    options={statusOptions}
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(e.target.value as Ticket['status'])}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 flex items-center gap-2 mb-2">
                    <User size={14} />
                    Assigned To
                  </label>
                  <p className="text-sm text-gray-900">
                    {ticket.assigned_to || 'Unassigned'}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 flex items-center gap-2 mb-2">
                    <Calendar size={14} />
                    Created
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </p>
                </div>

                {ticket.deadline && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 flex items-center gap-2 mb-2">
                      <AlertCircle size={14} />
                      Deadline
                    </label>
                    <p className="text-sm text-gray-900">
                      {new Date(ticket.deadline).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {ticket.tags && ticket.tags.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 flex items-center gap-2 mb-2">
                      <Tag size={14} />
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {ticket.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
