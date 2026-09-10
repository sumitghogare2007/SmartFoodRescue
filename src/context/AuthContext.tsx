import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser } from '../types';
import { apiClient, setAuthToken } from '../lib/api';

interface AuthContextType {
  authUser: AuthUser | null;
  loading: boolean;
  signIn: (data: any) => Promise<void>;
  signUp: (data: any) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Explicit requirement: All sessions should logout on web refresh.
    // Clears any lingering storage tokens so no random accounts (Volunteer, NGO) persist across reloads.
    setAuthToken(null);
    setAuthUser(null);
    setLoading(false);
    try {
      localStorage.removeItem('sfr_token');
      sessionStorage.removeItem('sfr_token');
    } catch {
      // Ignore storage errors
    }
  }, []);

  const signIn = async (data: any) => {
    const response = await apiClient.post('/api/auth/login', data);
    const { token, user, roleRecord } = response.data;
    setAuthToken(token);
    setAuthUser({
      ...user,
      ...(user?.userType === 'DONOR' ? { donorProfile: roleRecord } : {}),
      ...(user?.userType === 'NGO' ? { ngoProfile: roleRecord } : {}),
      ...(user?.userType === 'VOLUNTEER' ? { volunteerProfile: roleRecord } : {}),
    });
  };

  const signUp = async (data: any) => {
    const response = await apiClient.post('/api/auth/register', data);
    const { token, user, roleRecord } = response.data;
    setAuthToken(token);
    setAuthUser({
      ...user,
      ...(user?.userType === 'DONOR' ? { donorProfile: roleRecord } : {}),
      ...(user?.userType === 'NGO' ? { ngoProfile: roleRecord } : {}),
      ...(user?.userType === 'VOLUNTEER' ? { volunteerProfile: roleRecord } : {}),
    });
  };

  const signOut = () => {
    setAuthToken(null);
    setAuthUser(null);
    try {
      localStorage.removeItem('sfr_token');
      sessionStorage.removeItem('sfr_token');
    } catch {
      // Ignore storage errors
    }
    window.location.href = '/auth/login';
  };

  return (
    <AuthContext.Provider value={{ authUser, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
