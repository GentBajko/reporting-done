import { createContext } from "react";

export interface User {
  id: string;
  full_name: string;
  email: string;
  permissions: number;
}

export interface AuthContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoadingAuth: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

