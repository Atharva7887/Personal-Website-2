export interface AuthState {
  isAuthenticated: boolean;
  user: string | null;
}

export interface Credentials {
  username: string;
  password: string;
}