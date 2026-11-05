import { Check, CheckSquare, Download, ExternalLink, FileText, MessageSquare, Paperclip, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { commentService } from '../../services/commentService';
import { documentService } from '../../services/documentService';
import { programService } from '../../services/programService';
import { projectService } from '../../services/projectService';
import { requestTypeService, TicketRequestType } from '../../services/requestTypeService';
import { storageService } from '../../services/storageService';
import { subtaskService } from '../../services/subtaskService';
import { ticketService } from '../../services/ticketService';
import { getUsers } from '../../services/usersService';
import { Comment, Project, Subtask, Ticket, TicketProgram, UserProfile } from '../../types';
import { confirmAction } from '../../utils/confirmationToast';
import { dateInputToDeadline, formatDate, isOverdue, relativeDay, timeAgo, toDateInputValue } from '../../utils/format';
import { formatSequence, ticketSequence } from '../../utils/tickets';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { ModernSelect } from '../ui/ModernSelect';
import { UrgencyBadge } from '../ui/UrgencyBadge';
import { Skeleton } from '../ui/Skeleton';
import { StatusBadge } from '../ui/StatusBadge';
import { UserPicker } from '../ui/UserPicker';

/** Grows a textarea to the height of its text, so nothing hides past its edge. */
function fitToContent(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
}

interface TicketDetailViewProps {
  ticketId: string;
  onClose?: () => void;
  onDelete?: (id: string) => void;
  onUpdate?: (ticket: Ticket) => void;
  /** "panel": drawer next to the project; "page": the ticket's own page. */
  variant?: 'panel' | 'page';
}

// The route every ticket follows. "done" counts as the last step.
const ROUTE: { status: Ticket['status']; label: string }[] = [
  { status: 'pending_analysis', label: 'Análisis' },
  { status: 'pending_approval', label: 'Aprobación del cliente' },
  { status: 'approved', label: 'Aprobado' },
  { status: 'ongoing', label: 'En desarrollo' },
  { status: 'completed', label: 'Completado' },
];

// Values allowed by the tickets_priority_check constraint. Older tickets may
// still carry "minor" or "moderate"; those are shown but not offered.
const URGENCY_OPTIONS = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Crítica' },
];
const LEGACY_URGENCY: Record<string, string> = { minor: 'Menor', moderate: 'Moderada' };

const QA_OPTIONS: { value: NonNullable<Ticket['qa_status']>; label: string }[] = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'in_progress', label: 'En proceso' },
  { value: 'verified', label: 'Verificado en staging' },
  { value: 'failed', label: 'Fallido' },
];

const OBJECT_TYPES = ['RPGLE', 'SQLRPGLE', 'CLE', 'CLLE', 'DSPF', 'PRTF', 'PF', 'LF', 'SQL', 'SRVPGM', 'CMD'];

const sectionTitle = 'flex items-center gap-2 text-sm font-semibold text-ink';

/** The work order: one ticket with its route, fields, checklist, objects, files and conversation. */
export function TicketDetailView({ ticketId, onClose, onDelete, onUpdate, variant = 'panel' }: TicketDetailViewProps) {
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [siblings, setSiblings] = useState<Ticket[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [requestTypes, setRequestTypes] = useState<TicketRequestType[]>([]);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [programs, setPrograms] = useState<TicketProgram[]>([]);
  const [newProgram, setNewProgram] = useState({
    object_name: '',
    object_type: '',
    attribute: '',
    description: ''
  });
  const [addingProgram, setAddingProgram] = useState(false);
  const [savingProgram, setSavingProgram] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stampKey, setStampKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const subjectRef = useRef<HTMLTextAreaElement>(null);
  // Last version confirmed by the server, so leaving a field unchanged saves nothing.
  const savedRef = useRef<Ticket | null>(null);

  const applyServerTicket = (updated: Ticket) => {
    savedRef.current = updated;
    setTicket(updated);
    if (onUpdate) onUpdate(updated);
  };

  // Subtasks state
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);

  // People linked to a client read the order; only the team edits it.
  const readOnly = !!user?.client_id;

  // The subject wraps instead of hiding its end: the box grows with the text and with the panel width.
  useLayoutEffect(() => fitToContent(subjectRef.current), [ticket?.subject]);
  useEffect(() => {
    const box = subjectRef.current?.parentElement;
    if (!box || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => fitToContent(subjectRef.current));
    observer.observe(box);
    return () => observer.disconnect();
  }, [ticket?.id, loading]);

  useEffect(() => {
    loadUsers();
    requestTypeService.getAll().then(setRequestTypes).catch((err) => console.error('Error loading request types', err));
  }, []);

  const loadUsers = async () => {
    try {
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleUpdateTicket = async (updates: Partial<Ticket>, message = 'Ticket actualizado') => {
    if (!ticket) return;
    const saved = savedRef.current as Record<string, unknown> | null;
    const changed = Object.entries(updates).some(
      ([key, value]) => JSON.stringify(saved?.[key] ?? null) !== JSON.stringify(value ?? null)
    );
    if (!changed) return;
    try {
      const updated = await ticketService.update(ticket.id, updates);
      applyServerTicket(updated);
      toast.success(message);
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error('No se pudo guardar el cambio. Inténtalo de nuevo.');
    }
  };

  useEffect(() => {
    if (ticketId) {
      setLoading(true);
      loadTicket();
      loadComments();
      loadPrograms();
      loadSubtasks();
      return subscribeToComments();
    }
  }, [ticketId]);

  // Keyed on project_id: editing subject/description updates `ticket` on every keystroke
  useEffect(() => {
    if (ticket?.project_id) {
      loadProject();
    }
  }, [ticket?.project_id]);

  const loadProject = async () => {
    if (!ticket?.project_id) return;
    try {
      const [data, all] = await Promise.all([
        projectService.getById(ticket.project_id),
        ticketService.getByProject(ticket.project_id),
      ]);
      setProject(data);
      setSiblings(all);
    } catch (error) {
      console.error("Error loading project", error);
    }
  };

  const loadTicket = async () => {
    try {
      const data = await ticketService.getById(ticketId);
      savedRef.current = data;
      setTicket(data);
    } catch (error) {
      console.error('Error loading ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const data = await commentService.getByTicket(ticketId);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const loadPrograms = async () => {
    try {
      const data = await programService.getByTicketId(ticketId);
      setPrograms(data);
    } catch (error) {
      console.error('Error loading programs:', error);
    }
  };

  const loadSubtasks = async () => {
    try {
      const data = await subtaskService.getByTicketId(ticketId);
      setSubtasks(data);
    } catch (error) {
      console.error('Error loading subtasks:', error);
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
      supabase.removeChannel(subscription);
    };
  };

  const handleStatusChange = async (newStatus: Ticket['status']) => {
    if (!ticket || newStatus === ticket.status) return;

    try {
      const updated = await ticketService.updateStatus(ticket.id, newStatus);
      applyServerTicket(updated);
      setStampKey((k) => k + 1);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('No se pudo cambiar el estado.');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !ticketId) return;

    setSubmittingComment(true);
    try {
      await commentService.create({
        ticket_id: ticketId,
        user_name: user?.name || user?.email || 'Usuario',
        content: newComment
      });
      setNewComment('');
      loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('No se pudo publicar el comentario.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!ticket) return;

    confirmAction({
      title: 'Eliminar ticket',
      message: `Se eliminará «${ticket.subject || 'Ticket sin asunto'}» con sus subtareas, objetos y comentarios. No se puede deshacer.`,
      confirmText: 'Eliminar ticket',
      onConfirm: async () => {
        try {
          await ticketService.delete(ticket.id);
          toast.success('Ticket eliminado');
          if (onDelete) onDelete(ticket.id);
        } catch (error) {
          console.error('Error deleting ticket:', error);
          toast.error('Error al eliminar el ticket, por favor intente nuevamente');
        }
      }
    });
  };

  const handleAddProgram = async () => {
    if (!ticketId || !newProgram.object_name || !newProgram.object_type) return;

    setSavingProgram(true);
    try {
      await programService.create({
        ticket_id: ticketId,
        ...newProgram,
        object_name: newProgram.object_name.trim().toUpperCase(),
        object_type: newProgram.object_type.trim().toUpperCase(),
      });
      setNewProgram({
        object_name: '',
        object_type: '',
        attribute: '',
        description: ''
      });
      setAddingProgram(false);
      loadPrograms();
      if (ticket && onUpdate) onUpdate(ticket);
    } catch (error) {
      console.error('Error adding program:', error);
      toast.error('No se pudo agregar el objeto.');
    } finally {
      setSavingProgram(false);
    }
  };

  const handleDeleteProgram = async (program: TicketProgram) => {
    confirmAction({
      title: 'Quitar objeto',
      message: `¿Quitar ${program.object_name} de este ticket?`,
      confirmText: 'Quitar',
      onConfirm: async () => {
        // Optimistic update
        setPrograms(prev => prev.filter(p => p.id !== program.id));

        try {
          await programService.delete(program.id);
          if (ticket && onUpdate) onUpdate(ticket);
        } catch (error) {
          console.error('Error deleting program:', error);
          toast.error('Error al eliminar el programa');
          loadPrograms(); // Re-fetch to sync
        }
      }
    });
  };

  const handleAddSubtask = async () => {
    if (!ticketId || !newSubtask.trim()) return;

    setAddingSubtask(true);
    try {
      await subtaskService.create({
        ticket_id: ticketId,
        title: newSubtask.trim()
      });
      setNewSubtask('');
      loadSubtasks();
    } catch (error) {
      console.error('Error adding subtask:', error);
      toast.error('No se pudo agregar la subtarea.');
    } finally {
      setAddingSubtask(false);
    }
  };

  const handleToggleSubtask = async (subtask: Subtask) => {
    // Optimistic: tick the box at once, then confirm with the server.
    setSubtasks(prev => prev.map(t => (t.id === subtask.id ? { ...t, is_completed: !t.is_completed } : t)));
    try {
      await subtaskService.updateStatus(subtask.id, !subtask.is_completed);
    } catch (error) {
      console.error('Error updating subtask:', error);
      toast.error('No se pudo actualizar la subtarea.');
      loadSubtasks();
    }
  };

  const handleDeleteSubtask = async (subtask: Subtask) => {
    confirmAction({
      title: 'Eliminar subtarea',
      message: `¿Eliminar «${subtask.title}»?`,
      confirmText: 'Eliminar',
      onConfirm: async () => {
        // Optimistic update
        setSubtasks(prev => prev.filter(t => t.id !== subtask.id));

        try {
          await subtaskService.delete(subtask.id);
        } catch (error) {
          console.error('Error deleting subtask:', error);
          toast.error('Error al eliminar la subtarea');
          loadSubtasks(); // Re-fetch
        }
      }
    });
  };

  const handleDownloadAttachment = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      // Fallback to opening in new tab if fetch fails
      window.open(url, '_blank');
    }
  };

  const handleDeleteAttachment = async (attachmentIndex: number) => {
    if (!ticket) return;

    confirmAction({
      title: 'Eliminar archivo',
      message: `¿Eliminar «${ticket.attachments?.[attachmentIndex]?.name}» de este ticket?`,
      confirmText: 'Eliminar archivo',
      onConfirm: async () => {
        try {
          if (!ticket.attachments) return;
          const attachment = ticket.attachments[attachmentIndex];

          const urlObj = new URL(attachment.url);
          const pathParts = urlObj.pathname.split('/ticket-attachments/');
          if (pathParts.length > 1) {
            const filePath = decodeURIComponent(pathParts[1]);
            await storageService.deleteFile(filePath);
          }

          const newAttachments = (ticket.attachments || []).filter((_, index) => index !== attachmentIndex);
          const updatedTicket = await ticketService.update(ticket.id, { attachments: newAttachments });
          applyServerTicket(updatedTicket);

        } catch (error) {
          console.error('Error deleting attachment:', error);
          toast.error("Error al eliminar el archivo adjunto");
        }
      }
    });
  };


  const handleGeneratePass = async () => {
    if (!ticket) return;
    try {
      await documentService.generateProductionPass(ticket, subtasks, programs, project);
    } catch (error) {
      console.error("Error generating pass:", error);
      toast.error("Error al generar el pase a producción");
    }
  };


  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !ticket) return;

    const file = e.target.files[0];
    setUploading(true);
    try {
      const { url } = await storageService.uploadFile(file, ticket.project_id, ticket.id);

      const newAttachment = {
        name: file.name,
        url: url,
        size: file.size,
        type: file.type
      };

      const currentAttachments = ticket.attachments || [];
      const newAttachments = [...currentAttachments, newAttachment];

      const updatedTicket = await ticketService.update(ticket.id, { attachments: newAttachments });
      applyServerTicket(updatedTicket);
      toast.success('Archivo adjuntado');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error al subir el archivo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const sequence = useMemo(() => (ticket ? ticketSequence(siblings).get(ticket.id) : undefined), [siblings, ticket?.id]);
  const assigned = users.find((u) => u.id === ticket?.assigned_to);

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-6" role="status" aria-label="Cargando ticket">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-base font-semibold text-ink">No encontramos este ticket</p>
        <p className="max-w-sm text-sm text-ink-2">Puede que se haya eliminado o que no tengas acceso al proyecto.</p>
        {onClose && (
          <Button variant="secondary" onClick={onClose}>
            Volver
          </Button>
        )}
      </div>
    );
  }

  const routeIndex = ticket.status === 'done' ? ROUTE.length - 1 : ROUTE.findIndex((step) => step.status === ticket.status);
  const doneSubtasks = subtasks.filter(t => t.is_completed).length;
  const late = isOverdue(ticket.deadline, ticket.status);
  const canGeneratePass = !readOnly && (ticket.status === 'completed' || ticket.status === 'done' || ticket.status === 'approved');
  const urgencyOptions = LEGACY_URGENCY[ticket.urgency]
    ? [...URGENCY_OPTIONS, { value: ticket.urgency, label: LEGACY_URGENCY[ticket.urgency] }]
    : URGENCY_OPTIONS;
  const typeOptions = requestTypes.some((t) => t.value === ticket.request_type) || !ticket.request_type
    ? requestTypes
    : [...requestTypes, { id: 'current', value: ticket.request_type, label: ticket.request_type, is_active: true }];

  return (
    <div className="@container relative flex h-full flex-col bg-paper">
      {/* Head of the order */}
      <div className="flex-none border-b border-rule px-5 pb-4 pt-3">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-[13px] text-ink-2">
            {project ? (
              <Link to={`/project/${project.id}`} className="font-medium text-ink hover:underline">
                {project.name}
              </Link>
            ) : (
              <span>Proyecto</span>
            )}
            {project?.clients?.name && <span className="text-ink-3"> · {project.clients.name}</span>}
          </p>
          <div className="flex shrink-0 items-center gap-1">
            {canGeneratePass && (
              <Button variant="secondary" size="sm" onClick={handleGeneratePass} title="Genera el documento Word del pase a producción">
                <FileText size={14} aria-hidden="true" />
                Pase a producción
              </Button>
            )}
            {variant === 'panel' && (
              <Link
                to={`/ticket/${ticket.id}`}
                aria-label="Abrir en página completa"
                title="Abrir en página completa"
                className="inline-flex h-8 w-8 items-center justify-center rounded-control text-ink-2 hover:bg-ink/[0.06] hover:text-ink"
              >
                <ExternalLink size={16} />
              </Link>
            )}
            {!readOnly && (
              <button
                type="button"
                onClick={handleDeleteTicket}
                aria-label="Eliminar ticket"
                title="Eliminar ticket"
                className="inline-flex h-8 w-8 items-center justify-center rounded-control text-ink-2 hover:bg-st-red/10 hover:text-st-red"
              >
                <Trash2 size={16} />
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label={variant === 'panel' ? 'Cerrar ticket' : 'Volver'}
                className="inline-flex h-8 w-8 items-center justify-center rounded-control text-ink-2 hover:bg-ink/[0.06] hover:text-ink"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-3 @xl:flex-row @xl:items-start @xl:gap-4">
          <div className="min-w-0 flex-1">
            <label htmlFor={`ticket-subject-${ticket.id}`} className="sr-only">Asunto</label>
            <textarea
              id={`ticket-subject-${ticket.id}`}
              ref={subjectRef}
              rows={1}
              value={ticket.subject || ''}
              onChange={(e) => setTicket({ ...ticket, subject: e.target.value.replace(/\s*\n\s*/g, ' ') })}
              onKeyDown={(e) => {
                // The subject is one line: Enter saves it instead of breaking it.
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
              onBlur={() => handleUpdateTicket({ subject: ticket.subject }, 'Asunto guardado')}
              className="block w-full resize-none overflow-hidden rounded-inner border border-transparent bg-transparent px-1 py-0.5 text-xl font-semibold leading-snug text-ink placeholder:text-ink-3 hover:border-rule focus:border-focus focus:outline-none disabled:hover:border-transparent @2xl:text-2xl"
              placeholder="Ticket sin asunto"
              disabled={readOnly}
            />
            <p className="mt-1 px-1 text-xs text-ink-3">
              Abierto {formatDate(ticket.created_at, 'long')}
              {ticket.updated_at !== ticket.created_at && <> · actualizado {timeAgo(ticket.updated_at)}</>}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 @xl:flex-col @xl:items-end">
            {sequence && (
              <div className="rounded-control border border-rule-strong/60 px-2.5 py-1 text-right">
                <p className="caption leading-none">Ticket</p>
                <p className="mt-0.5 font-mono text-sm font-semibold leading-none text-ink">{formatSequence(sequence)}</p>
              </div>
            )}
            <StatusBadge key={stampKey} status={ticket.status} size="lg" animate={stampKey > 0} />
          </div>
        </div>

        {/* Route sheet */}
        <nav aria-label="Hoja de ruta" className="mt-4">
          <ol className="grid grid-cols-5 gap-1">
            {ROUTE.map((step, index) => {
              const passed = index < routeIndex;
              const current = index === routeIndex;
              return (
                <li key={step.status}>
                  <button
                    type="button"
                    disabled={readOnly || current}
                    onClick={() => handleStatusChange(step.status)}
                    aria-current={current ? 'step' : undefined}
                    title={readOnly ? step.label : current ? `Estado actual: ${step.label}` : `Mover a: ${step.label}`}
                    className={cn(
                      'group flex w-full flex-col items-start gap-1 text-left disabled:cursor-default',
                      !readOnly && !current && 'cursor-pointer'
                    )}
                  >
                    <span
                      className={cn(
                        'h-1 w-full rounded-full transition-colors',
                        current ? 'bg-ink' : passed ? 'bg-ink/45' : 'bg-rule',
                        !readOnly && !current && 'group-hover:bg-ink/60'
                      )}
                      aria-hidden="true"
                    />
                    <span
                      className={cn(
                        'flex items-center gap-1 text-[11px] leading-tight @xl:text-xs',
                        current ? 'font-semibold text-ink' : passed ? 'text-ink-2' : 'text-ink-3',
                        !readOnly && !current && 'group-hover:text-ink'
                      )}
                    >
                      {passed && <Check size={11} aria-hidden="true" className="shrink-0" />}
                      {step.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Client Approval Workflow */}
        {user?.role === 'guest' && ticket.status === 'pending_approval' && (
          <div className="m-5 mb-0 rounded-control border border-st-ochre/50 bg-st-ochre/[0.07] p-4">
            <div className="flex items-start gap-3">
              <CheckSquare size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-st-ochre" />
              <div className="flex-1">
                <h3 className="text-[15px] font-semibold text-ink">Este entregable espera tu aprobación</h3>
                <p className="mt-1 text-sm text-ink-2">
                  Revisa el trabajo. Si cumple lo pedido, apruébalo; si no, pide cambios y explica qué falta en los comentarios.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button onClick={() => handleStatusChange('approved')}>Aprobar trabajo</Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      // Set status back to ongoing and focus comment
                      handleStatusChange('ongoing');
                      commentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      commentRef.current?.focus();
                    }}
                  >
                    Solicitar cambios
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 p-5 @3xl:grid-cols-[minmax(0,1fr)_17rem]">
          {/* Main column */}
          <div className="min-w-0 space-y-7">
            <section aria-labelledby={`desc-${ticket.id}`}>
              <h3 id={`desc-${ticket.id}`} className={sectionTitle}>Descripción</h3>
              <textarea
                value={ticket.description || ''}
                onChange={(e) => setTicket({ ...ticket, description: e.target.value })}
                onBlur={() => handleUpdateTicket({ description: ticket.description }, 'Descripción guardada')}
                aria-labelledby={`desc-${ticket.id}`}
                className="field mt-2 min-h-[8rem] resize-y leading-relaxed"
                placeholder={readOnly ? 'Sin descripción.' : 'Qué se pide, dónde y cómo se prueba.'}
                disabled={readOnly}
              />
            </section>

            {/* Subtasks Section */}
            <section aria-labelledby={`sub-${ticket.id}`}>
              <div className="flex items-center justify-between">
                <h3 id={`sub-${ticket.id}`} className={sectionTitle}>Subtareas</h3>
                {subtasks.length > 0 && (
                  <span className="text-xs tabular-nums text-ink-3">
                    {doneSubtasks} de {subtasks.length} hechas
                  </span>
                )}
              </div>
              {subtasks.length > 0 && (
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-well" aria-hidden="true">
                  <div className="h-full bg-st-green transition-[width]" style={{ width: `${(doneSubtasks / subtasks.length) * 100}%` }} />
                </div>
              )}
              <ul className="mt-2 divide-y divide-rule rounded-control border border-rule">
                {subtasks.map(task => (
                  <li key={task.id} className="flex items-start gap-3 px-3 py-2">
                    <input
                      id={`subtask-${task.id}`}
                      type="checkbox"
                      checked={task.is_completed}
                      onChange={() => handleToggleSubtask(task)}
                      className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--ink)]"
                      disabled={readOnly}
                    />
                    <label
                      htmlFor={`subtask-${task.id}`}
                      className={cn('flex-1 text-sm', task.is_completed ? 'text-ink-3 line-through' : 'text-ink')}
                    >
                      {task.title}
                    </label>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSubtask(task)}
                        aria-label={`Eliminar subtarea ${task.title}`}
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-inner text-ink-3 hover:bg-st-red/10 hover:text-st-red"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </li>
                ))}
                {subtasks.length === 0 && (
                  <li className="px-3 py-3 text-[13px] text-ink-3">
                    {readOnly ? 'Este ticket no tiene subtareas.' : 'Divide el trabajo en pasos que se puedan marcar.'}
                  </li>
                )}
                {user?.role !== 'guest' && !readOnly && (
                  <li className="flex gap-2 bg-well/60 px-2 py-2">
                    <label htmlFor={`new-subtask-${ticket.id}`} className="sr-only">Nueva subtarea</label>
                    <input
                      id={`new-subtask-${ticket.id}`}
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                      placeholder="Nueva subtarea"
                      className="field h-8 py-1 text-[13px]"
                      disabled={addingSubtask}
                    />
                    <Button size="sm" variant="secondary" onClick={handleAddSubtask} disabled={!newSubtask.trim()} isLoading={addingSubtask}>
                      {!addingSubtask && <Plus size={14} aria-hidden="true" />}
                      Agregar
                    </Button>
                  </li>
                )}
              </ul>
            </section>

            {/* IBM i objects */}
            <section aria-labelledby={`obj-${ticket.id}`}>
              <div className="flex items-center justify-between">
                <h3 id={`obj-${ticket.id}`} className={sectionTitle}>
                  Objetos ({programs.length})
                </h3>
                {!readOnly && !addingProgram && (
                  <Button size="sm" variant="ghost" onClick={() => setAddingProgram(true)}>
                    <Plus size={14} aria-hidden="true" />
                    Agregar objeto
                  </Button>
                )}
              </div>
              <div className="mt-2 overflow-hidden rounded-control border border-rule">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-rule bg-well">
                      <th scope="col" className="caption px-3 py-1.5 text-left font-semibold">Objeto</th>
                      <th scope="col" className="caption px-3 py-1.5 text-left font-semibold">Tipo</th>
                      <th scope="col" className="caption px-3 py-1.5 text-left font-semibold">Descripción</th>
                      {!readOnly && <th scope="col" className="w-10"><span className="sr-only">Acciones</span></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule">
                    {programs.map(p => (
                      <tr key={p.id}>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-[13px] font-semibold text-ink">{p.object_name}</td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-[13px] text-ink-2">
                          {p.object_type}
                          {p.attribute && <span className="text-ink-3"> · {p.attribute}</span>}
                        </td>
                        <td className="px-3 py-2 text-[13px] text-ink-2">{p.description || '—'}</td>
                        {!readOnly && (
                          <td className="px-1 py-1 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteProgram(p)}
                              aria-label={`Quitar ${p.object_name}`}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-inner text-ink-3 hover:bg-st-red/10 hover:text-st-red"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {programs.length === 0 && !addingProgram && (
                      <tr>
                        <td colSpan={4} className="px-3 py-3 text-[13px] text-ink-3">
                          Sin objetos. Anota aquí los programas, pantallas y archivos que toca este ticket; salen en el pase a producción.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {addingProgram && (
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleAddProgram(); }}
                    className="grid grid-cols-2 gap-2 border-t border-rule bg-well/60 p-3 @lg:grid-cols-[9rem_7rem_1fr]"
                  >
                    <input
                      className="field h-8 py-1 font-mono text-[13px] uppercase"
                      placeholder="Objeto"
                      aria-label="Nombre del objeto"
                      value={newProgram.object_name}
                      onChange={e => setNewProgram({ ...newProgram, object_name: e.target.value })}
                      autoFocus
                      required
                    />
                    <input
                      className="field h-8 py-1 font-mono text-[13px] uppercase"
                      placeholder="Tipo"
                      aria-label="Tipo de objeto"
                      list={`object-types-${ticket.id}`}
                      value={newProgram.object_type}
                      onChange={e => setNewProgram({ ...newProgram, object_type: e.target.value })}
                      required
                    />
                    <datalist id={`object-types-${ticket.id}`}>
                      {OBJECT_TYPES.map((t) => <option key={t} value={t} />)}
                    </datalist>
                    <input
                      className="field col-span-2 h-8 py-1 text-[13px] @lg:col-span-1"
                      placeholder="Qué cambia en este objeto"
                      aria-label="Descripción del cambio"
                      value={newProgram.description}
                      onChange={e => setNewProgram({ ...newProgram, description: e.target.value })}
                    />
                    <div className="col-span-2 flex justify-end gap-2 @lg:col-span-3">
                      <Button type="button" size="sm" variant="ghost" onClick={() => setAddingProgram(false)}>Cancelar</Button>
                      <Button type="submit" size="sm" variant="secondary" isLoading={savingProgram} disabled={!newProgram.object_name || !newProgram.object_type}>
                        Guardar objeto
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </section>

            {/* Conversation */}
            <section aria-labelledby={`com-${ticket.id}`} className="pb-2">
              <h3 id={`com-${ticket.id}`} className={sectionTitle}>
                <MessageSquare size={15} aria-hidden="true" className="text-ink-3" />
                Comentarios ({comments.length})
              </h3>

              <ol className="mt-3 space-y-4">
                {comments.map((comment) => (
                  <li key={comment.id} className="flex gap-3">
                    <Avatar name={comment.user_name} src={comment.user_avatar} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-semibold text-ink">{comment.user_name}</span>
                        <time dateTime={comment.created_at} className="shrink-0 text-xs text-ink-3" title={formatDate(comment.created_at, 'datetime')}>
                          {timeAgo(comment.created_at)}
                        </time>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap break-words rounded-control border border-rule bg-well/60 px-3 py-2 text-sm leading-relaxed text-ink">
                        {comment.content}
                      </p>
                    </div>
                  </li>
                ))}
                {comments.length === 0 && (
                  <li className="text-[13px] text-ink-3">Aún no hay comentarios. Úsalos para acuerdos, dudas y cambios pedidos por el cliente.</li>
                )}
              </ol>

              <div className="mt-4 flex gap-3">
                <Avatar name={user?.name} src={user?.avatar} size="sm" />
                <div className="flex-1">
                  <label htmlFor={`comment-${ticket.id}`} className="sr-only">Nuevo comentario</label>
                  <textarea
                    ref={commentRef}
                    id={`comment-${ticket.id}`}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                    placeholder="Escribe un comentario…"
                    rows={2}
                    className="field min-h-[4.5rem] resize-y"
                  />
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="hidden text-xs text-ink-3 sm:inline">Enter publica · Shift+Enter agrega una línea</span>
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      isLoading={submittingComment}
                      className="ml-auto"
                    >
                      Comentar
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Side column: the form's fields */}
          <aside className="min-w-0 space-y-5 @3xl:border-l @3xl:border-rule @3xl:pl-5" aria-label="Datos del ticket">
            <div className="grid grid-cols-2 gap-4 @3xl:grid-cols-1">
              <FormField id={`assignee-${ticket.id}`} label="Asignado a">
                {readOnly ? (
                  <p className="flex items-center gap-2 text-sm text-ink">
                    {assigned ? <><Avatar name={assigned.name} size="xs" />{assigned.name}</> : <span className="text-ink-3">Sin asignar</span>}
                  </p>
                ) : (
                  <UserPicker
                    id={`assignee-${ticket.id}`}
                    value={ticket.assigned_to}
                    onChange={(val) => handleUpdateTicket({ assigned_to: val || null }, val ? 'Ticket asignado' : 'Asignación quitada')}
                  />
                )}
              </FormField>

              <FormField
                id={`deadline-${ticket.id}`}
                label="Fecha límite"
                hint={ticket.deadline ? (late ? <span className="font-semibold text-st-red">Venció {relativeDay(ticket.deadline)}</span> : relativeDay(ticket.deadline)) : undefined}
              >
                <input
                  id={`deadline-${ticket.id}`}
                  type="date"
                  value={toDateInputValue(ticket.deadline)}
                  onChange={(e) => handleUpdateTicket({ deadline: dateInputToDeadline(e.target.value) }, 'Fecha límite guardada')}
                  className={cn('field', late && 'border-st-red/60')}
                  disabled={readOnly}
                />
              </FormField>

              <ModernSelect
                label="Prioridad"
                value={ticket.urgency}
                onChange={(value) => handleUpdateTicket({ urgency: value as Ticket['urgency'] }, 'Prioridad guardada')}
                options={urgencyOptions.map((option) => ({ ...option, icon: <UrgencyBadge urgency={option.value} compact /> }))}
                disabled={readOnly}
              />

              <ModernSelect
                label="Tipo de solicitud"
                value={ticket.request_type || ''}
                placeholder="Sin tipo"
                onChange={(value) => handleUpdateTicket({ request_type: value || null }, 'Tipo guardado')}
                options={typeOptions.map((t) => ({ value: t.value, label: t.label }))}
                disabled={readOnly}
              />

              <FormField id={`tags-${ticket.id}`} label="Etiquetas" hint={readOnly ? undefined : 'Separadas por comas'} className="col-span-2 @3xl:col-span-1">
                <input
                  id={`tags-${ticket.id}`}
                  type="text"
                  value={ticket.tags ? ticket.tags.join(', ') : ''}
                  onChange={(e) => {
                    // Better interaction: just let them type string and parse on blur
                    setTicket({ ...ticket, tags: e.target.value.split(',').map(s => s.trimStart()) });
                  }}
                  onBlur={() => handleUpdateTicket({ tags: ticket.tags?.map((t) => t.trim()).filter(Boolean) }, 'Etiquetas guardadas')}
                  className="field"
                  placeholder="pase, urgente-cliente"
                  disabled={readOnly}
                />
              </FormField>
            </div>

            {/* QA verification: feeds the production pass document. */}
            <div className="rounded-control border border-rule p-3">
              <h3 className="caption">Verificación QA</h3>
              <div className="mt-2 grid grid-cols-2 gap-1" role="radiogroup" aria-label="Estado de QA">
                {QA_OPTIONS.map((option) => {
                  const active = (ticket.qa_status || 'pending') === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={readOnly}
                      onClick={() => handleUpdateTicket({ qa_status: option.value }, 'Estado de QA guardado')}
                      className={cn(
                        'rounded-inner border px-2 py-1.5 text-left text-xs font-medium transition-colors disabled:cursor-default',
                        active
                          ? option.value === 'verified'
                            ? 'border-st-green bg-st-green/10 text-st-green'
                            : option.value === 'failed'
                              ? 'border-st-red bg-st-red/10 text-st-red'
                              : 'border-ink/70 bg-ink/[0.05] text-ink'
                          : 'border-rule text-ink-2 hover:border-rule-strong'
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <label htmlFor={`qa-notes-${ticket.id}`} className="caption mb-1 mt-3 block">Observaciones</label>
              <textarea
                id={`qa-notes-${ticket.id}`}
                value={ticket.qa_notes || ''}
                onChange={(e) => setTicket({ ...ticket, qa_notes: e.target.value })}
                onBlur={() => handleUpdateTicket({ qa_notes: ticket.qa_notes || null }, 'Observaciones guardadas')}
                rows={2}
                className="field min-h-[3.5rem] resize-y text-[13px]"
                placeholder="Qué se probó y con qué datos"
                disabled={readOnly}
              />
            </div>

            {/* Files */}
            <div>
              <div className="flex items-center justify-between">
                <h3 className="caption">Archivos ({ticket.attachments?.length || 0})</h3>
                {!readOnly && (
                  <Button size="sm" variant="ghost" onClick={() => fileInputRef.current?.click()} isLoading={uploading}>
                    {!uploading && <Paperclip size={13} aria-hidden="true" />}
                    {uploading ? 'Subiendo…' : 'Adjuntar'}
                  </Button>
                )}
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
              </div>
              {ticket.attachments && ticket.attachments.length > 0 ? (
                <ul className="mt-2 divide-y divide-rule rounded-control border border-rule">
                  {ticket.attachments.map((file, idx) => (
                    <li key={`${file.url}-${idx}`} className="flex items-center gap-2 px-2.5 py-2">
                      <Paperclip size={13} aria-hidden="true" className="shrink-0 text-ink-3" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-ink" title={file.name}>{file.name}</span>
                        <span className="block text-[11px] text-ink-3">{(file.size / 1024).toFixed(0)} KB</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDownloadAttachment(file.url, file.name)}
                        aria-label={`Descargar ${file.name}`}
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-inner text-ink-3 hover:bg-ink/[0.06] hover:text-ink"
                      >
                        <Download size={14} />
                      </button>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(idx)}
                          aria-label={`Eliminar ${file.name}`}
                          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-inner text-ink-3 hover:bg-st-red/10 hover:text-st-red"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[13px] text-ink-3">Sin archivos adjuntos.</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
