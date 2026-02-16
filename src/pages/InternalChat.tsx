import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Send, Paperclip, Search, Smile, Mic, MicOff, MessageCircle,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ChatUser {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  status: string;
  unread_count: number;
}

interface IMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  is_read: boolean;
  created_at: string;
}

export default function InternalChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [recording, setRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const loadUsers = async () => {
      const { data: profile } = await supabase.from("profiles").select("company_id").eq("user_id", user.id).maybeSingle();
      if (!profile) return;
      const { data: profiles } = await supabase.from("profiles")
        .select("user_id, full_name, avatar_url, status")
        .eq("company_id", profile.company_id)
        .neq("user_id", user.id);

      if (profiles) {
        const chatUsers: ChatUser[] = [];
        for (const p of profiles) {
          const { count } = await supabase.from("internal_messages")
            .select("id", { count: "exact", head: true })
            .eq("sender_id", p.user_id)
            .eq("receiver_id", user.id)
            .eq("is_read", false);
          chatUsers.push({ ...p, status: p.status ?? "offline", unread_count: count ?? 0 });
        }
        setUsers(chatUsers);
      }
    };
    loadUsers();

    const channel = supabase.channel("internal-msg-notify")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "internal_messages" }, (payload) => {
        const msg = payload.new as IMessage;
        if (msg.receiver_id === user.id) {
          // Play notification sound
          try {
            const audio = new Audio("/notification.mp3");
            audio.volume = 0.5;
            audio.play().catch(() => {});
          } catch {}
          loadUsers();
        }
        if (selectedUser && (msg.sender_id === selectedUser.user_id || msg.receiver_id === selectedUser.user_id)) {
          setMessages(prev => [...prev, msg]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, selectedUser]);

  useEffect(() => {
    if (!selectedUser || !user) return;
    const loadMessages = async () => {
      const { data } = await supabase.from("internal_messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.user_id}),and(sender_id.eq.${selectedUser.user_id},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });
      setMessages((data as IMessage[]) ?? []);
      // Mark as read
      await supabase.from("internal_messages")
        .update({ is_read: true })
        .eq("sender_id", selectedUser.user_id)
        .eq("receiver_id", user.id)
        .eq("is_read", false);
    };
    loadMessages();
  }, [selectedUser, user]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !user) return;
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("user_id", user.id).maybeSingle();
    if (!profile) return;
    await supabase.from("internal_messages").insert({
      company_id: profile.company_id,
      sender_id: user.id,
      receiver_id: selectedUser.user_id,
      content: newMessage.trim(),
    });
    setNewMessage("");
    setShowEmoji(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUser || !user) return;
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("user_id", user.id).maybeSingle();
    if (!profile) return;

    const path = `internal-chat/${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file);
    if (uploadError) { toast({ title: "Erro no upload", variant: "destructive" }); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);

    const mediaType = file.type.startsWith("image/") ? "image" : file.type.startsWith("audio/") ? "audio" : "file";
    await supabase.from("internal_messages").insert({
      company_id: profile.company_id,
      sender_id: user.id,
      receiver_id: selectedUser.user_id,
      content: file.name,
      media_url: urlData.publicUrl,
      media_type: mediaType,
    });
  };

  const toggleRecording = () => {
    if (recording) {
      setRecording(false);
      toast({ title: "Gravação parada (funcionalidade requer backend de áudio)" });
    } else {
      setRecording(true);
      toast({ title: "Gravando áudio..." });
    }
  };

  const filteredUsers = users.filter(u => u.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const statusColor: Record<string, string> = { online: "bg-green-500", offline: "bg-muted-foreground", busy: "bg-yellow-500" };

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-0 rounded-lg border bg-card overflow-hidden">
      {/* Users List */}
      <div className={cn("w-72 border-r flex flex-col shrink-0", selectedUser && "max-md:hidden")}>
        <div className="p-3 border-b">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-sm">Chat Interno</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar colega..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-8 text-xs" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {filteredUsers.map((u) => (
            <button key={u.user_id} onClick={() => setSelectedUser(u)}
              className={cn("w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors border-b", selectedUser?.user_id === u.user_id && "bg-muted")}>
              <div className="relative">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">{u.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className={cn("absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card", statusColor[u.status] ?? statusColor.offline)} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium truncate block">{u.full_name}</span>
                <span className="text-[10px] text-muted-foreground capitalize">{u.status}</span>
              </div>
              {u.unread_count > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">{u.unread_count}</span>
              )}
            </button>
          ))}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      {selectedUser ? (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-3 p-3 border-b">
            <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setSelectedUser(null)}>←</Button>
            <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary/10 text-primary text-xs">{selectedUser.full_name.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
            <div>
              <p className="text-sm font-medium">{selectedUser.full_name}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{selectedUser.status}</p>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("max-w-[75%] rounded-lg px-3 py-2", msg.sender_id === user?.id ? "ml-auto bg-primary text-primary-foreground" : "bg-muted")}>
                  {msg.media_url && msg.media_type === "image" && (
                    <img src={msg.media_url} alt="" className="max-w-full rounded mb-1" />
                  )}
                  {msg.media_url && msg.media_type === "file" && (
                    <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="text-xs underline block mb-1">📎 {msg.content}</a>
                  )}
                  {(!msg.media_url || msg.media_type !== "image") && msg.content && (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                  <p className={cn("text-[10px] mt-1", msg.sender_id === user?.id ? "text-primary-foreground/70 text-right" : "text-muted-foreground")}>{formatTime(msg.created_at)}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="relative">
            {showEmoji && (
              <div className="absolute bottom-full left-0 z-50">
                <EmojiPicker onEmojiClick={(e) => setNewMessage(prev => prev + e.emoji)} height={350} width={300} />
              </div>
            )}
            <div className="p-3 border-t flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setShowEmoji(!showEmoji)}>
                <Smile className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="h-4 w-4" />
              </Button>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.xlsx,.xls,.doc,.docx" />
              <Input placeholder="Digite uma mensagem..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()} className="h-8 text-sm" />
              <Button variant="ghost" size="icon" className={cn("h-8 w-8 shrink-0", recording && "text-destructive")} onClick={toggleRecording}>
                {recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button size="icon" className="h-8 w-8 shrink-0" onClick={sendMessage} disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Selecione um colega para conversar</p>
          </div>
        </div>
      )}
    </div>
  );
}
