import { UserProfile } from '../types';

/**
 * Work this account sees as the client of another company, through the portal of
 * the client it is linked to: it reads it and answers approvals, and the vendor
 * edits it. The account keeps every right over its own team's work. Lists use
 * this; a project or ticket page asks the database (can_edit_project).
 */
export function isClientSide(
  user: Pick<UserProfile, 'client_id'> | null | undefined,
  clientId: string | null | undefined
): boolean {
  return !!user?.client_id && clientId === user.client_id;
}
