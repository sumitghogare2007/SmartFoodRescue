import { Request, Response } from 'express';

interface Client {
  id: string;
  res: Response;
}

class EventService {
  private clients: Map<string, Response> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Send keep-alive heartbeat every 25 seconds to keep connections alive through proxies
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 25000);
  }

  public handleConnection(req: Request, res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering (Nginx, Render)

    res.flushHeaders?.();

    const clientId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.clients.set(clientId, res);

    // Initial greeting
    res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: new Date().toISOString() })}\n\n`);

    req.on('close', () => {
      this.clients.delete(clientId);
    });
  }

  private sendHeartbeat() {
    for (const [id, res] of this.clients.entries()) {
      try {
        res.write(': heartbeat\n\n');
      } catch {
        this.clients.delete(id);
      }
    }
  }

  public broadcast(event: string, payload: any = {}) {
    const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const [id, res] of this.clients.entries()) {
      try {
        res.write(message);
      } catch {
        this.clients.delete(id);
      }
    }
  }

  public getConnectedClientCount(): number {
    return this.clients.size;
  }
}

export const eventService = new EventService();
