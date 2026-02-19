import { useEffect, useRef, useState, useCallback } from 'react';

interface UseWebSocketOptions {
  url: string;
  token?: string;
  onMessage?: (data: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

export function useWebSocket({
  url,
  token,
  onMessage,
  onOpen,
  onClose,
  onError
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('🟢 WebSocket already connected');
      return;
    }

    try {
      console.log(`🔵 Connecting to WebSocket: ${url}`);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setReconnectAttempts(0);
        
        // Authenticate immediately after connection
        if (token) {
          ws.send(JSON.stringify({ type: 'auth', payload: { token } }));
        }
        
        onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message:', data);
          onMessage?.(data);
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('🔴 WebSocket disconnected');
        setIsConnected(false);
        onClose?.();

        // Auto-reconnect
        if (reconnectAttempts < maxReconnectAttempts) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(`🔄 Reconnecting in ${timeout}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, timeout);
        } else {
          console.error('❌ Max reconnection attempts reached');
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        onError?.(error);
      };
    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
    }
  }, [url, token, onMessage, onOpen, onClose, onError, reconnectAttempts, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn('⚠️ WebSocket not connected, message not sent:', data);
    }
  }, []);

  useEffect(() => {
    if (token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [token]); // Only reconnect when token changes

  return {
    isConnected,
    send,
    connect,
    disconnect
  };
}
