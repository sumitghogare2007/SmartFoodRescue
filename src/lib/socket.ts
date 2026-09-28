import { io, Socket } from 'socket.io-client';
import { getAuthToken, baseURL } from './api';

const rawBaseUrl = (import.meta.env.VITE_SOCKET_URL as string)?.trim() || baseURL;
const socketServerUrl = rawBaseUrl.replace(/\/api\/?$/, '');

let socketInstance: Socket | null = null;
let socketToken: string | null = null;
const rooms = new Map<string, number>();

export const getSocket = (): Socket => {
  const token = getAuthToken();

  if (socketInstance && socketToken !== token) disconnectSocket();
  socketToken = token;
  if (import.meta.env.DEV && !socketInstance) console.debug('[Tracking] Connecting socket');
  if (!socketInstance) {
    socketInstance = io(socketServerUrl, {
      auth: {
        token: token || undefined
      },
      transports: ['polling', 'websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });
    socketInstance.on('disconnect', () => rooms.clear());
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
  rooms.set(pickupId, (rooms.get(pickupId) || 0) + 1);
  socket.emit('join:pickup', { pickupId });
};

export const leavePickupRoom = (pickupId: string) => {
  const count = (rooms.get(pickupId) || 1) - 1;
  if (count > 0) { rooms.set(pickupId, count); return; }
  rooms.delete(pickupId);
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
  // Do not replay buffered, stale GPS samples after a reconnect.
  if (socket.connected) {
    socket.volatile.emit('location:update', payload);
    if (import.meta.env.DEV) console.debug('[Tracking] GPS location sent');
  }
};
