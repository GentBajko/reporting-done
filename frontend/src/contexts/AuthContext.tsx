import { createContext, ReactNode, useContext, useState } from "react";

// Define a basic user type, mirrors UserResponseModel loosely
interface User {
  id: string;
  full_name: string;
  email: string;
  permissions: number; // 0 for User, 1 for Admin (assumption)
}

interface AuthContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  user: User | null; // Add user object to context
  login: (isAdminLogin?: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null); // Add state for user object

  const login = (isAdminLogin = false) => {
    setIsLoggedIn(true);
    setIsAdmin(isAdminLogin);
    if (isAdminLogin) {
      setCurrentUser({
        id: "admin-mock-id",
        full_name: "Admin User",
        email: "admin@example.com",
        permissions: 1,
      });
    } else {
      setCurrentUser({
        id: "user-mock-id",
        full_name: "Regular User",
        email: "user@example.com",
        permissions: 0,
      });
    }
    console.log(`User logged in (mock). Admin: ${isAdminLogin}`);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setCurrentUser(null); // Clear user on logout
    console.log("User logged out (mock)");
  };

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, isAdmin, user: currentUser, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
