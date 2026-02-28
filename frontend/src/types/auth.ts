export interface User {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  userType: 'client' | 'worker';
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  address: string;
  categories?: string[];
  status: 'available' | 'busy' | 'offline';
  rating: number;
  totalRatings: number;
  visibilityWeight: number;
  authMethod: 'phone' | 'google';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface RegisterData {
  name: string;
  phone: string;
  email?: string;
  password: string;
  userType: 'client' | 'worker';
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  address: string;
  categories?: string[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (userData: RegisterData) => Promise<User>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
}
