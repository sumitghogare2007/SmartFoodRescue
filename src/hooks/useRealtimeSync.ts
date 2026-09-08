import { useEffect, useRef } from 'react';

// Shared cross-tab channel for instant multi-tab coordination
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('sfr_realtime_channel');
  }
} catch {
  broadcastChannel = null;
}

export const notifyLocalMutation = (eventType: string, payload?: any) => {
  try {
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: eventType, payload, timestamp: Date.now() });
    }
  } catch {
    // Ignore channel errors
  }
};

interface UseRealtimeSyncOptions {
  onSync: () => Promise<any> | void;
  events?: string[]; // e.g. ['donation', 'pickup', 'request', 'distribution', 'users']
  intervalMs?: number; // Polling interval in ms (default: 4000ms)
  enabled?: boolean;
}

export const useRealtimeSync = ({
  onSync,
  events = [],
  intervalMs = 4000,
  enabled = true,
}: UseRealtimeSyncOptions) => {
  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;

  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;
    let sse: EventSource | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;

    const executeSync = () => {
      if (!isMounted) return;
      try {
        onSyncRef.current();
      } catch (err) {
        console.error('[RealtimeSync] Sync error:', err);
      }
    };

    // 1. Setup Server-Sent Events (SSE) stream
    try {
      const rawApiUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000';
      const baseUrl = rawApiUrl.replace(/\/api\/?$/, '');
      const sseUrl = `${baseUrl}/api/events`;

      sse = new EventSource(sseUrl);

      const handleEvent = () => {
        if (!isMounted) return;
        executeSync();
      };

      // Listen for connected confirmation
      sse.addEventListener('connected', () => {
        // SSE connected
      });

      // Listen for all specified events or generic updates
      const eventList = events.length > 0 
        ? events 
        : ['donation:created', 'donation:updated', 'request:created', 'request:accepted', 'request:updated', 'pickup:updated', 'distribution:completed', 'user:updated'];

      eventList.forEach((evtName) => {
        sse?.addEventListener(evtName, handleEvent);
      });

      sse.onerror = () => {
        // SSE encountered connection error; the polling fallback continues uninterrupted
      };
    } catch {
      // EventSource not supported or blocked
    }

    // 2. Cross-tab BroadcastChannel listener
    const handleBroadcastMessage = (event: MessageEvent) => {
      if (!isMounted) return;
      const type = event.data?.type;
      if (!type || events.length === 0 || events.some(e => type.includes(e) || e.includes(type))) {
        executeSync();
      }
    };

    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', handleBroadcastMessage);
    }

    // 3. Visibility-aware fast polling fallback (every 4s when tab is active)
    const startPolling = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        if (typeof document !== 'undefined' && document.hidden) {
          // Tab is backgrounded; pause polling to avoid network waste
          return;
        }
        executeSync();
      }, intervalMs);
    };

    startPolling();

    // 4. Tab visibility and focus revalidation
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        executeSync();
      }
    };

    const handleWindowFocus = () => {
      executeSync();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleWindowFocus);
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    // Cleanup when component unmounts
    return () => {
      isMounted = false;
      if (sse) {
        sse.close();
      }
      if (timer) {
        clearInterval(timer);
      }
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleBroadcastMessage);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleWindowFocus);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [enabled, intervalMs, events.join(',')]);
};
