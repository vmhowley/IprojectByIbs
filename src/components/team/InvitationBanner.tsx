import { UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { organizationService, PendingInvitation } from '../../services/organizationService';
import { dbErrorMessage } from '../../utils/errors';
import { Button } from '../ui/Button';
import { confirmDialog } from '../ui/ConfirmDialog';

const ROLE_LABEL: Record<string, string> = { admin: 'administrador', user: 'miembro', guest: 'invitado' };

/** Invitations from another team, waiting for this account. Nothing when there are none. */
export function InvitationBanner() {
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    organizationService
      .myInvitations()
      .then(setInvitations)
      .catch((error) => console.error('Error loading invitations:', error));
  }, []);

  const accept = async (invitation: PendingInvitation) => {
    const ok = await confirmDialog({
      title: `Unirte a ${invitation.organization_name}`,
      message:
        'Tus proyectos, clientes y canales pasan a ese equipo y sus personas los verán. Tu espacio actual deja de existir.',
      confirmText: 'Unirme',
      tone: 'primary',
    });
    if (!ok) return;

    setBusyId(invitation.id);
    try {
      await organizationService.acceptInvitation(invitation.id);
      toast.success(`Ya eres parte de ${invitation.organization_name}`);
      // Everything this account sees changes with its team.
      window.location.reload();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error(dbErrorMessage(error, 'No se pudo aceptar la invitación.'));
      setBusyId(null);
    }
  };

  const decline = async (invitation: PendingInvitation) => {
    setBusyId(invitation.id);
    try {
      await organizationService.declineInvitation(invitation.id);
      setInvitations((current) => current.filter((i) => i.id !== invitation.id));
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast.error(dbErrorMessage(error, 'No se pudo rechazar la invitación.'));
    } finally {
      setBusyId(null);
    }
  };

  if (invitations.length === 0) return null;

  return (
    <div className="space-y-2">
      {invitations.map((invitation) => (
        <section
          key={invitation.id}
          aria-label={`Invitación a ${invitation.organization_name}`}
          className="sheet flex flex-wrap items-center gap-3 px-4 py-3"
        >
          <UserPlus size={18} aria-hidden="true" className="shrink-0 text-brand-strong" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">
              {invitation.invited_by_name || 'Un administrador'} te invitó a {invitation.organization_name} como{' '}
              {ROLE_LABEL[invitation.role] || invitation.role}
            </p>
            <p className="text-[13px] text-ink-2">
              {invitation.can_accept
                ? 'Al unirte, lo que creaste pasa a ese equipo.'
                : 'Tu equipo actual tiene más personas: solo puedes cambiarte de equipo si trabajas solo.'}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="secondary" size="sm" onClick={() => decline(invitation)} disabled={busyId === invitation.id}>
              Rechazar
            </Button>
            {invitation.can_accept && (
              <Button size="sm" onClick={() => accept(invitation)} isLoading={busyId === invitation.id}>
                Unirme
              </Button>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
