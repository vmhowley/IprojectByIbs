import { UserProfile } from '../types';
import { supabase } from './api';

// Each account works in one organization: its colleagues are the people of
// that organization. Admins rename it, invite people by email from any domain,
// and can let new accounts on their own email domain join it.

export type TeamRole = 'admin' | 'user' | 'guest';

export interface Organization {
  id: string;
  name: string;
  /** New accounts with a confirmed email on this domain join the organization. */
  email_domain: string | null;
  created_at: string;
}

export interface OrganizationInvitation {
  id: string;
  email: string;
  role: TeamRole;
  invited_by: string | null;
  created_at: string;
}

/** An invitation waiting for the signed-in account. */
export interface PendingInvitation {
  id: string;
  organization_name: string;
  role: TeamRole;
  invited_by_name: string | null;
  created_at: string;
  /** False while the account's current team has other people: it cannot leave them. */
  can_accept: boolean;
}

export type FoundUser = Pick<UserProfile, 'id' | 'name' | 'email' | 'avatar'>;

// The providers is_public_domain() knows in the database. Their accounts never
// share a team by domain.
const PUBLIC_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
  'icloud.com', 'protonmail.com', 'zoho.com', 'yandex.com', 'mail.com', 'gmx.com',
];

export function isPublicEmailDomain(domain: string): boolean {
  return PUBLIC_EMAIL_DOMAINS.includes(domain.toLowerCase());
}

export const organizationService = {
  async get(id: string): Promise<Organization> {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, email_domain, created_at')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Organization;
  },

  async rename(id: string, name: string): Promise<Organization> {
    const { data, error } = await supabase
      .from('organizations')
      .update({ name: name.trim() })
      .eq('id', id)
      .select('id, name, email_domain, created_at')
      .single();
    if (error) throw error;
    return data as Organization;
  },

  /** The domain must be the one of the admin's own email; null stops the auto-join. */
  async setAutoJoinDomain(id: string, domain: string | null): Promise<Organization> {
    const { data, error } = await supabase
      .from('organizations')
      .update({ email_domain: domain })
      .eq('id', id)
      .select('id, name, email_domain, created_at')
      .single();
    if (error) throw error;
    return data as Organization;
  },

  async getMembers(id: string): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('organization_id', id)
      .order('name');
    if (error) throw error;
    return (data || []) as UserProfile[];
  },

  /** Pending invitations of the admin's organization. */
  async getInvitations(): Promise<OrganizationInvitation[]> {
    const { data, error } = await supabase
      .from('organization_invitations')
      .select('id, email, role, invited_by, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as OrganizationInvitation[];
  },

  async invite(email: string, role: TeamRole): Promise<OrganizationInvitation> {
    const { data, error } = await supabase
      .from('organization_invitations')
      .insert({ email: email.trim().toLowerCase(), role })
      .select('id, email, role, invited_by, created_at')
      .single();
    if (error) throw error;
    return data as OrganizationInvitation;
  },

  async revokeInvitation(id: string): Promise<void> {
    const { error } = await supabase.from('organization_invitations').delete().eq('id', id);
    if (error) throw error;
  },

  async myInvitations(): Promise<PendingInvitation[]> {
    const { data, error } = await supabase.rpc('my_invitations');
    if (error) throw error;
    return (data || []) as PendingInvitation[];
  },

  /** Moves the account into the inviting organization, with what it created. */
  async acceptInvitation(id: string): Promise<void> {
    const { error } = await supabase.rpc('accept_invitation', { p_invitation_id: id });
    if (error) throw error;
  },

  async declineInvitation(id: string): Promise<void> {
    const { error } = await supabase.rpc('decline_invitation', { p_invitation_id: id });
    if (error) throw error;
  },

  /** Profiles are private: an account is found only by its full email. */
  async findUserByEmail(email: string): Promise<FoundUser | null> {
    const { data, error } = await supabase.rpc('find_user_by_email', { p_email: email.trim() });
    if (error) throw error;
    return ((data as FoundUser[] | null) || [])[0] || null;
  },
};
