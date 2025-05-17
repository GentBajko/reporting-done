import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface User {
  id: string;
  full_name: string;
  email: string;
  permissions: number;
}

interface AuthContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoadingAuth: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const checkCurrentUserSession = async () => {
      setIsLoadingAuth(true);
      try {
        const response = await fetch("/user/me");
        if (response.ok) {
          const userData: User = await response.json();
          setCurrentUser(userData);
          setIsLoggedIn(true);
          setIsAdmin(userData.permissions === 1);
        } else {
          setIsLoggedIn(false);
          setIsAdmin(false);
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Error checking user session:", error);
        setIsLoggedIn(false);
        setIsAdmin(false);
        setCurrentUser(null);
      } finally {
        setIsLoadingAuth(false);
      }
    };
    checkCurrentUserSession();
  }, []);

  const login = async (email: string, password: string) => {
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    try {
      const response = await fetch("/user/login", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const meResponse = await fetch("/user/me");
        if (meResponse.ok) {
          const userData: User = await meResponse.json();
          setCurrentUser(userData);
          setIsLoggedIn(true);
          setIsAdmin(userData.permissions === 1);
        } else {
          throw new Error("Failed to fetch user details after login.");
        }
      } else {
        const errorData = await response.json().catch(() => ({
          detail: "Login failed. Invalid credentials or server error.",
        }));
        throw new Error(errorData.detail || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setIsLoggedIn(false);
      setIsAdmin(false);
      setCurrentUser(null);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const response = await fetch("/user/logout", {});
      if (!response.ok && response.status !== 302) {
        if (response.status >= 400) {
          const errorData = await response
            .json()
            .catch(() => ({ detail: "Logout failed on server." }));
          throw new Error(errorData.detail || "Logout failed");
        }
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggedIn(false);
      setIsAdmin(false);
      setCurrentUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isAdmin,
        user: currentUser,
        login,
        logout,
        isLoadingAuth,
      }}
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
