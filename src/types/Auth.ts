export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  /** Name of the new organization when nobody invited this email. */
  company?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest' | 'support_agent';
  avatar?: string;
  contact_id?: string | null;
  /** Client whose portal this account uses. It is a guest only on that client's projects. */
  client_id?: string | null;
  /** The team this account works in. Colleagues share it. */
  organization_id?: string | null;
  subscription_tier?: 'free' | 'pro';
  subscription?: any | null;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: UserProfile | null;
  session: any | null;
  loading: boolean;
  initialized: boolean;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}
