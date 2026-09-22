import { io, Socket } from 'socket.io-client';
import { getAuthToken } from './api';

const rawBaseUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000';
const socketServerUrl = rawBaseUrl.replace(/\/api\/?$/, '');

let socketInstance: Socket | null = null;

export const getSocket = (): Socket => {
  const token = getAuthToken();

  if (!socketInstance) {
    socketInstance = io(socketServerUrl, {
      auth: {
        token: token || undefined
      },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });
  } else {
    // Refresh auth token if changed
    if (socketInstance.auth && typeof socketInstance.auth === 'object') {
      (socketInstance.auth as any).token = token || undefined;
    }
    if (!socketInstance.connected) {
      socketInstance.connect();
    }
  }

  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};

export const joinPickupRoom = (pickupId: string) => {
  const socket = getSocket();
  socket.emit('join:pickup', { pickupId });
};

export const leavePickupRoom = (pickupId: string) => {
  if (socketInstance && socketInstance.connected) {
    socketInstance.emit('leave:pickup', { pickupId });
  }
};

export const emitVolunteerLocation = (payload: {
  pickupId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp?: number | string;
}) => {
  const socket = getSocket();
  socket.emit('location:update', payload);
};
