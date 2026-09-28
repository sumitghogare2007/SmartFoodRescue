import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useDeviceGPS } from '../hooks/useDeviceGPS';
import { useAuth } from './AuthContext';
import { getSocket, joinPickupRoom, leavePickupRoom } from '../lib/socket';
import { volunteerService } from '../services/volunteerService';

type NavigationState = ReturnType<typeof useDeviceGPS> & {
  activeNavPickupId: string | null;
  setActiveNavPickupId: (id: string | null) => void;
};
const NavigationContext = createContext<NavigationState | null>(null);

// Owned by the authenticated layout so opening the map never stops the watch.
export function NavigationProvider({ children }: { children: ReactNode }) {
  const { authUser } = useAuth();
  const [activeNavPickupId, setActiveNavPickupId] = useState<string | null>(null);
  const gps = useDeviceGPS({ pickupId: activeNavPickupId || undefined,
    enabled: authUser?.userType === 'VOLUNTEER' && !!activeNavPickupId });
  useEffect(() => {
    if (authUser?.userType !== 'VOLUNTEER') return;
    let cancelled = false;
    const sync = async () => {
      try {
        const pickups = await volunteerService.getMyPickups();
        if (!cancelled) setActiveNavPickupId(pickups.find(p => p.pickupStatus === 'EN_ROUTE')?._id || null);
      } catch { /* Existing request interceptor handles expired authentication. */ }
    };
    void sync();
    const timer = setInterval(sync, 15000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [authUser]);
  useEffect(() => {
    if (!activeNavPickupId) return;
    const socket = getSocket();
    const join = () => joinPickupRoom(activeNavPickupId);
    const stop = (data: { pickupId: string }) => {
      if (data.pickupId === activeNavPickupId) setActiveNavPickupId(null);
    };
    socket.on('connect', join);
    socket.on('tracking:stopped', stop);
    if (socket.connected) join();
    return () => {
      socket.off('connect', join);
      socket.off('tracking:stopped', stop);
      leavePickupRoom(activeNavPickupId);
    };
  }, [activeNavPickupId]);
  return <NavigationContext.Provider value={{ ...gps, activeNavPickupId, setActiveNavPickupId }}>{children}</NavigationContext.Provider>;
}

export function useNavigationGPS() {
  const context = useContext(NavigationContext);
  if (!context) throw new Error('NavigationProvider is missing');
  return context;
}
