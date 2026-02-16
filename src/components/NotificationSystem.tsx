import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Volume2, MessageCircle, Wifi, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "whatsapp_official" | "whatsapp_unofficial" | "internal";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export function NotificationSystem() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPopup, setShowPopup] = useState<Notification | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(70);
  const [popupEnabled, setPopupEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!user) return;

    // Load preferences
    const loadPrefs = async () => {
      const { data } = await supabase.from("notification_preferences")
        .select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setSoundEnabled(data.sound_enabled ?? true);
        setVolume((data.sound_volume ?? 0.7) * 100);
        setPopupEnabled(data.popup_enabled ?? true);
      }
    };
    loadPrefs();

    // Listen for new conversations (WhatsApp)
    const convChannel = supabase.channel("notif-conversations")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversations" }, (payload) => {
        const conv = payload.new as any;
        const type = conv.connection_type === "official" ? "whatsapp_official" : "whatsapp_unofficial";
        addNotification({
          type,
          title: "Nova conversa",
          message: `Protocolo: ${conv.protocol}`,
        });
      })
      .subscribe();

    // Listen for new messages
    const msgChannel = supabase.channel("notif-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: "sender_type=eq.contact" }, (payload) => {
        const msg = payload.new as any;
        addNotification({
          type: "whatsapp_unofficial",
          title: "Nova mensagem",
          message: msg.content?.substring(0, 50) || "Mídia recebida",
        });
      })
      .subscribe();

    // Listen for internal messages
    const internalChannel = supabase.channel("notif-internal")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "internal_messages" }, (payload) => {
        const msg = payload.new as any;
        if (msg.receiver_id === user.id) {
          addNotification({
            type: "internal",
            title: "Chat interno",
            message: msg.content?.substring(0, 50) || "Mídia recebida",
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(convChannel);
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(internalChannel);
    };
  }, [user]);

  const addNotification = (notif: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotif: Notification = {
      ...notif,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 50));

    // Play sound
    if (soundEnabled) {
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgipuur3hMLi9fhZCjsZ5bSj1Rcp+0sqR/Tzt7mKO0poVON2V0h5mtq5hcTUN7qLe0pIM+SHqWqa24kUhDhpSYrb2/kT1CkICMqr/JtYo7P4p8g5y/z8ynhEU7fHl7l7/U0biNZ0hEcXR0k7vP0rqQa0xKcnN2lbnIzbeRblFQcHRwkbfGzLeRcVdVbHNxkLPBybSRclxZaXFwj7C+x7GQclxba3Fyj62+xrCQcV5dbG9wj6u7xK2Ob11caG1ukKm6w6uNbl5caGtvkaq7xKuNb19daGpskam6w6qMb19daGptkqq7xKuNb19daGpskam6w6qMb19daGpskaq6w6qMb19d");
        }
        audioRef.current.volume = volume / 100;
        audioRef.current.play().catch(() => {});
      } catch {}
    }

    // Show popup
    if (popupEnabled) {
      setShowPopup(newNotif);
      setTimeout(() => setShowPopup(null), 3000);
    }
  };

  const savePrefs = async () => {
    if (!user) return;
    const prefs = {
      user_id: user.id,
      sound_enabled: soundEnabled,
      sound_volume: volume / 100,
      popup_enabled: popupEnabled,
    };
    const { data } = await supabase.from("notification_preferences")
      .select("id").eq("user_id", user.id).maybeSingle();
    if (data) {
      await supabase.from("notification_preferences").update(prefs).eq("user_id", user.id);
    } else {
      await supabase.from("notification_preferences").insert(prefs);
    }
  };

  useEffect(() => { savePrefs(); }, [soundEnabled, volume, popupEnabled]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const typeIcon = (type: string) => {
    switch (type) {
      case "whatsapp_official": return <Smartphone className="h-3.5 w-3.5 text-green-600" />;
      case "whatsapp_unofficial": return <Wifi className="h-3.5 w-3.5 text-green-500" />;
      case "internal": return <MessageCircle className="h-3.5 w-3.5 text-primary" />;
      default: return <Bell className="h-3.5 w-3.5" />;
    }
  };
  const typeLabel = (type: string) => {
    switch (type) {
      case "whatsapp_official": return "Oficial";
      case "whatsapp_unofficial": return "Não-oficial";
      case "internal": return "Interno";
      default: return type;
    }
  };

  return (
    <>
      {/* Popup Notification */}
      {showPopup && (
        <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-card border rounded-lg shadow-lg p-3 min-w-[280px] flex items-start gap-3">
            <div className="mt-0.5">{typeIcon(showPopup.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{showPopup.title}</span>
                <Badge variant="outline" className="text-[9px] px-1 py-0">{typeLabel(showPopup.type)}</Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">{showPopup.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bell Icon with Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="flex items-center justify-between p-3 border-b">
            <span className="text-sm font-semibold">Notificações</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setShowSettings(!showSettings)}>
                <Volume2 className="h-3.5 w-3.5" />
              </Button>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-7"
                  onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}>
                  Limpar
                </Button>
              )}
            </div>
          </div>

          {showSettings && (
            <div className="p-3 border-b space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Som</Label>
                <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Volume</Label>
                <Slider value={[volume]} onValueChange={([v]) => setVolume(v)} max={100} step={5} disabled={!soundEnabled} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Popup visual</Label>
                <Switch checked={popupEnabled} onCheckedChange={setPopupEnabled} />
              </div>
            </div>
          )}

          <ScrollArea className="max-h-[300px]">
            {notifications.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">Sem notificações</p>
            ) : notifications.map((n) => (
              <div key={n.id} className={cn("flex items-start gap-3 p-3 border-b hover:bg-muted/50 transition-colors", !n.read && "bg-primary/5")}>
                {typeIcon(n.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium">{n.title}</span>
                    <Badge variant="outline" className="text-[8px] px-1 py-0">{typeLabel(n.type)}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(n.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            ))}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </>
  );
}
