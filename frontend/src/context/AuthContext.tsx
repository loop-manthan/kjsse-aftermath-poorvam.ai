import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authService } from "../api/services";
import toast from "react-hot-toast";
import {
  User,
  LoginCredentials,
  RegisterData,
  AuthContextType,
} from "../types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await authService.getMe();
        setUser(data.user);
      } catch (error) {
        localStorage.removeItem("token");
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    try {
      const { data } = await authService.login(credentials);
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data.user);
      toast.success("Login successful!");
      return data.user;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: RegisterData): Promise<User> => {
    try {
      const { data } = await authService.register(userData);
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data.user);
      toast.success("Registration successful!");
      return data.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    toast.success("Logged out successfully");
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      const { data } = await authService.updateProfile(updates);
      setUser(data.user);
      toast.success("Profile updated");
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
