export type UserRole = 'admin' | 'reviewer';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  slack_userid?: string | null;
  jotform_name?: string | null;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
  isReviewer: () => boolean;
}
