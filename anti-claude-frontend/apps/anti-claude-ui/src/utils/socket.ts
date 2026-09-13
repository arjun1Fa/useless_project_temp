import { io, Socket } from 'socket.io-client';

export const getBackendUrl = (): string => {
  const metaEnv = (import.meta as any)?.env;
  if (metaEnv?.VITE_BACKEND_URL) {
    return metaEnv.VITE_BACKEND_URL;
  }
  const protocol = window.location.protocol;
  const hostname = window.location.hostname || 'localhost';
  return `${protocol}//${hostname}:3000`;
};

export const BACKEND_URL = getBackendUrl();

export const socket: Socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling'],
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});

socket.on('connect', () => {
  console.log('⚡ Connected to Anti-Claude backend socket at', BACKEND_URL);
  socket.emit('join', { userId: 'user_fixed_001' });
});

/**
 * Cross-device and tab sync helper
 * Sends to both BroadcastChannel (same tab/device) and Socket.IO relay (across phones)
 */
export const broadcastSync = (type: string, payload: unknown) => {
  try {
    const channel = new BroadcastChannel('anti-claude-sync-channel');
    channel.postMessage({ type, payload });
    channel.close();
  } catch {
    // BroadcastChannel fallback
  }

  if (socket.connected) {
    socket.emit('relay', { userId: 'user_fixed_001', type, payload });
  }
};

/**
 * API Fetch helpers
 */
export const api = {
  async getProfile() {
    const res = await fetch(`${BACKEND_URL}/api/v1/employee`);
    return res.json();
  },

  async getTasks() {
    const res = await fetch(`${BACKEND_URL}/api/v1/tasks`);
    return res.json();
  },

  async getMessages() {
    const res = await fetch(`${BACKEND_URL}/api/v1/messages`);
    return res.json();
  },

  async triggerTask(priority: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY' = 'HIGH') {
    const res = await fetch(`${BACKEND_URL}/api/v1/admin/tasks/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priority,
        isEmergency: priority === 'EMERGENCY',
        overrideAbsurdityLevel: Math.floor(Math.random() * 5) + 1,
      }),
    });
    return res.json();
  },

  async promote() {
    const res = await fetch(`${BACKEND_URL}/api/v1/admin/employee/promote`, {
      method: 'POST',
    });
    return res.json();
  },

  async reset() {
    const res = await fetch(`${BACKEND_URL}/api/v1/admin/reset`, {
      method: 'POST',
    });
    return res.json();
  },
};
