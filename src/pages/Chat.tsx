import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiClient } from "@/lib/apiClient";
import { Send, Phone, Video, MoreVertical, Search, MessageSquare } from "lucide-react";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
  is_from_customer: boolean;
}

interface Conversation {
  id: string;
  contact_id: string;
  contact_name: string;
  contact_phone: string;
  status: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
}

export default function Chat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Get WebSocket URL
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
  const token = localStorage.getItem('govchat_token') || undefined;

  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'message':
        if (data.payload.conversationId === selectedConversation?.id) {
          setMessages(prev => [...prev, {
            id: data.payload.id || Date.now().toString(),
            conversation_id: data.payload.conversationId,
            sender_id: data.payload.userId,
            content: data.payload.content,
            message_type: 'text',
            created_at: data.payload.timestamp,
            is_from_customer: data.payload.userId !== user?.id
          }]);
          scrollToBottom();
        }
        break;
      case 'typing':
        if (data.payload.conversationId === selectedConversation?.id && data.payload.userId !== user?.id) {
          setIsTyping(data.payload.isTyping);
        }
        break;
    }
  }, [selectedConversation, user]);

  const { isConnected, send } = useWebSocket({
    url: wsUrl,
    token,
    onMessage: handleWebSocketMessage,
    onOpen: () => {
      console.log('✅ Chat WebSocket connected');
      if (selectedConversation) {
        send({ type: 'join', payload: { conversationId: selectedConversation.id } });
      }
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    try {
      const data = await apiClient.conversations.list();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const data = await apiClient.get(`/conversations/${conversationId}/messages`);
      setMessages(data.messages || []);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('❌ Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    const tempMessage: Message = {
      id: Date.now().toString(),
      conversation_id: selectedConversation.id,
      sender_id: user?.id || '',
      content: messageText,
      message_type: 'text',
      created_at: new Date().toISOString(),
      is_from_customer: false
    };

    setMessages(prev => [...prev, tempMessage]);
    setMessageText("");
    scrollToBottom();

    // Send via WebSocket
    if (isConnected) {
      send({
        type: 'message',
        payload: {
          conversationId: selectedConversation.id,
          content: messageText,
          messageType: 'text'
        }
      });
    }

    // Also save to database
    try {
      await apiClient.post(`/conversations/${selectedConversation.id}/messages`, {
        content: messageText,
        message_type: 'text'
      });
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  };

  const handleTyping = () => {
    if (selectedConversation && isConnected) {
      send({ type: 'typing', payload: { conversationId: selectedConversation.id, isTyping: true } });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        send({ type: 'typing', payload: { conversationId: selectedConversation.id, isTyping: false } });
      }, 2000);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      if (isConnected) {
        send({ type: 'join', payload: { conversationId: selectedConversation.id } });
      }
    }
  }, [selectedConversation?.id, isConnected]);

  const filteredConversations = conversations.filter(conv =>
    conv.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.contact_phone?.includes(searchTerm)
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Conversas</h2>
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "Online" : "Offline"}
            </Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">Carregando...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-4 text-left hover:bg-accent transition-colors border-b ${
                  selectedConversation?.id === conv.id ? 'bg-accent' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarFallback>{conv.contact_name?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium truncate">{conv.contact_name || 'Sem nome'}</p>
                      {conv.unread_count ? (
                        <Badge variant="default" className="text-xs">{conv.unread_count}</Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.last_message || conv.contact_phone}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{selectedConversation.contact_name?.[0] || '?'}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{selectedConversation.contact_name || 'Sem nome'}</h3>
                <p className="text-sm text-muted-foreground">{selectedConversation.contact_phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon"><Phone className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon"><Video className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.is_from_customer ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[70%] rounded-lg p-3 ${
                    msg.is_from_customer
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-primary text-primary-foreground'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Digitando...</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={messageText}
                onChange={(e) => {
                  setMessageText(e.target.value);
                  handleTyping();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <Button onClick={sendMessage} size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>Selecione uma conversa para começar</p>
          </div>
        </div>
      )}
    </div>
  );
}
