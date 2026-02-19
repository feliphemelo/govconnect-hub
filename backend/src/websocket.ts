import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { verifyToken } from './utils/auth';
import type { JWTPayload } from './types';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  companyId?: string;
  conversationId?: string;
}

interface WSMessage {
  type: 'auth' | 'join' | 'leave' | 'message' | 'typing' | 'read' | 'error';
  payload?: any;
}

export class ChatWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();
  private conversationClients: Map<string, Set<AuthenticatedWebSocket>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    console.log('🔌 WebSocket server initialized on /ws');
  }

  private handleConnection(ws: AuthenticatedWebSocket) {
    console.log('🔵 New WebSocket connection');

    ws.on('message', (data: Buffer) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (error) {
        console.error('❌ WebSocket message parse error:', error);
        this.sendError(ws, 'Invalid message format');
      }
    });

    ws.on('close', () => {
      console.log('🔴 WebSocket disconnected');
      this.handleDisconnect(ws);
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
  }

  private handleMessage(ws: AuthenticatedWebSocket, message: WSMessage) {
    switch (message.type) {
      case 'auth':
        this.handleAuth(ws, message.payload);
        break;
      case 'join':
        this.handleJoinConversation(ws, message.payload);
        break;
      case 'leave':
        this.handleLeaveConversation(ws, message.payload);
        break;
      case 'message':
        this.handleChatMessage(ws, message.payload);
        break;
      case 'typing':
        this.handleTyping(ws, message.payload);
        break;
      case 'read':
        this.handleReadReceipt(ws, message.payload);
        break;
      default:
        this.sendError(ws, 'Unknown message type');
    }
  }

  private handleAuth(ws: AuthenticatedWebSocket, payload: { token: string }) {
    try {
      if (!payload || !payload.token) {
        this.sendError(ws, 'Token required');
        return;
      }

      const decoded = verifyToken(payload.token);
      if (!decoded) {
        this.sendError(ws, 'Invalid token');
        ws.close();
        return;
      }

      ws.userId = decoded.userId;
      ws.companyId = decoded.companyId;

      // Add to company clients
      if (!this.clients.has(decoded.companyId)) {
        this.clients.set(decoded.companyId, new Set());
      }
      this.clients.get(decoded.companyId)!.add(ws);

      this.send(ws, { type: 'auth', payload: { success: true, userId: decoded.userId } });
      console.log(`✅ Client authenticated: userId=${decoded.userId}, companyId=${decoded.companyId}`);
    } catch (error) {
      console.error('❌ Auth error:', error);
      this.sendError(ws, 'Authentication failed');
      ws.close();
    }
  }

  private handleJoinConversation(ws: AuthenticatedWebSocket, payload: { conversationId: string }) {
    if (!ws.userId) {
      this.sendError(ws, 'Not authenticated');
      return;
    }

    const conversationId = payload.conversationId;
    ws.conversationId = conversationId;

    if (!this.conversationClients.has(conversationId)) {
      this.conversationClients.set(conversationId, new Set());
    }
    this.conversationClients.get(conversationId)!.add(ws);

    this.send(ws, { type: 'joined', payload: { conversationId } });
    console.log(`👤 User ${ws.userId} joined conversation ${conversationId}`);
  }

  private handleLeaveConversation(ws: AuthenticatedWebSocket, payload: { conversationId: string }) {
    const conversationId = payload.conversationId;
    
    if (this.conversationClients.has(conversationId)) {
      this.conversationClients.get(conversationId)!.delete(ws);
    }

    ws.conversationId = undefined;
    this.send(ws, { type: 'left', payload: { conversationId } });
    console.log(`👋 User ${ws.userId} left conversation ${conversationId}`);
  }

  private handleChatMessage(ws: AuthenticatedWebSocket, payload: any) {
    if (!ws.userId || !ws.conversationId) {
      this.sendError(ws, 'Not in a conversation');
      return;
    }

    // Broadcast to all clients in the conversation
    this.broadcastToConversation(ws.conversationId, {
      type: 'message',
      payload: {
        ...payload,
        userId: ws.userId,
        timestamp: new Date().toISOString()
      }
    }, ws);

    console.log(`💬 Message from ${ws.userId} in conversation ${ws.conversationId}`);
  }

  private handleTyping(ws: AuthenticatedWebSocket, payload: { isTyping: boolean }) {
    if (!ws.userId || !ws.conversationId) {
      return;
    }

    this.broadcastToConversation(ws.conversationId, {
      type: 'typing',
      payload: {
        userId: ws.userId,
        isTyping: payload.isTyping
      }
    }, ws);
  }

  private handleReadReceipt(ws: AuthenticatedWebSocket, payload: { messageId: string }) {
    if (!ws.userId || !ws.conversationId) {
      return;
    }

    this.broadcastToConversation(ws.conversationId, {
      type: 'read',
      payload: {
        userId: ws.userId,
        messageId: payload.messageId,
        timestamp: new Date().toISOString()
      }
    }, ws);
  }

  private handleDisconnect(ws: AuthenticatedWebSocket) {
    // Remove from company clients
    if (ws.companyId && this.clients.has(ws.companyId)) {
      this.clients.get(ws.companyId)!.delete(ws);
    }

    // Remove from conversation clients
    if (ws.conversationId && this.conversationClients.has(ws.conversationId)) {
      this.conversationClients.get(ws.conversationId)!.delete(ws);
    }
  }

  private broadcastToConversation(conversationId: string, message: any, exclude?: WebSocket) {
    const clients = this.conversationClients.get(conversationId);
    if (!clients) return;

    clients.forEach((client) => {
      if (client !== exclude && client.readyState === WebSocket.OPEN) {
        this.send(client, message);
      }
    });
  }

  private send(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, error: string) {
    this.send(ws, { type: 'error', payload: { error } });
  }

  // Public method to broadcast system messages
  public broadcastToCompany(companyId: string, message: any) {
    const clients = this.clients.get(companyId);
    if (!clients) return;

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        this.send(client, message);
      }
    });
  }
}
