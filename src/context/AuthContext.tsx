import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser } from '../types';
import { apiClient } from '../lib/api';

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
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const token = localStorage.getItem('sfr_token');
    if (!token) {
      setAuthUser(null);
      setLoading(false);
      return;
    }
    
    try {
      const response = await apiClient.get('/api/auth/me');
      const { user, roleRecord } = response.data;
      setAuthUser({ ...user, donorProfile: roleRecord?.userId ? roleRecord : undefined, ngoProfile: undefined, volunteerProfile: undefined,
        ...(user?.userType === 'DONOR' ? { donorProfile: roleRecord } : {}),
        ...(user?.userType === 'NGO' ? { ngoProfile: roleRecord } : {}),
        ...(user?.userType === 'VOLUNTEER' ? { volunteerProfile: roleRecord } : {}),
      });
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setAuthUser(null);
      localStorage.removeItem('sfr_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const signIn = async (data: any) => {
    const response = await apiClient.post('/api/auth/login', data);
    const { token, user, roleRecord } = response.data;
    localStorage.setItem('sfr_token', token);
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
    localStorage.setItem('sfr_token', token);
    setAuthUser({
      ...user,
      ...(user?.userType === 'DONOR' ? { donorProfile: roleRecord } : {}),
      ...(user?.userType === 'NGO' ? { ngoProfile: roleRecord } : {}),
      ...(user?.userType === 'VOLUNTEER' ? { volunteerProfile: roleRecord } : {}),
    });
  };

  const signOut = () => {
    localStorage.removeItem('sfr_token');
    setAuthUser(null);
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
