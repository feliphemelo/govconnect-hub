import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Send, Paperclip, Search, Phone, MoreVertical, CheckCheck, X, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  protocol: string;
  status: string;
  updated_at: string;
  contact: { id: string; name: string; phone: string };
  last_message?: string;
  unread_count: number;
}

interface Message {
  id: string;
  sender_type: string;
  content: string | null;
  created_at: string;
  is_read: boolean;
}

export default function Chat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [spyMode, setSpyMode] = useState(false);
  const [spyConvoId, setSpyConvoId] = useState<string | null>(null);
  const [spyMessages, setSpyMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check admin role
  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      setIsAdmin(data?.role === "admin");
    });
  }, [user]);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    const loadConversations = async () => {
      const { data } = await supabase
        .from("conversations")
        .select("id, protocol, status, updated_at, contact_id")
        .in("status", ["pending", "active", "waiting"])
        .order("updated_at", { ascending: false });

      if (data) {
        const convos: Conversation[] = [];
        for (const c of data) {
          const { data: contact } = await supabase.from("contacts").select("id, name, phone").eq("id", c.contact_id).maybeSingle();
          const { data: lastMsg } = await supabase.from("messages").select("content").eq("conversation_id", c.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
          const { count } = await supabase.from("messages").select("id", { count: "exact", head: true }).eq("conversation_id", c.id).eq("is_read", false).eq("sender_type", "contact");
          convos.push({ ...c, contact: contact ?? { id: "", name: "Desconhecido", phone: "" }, last_message: lastMsg?.content ?? "", unread_count: count ?? 0 });
        }
        setConversations(convos);
      }
      setLoading(false);
    };
    loadConversations();

    const channel = supabase.channel("conversations-changes").on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => { loadConversations(); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Load messages
  useEffect(() => {
    if (!selectedConvo) return;
    const loadMessages = async () => {
      const { data } = await supabase.from("messages").select("id, sender_type, content, created_at, is_read").eq("conversation_id", selectedConvo.id).order("created_at", { ascending: true });
      setMessages(data ?? []);
      await supabase.from("messages").update({ is_read: true } as any).eq("conversation_id", selectedConvo.id).eq("sender_type", "contact").eq("is_read", false);
    };
    loadMessages();

    const channel = supabase.channel(`messages-${selectedConvo.id}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selectedConvo.id}` }, (payload) => {
      setMessages((prev) => [...prev, payload.new as Message]);
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedConvo]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConvo || !user) return;
    await supabase.from("messages").insert({ conversation_id: selectedConvo.id, sender_type: "agent", sender_id: user.id, content: newMessage.trim() });
    if (selectedConvo.status === "pending") {
      await supabase.from("conversations").update({ status: "active", assigned_to: user.id }).eq("id", selectedConvo.id);
    }
    setNewMessage("");
  };

  const closeConversation = async () => {
    if (!selectedConvo) return;
    await supabase.from("conversations").update({ status: "closed", closed_at: new Date().toISOString() }).eq("id", selectedConvo.id);
    setSelectedConvo(null);
  };

  // Spy mode
  const startSpy = async (convoId: string) => {
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("user_id", user!.id).maybeSingle();
    if (!profile) return;
    await supabase.from("spy_logs").insert({ company_id: profile.company_id, spy_user_id: user!.id, conversation_id: convoId } as any);
    setSpyConvoId(convoId);
    setSpyMode(true);
    const { data } = await supabase.from("messages").select("id, sender_type, content, created_at, is_read").eq("conversation_id", convoId).order("created_at", { ascending: true });
    setSpyMessages(data ?? []);
    toast({ title: "Modo espião ativado", description: "Visualização somente leitura. Ação registrada." });
  };

  const filteredConvos = conversations.filter((c) =>
    c.contact.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.protocol.includes(searchTerm)
  );

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const statusLabel: Record<string, string> = { pending: "Aguardando", active: "Em atendimento", waiting: "Esperando", closed: "Finalizado" };

  return (
    <>
      <div className="flex h-[calc(100vh-7rem)] gap-0 rounded-lg border bg-card overflow-hidden">
        {/* Conversation List */}
        <div className={cn("w-80 border-r flex flex-col shrink-0", selectedConvo && "max-md:hidden")}>
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar conversa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-9" />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? <p className="p-4 text-sm text-muted-foreground">Carregando...</p> : filteredConvos.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Nenhuma conversa encontrada.</p> : (
              filteredConvos.map((c) => (
                <button key={c.id} onClick={() => setSelectedConvo(c)} className={cn("w-full flex items-start gap-3 p-3 text-left hover:bg-muted/50 transition-colors border-b", selectedConvo?.id === c.id && "bg-muted")}>
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">{c.contact.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{c.contact.name}</span>
                      <span className="text-[10px] text-muted-foreground">{formatTime(c.updated_at)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{c.last_message || "Sem mensagens"}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{statusLabel[c.status]}</Badge>
                      {c.unread_count > 0 && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">{c.unread_count}</span>}
                      {isAdmin && (
                        <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto" onClick={(e) => { e.stopPropagation(); startSpy(c.id); }} title="Espiar conversa">
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        {selectedConvo ? (
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between p-3 border-b bg-card">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setSelectedConvo(null)}><X className="h-4 w-4" /></Button>
                <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary/10 text-primary text-xs">{selectedConvo.contact.name.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                <div>
                  <p className="text-sm font-medium">{selectedConvo.contact.name}</p>
                  <p className="text-[11px] text-muted-foreground">{selectedConvo.contact.phone} · {selectedConvo.protocol}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closeConversation} title="Finalizar"><CheckCheck className="h-4 w-4 text-success" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Phone className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={cn("max-w-[75%] rounded-lg px-3 py-2", msg.sender_type === "agent" ? "ml-auto bg-primary text-primary-foreground" : msg.sender_type === "system" ? "mx-auto bg-muted text-muted-foreground text-center text-xs max-w-full" : "bg-muted")}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className={cn("text-[10px] mt-1", msg.sender_type === "agent" ? "text-primary-foreground/70 text-right" : "text-muted-foreground")}>{formatTime(msg.created_at)}</p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-3 border-t flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0"><Paperclip className="h-4 w-4" /></Button>
              <Input placeholder="Digite uma mensagem..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()} className="h-9" />
              <Button size="icon" className="h-9 w-9 shrink-0" onClick={sendMessage} disabled={!newMessage.trim()}><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MsgIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Selecione uma conversa para iniciar o atendimento</p>
            </div>
          </div>
        )}
      </div>

      {/* Spy Mode Dialog */}
      <Dialog open={spyMode} onOpenChange={(open) => { if (!open) { setSpyMode(false); setSpyConvoId(null); } }}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Eye className="h-4 w-4" /> Modo Espião (Somente Leitura)</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 p-2">
              {spyMessages.map((msg) => (
                <div key={msg.id} className={cn("max-w-[80%] rounded-lg px-3 py-2", msg.sender_type === "agent" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted")}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-[10px] mt-1 text-muted-foreground">{formatTime(msg.created_at)}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MsgIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
