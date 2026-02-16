import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Plus, Wifi, WifiOff, RefreshCw, Trash2, QrCode, Phone, Loader2, AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Session {
  id: string;
  engine_type: string;
  phone_number: string | null;
  instance_name: string | null;
  status: string;
  qr_code: string | null;
  last_activity: string | null;
  created_at: string;
}

interface SessionLog {
  id: string;
  action: string;
  details: string | null;
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  connected: { label: "Conectado", variant: "default" },
  connecting: { label: "Conectando...", variant: "secondary" },
  disconnected: { label: "Desconectado", variant: "outline" },
  failed: { label: "Falha", variant: "destructive" },
};

export default function SettingsWhatsAppSessions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [logs, setLogs] = useState<SessionLog[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showLogs, setShowLogs] = useState<string | null>(null);
  const [newEngine, setNewEngine] = useState("baileys");
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);

  const loadCompany = async () => {
    if (!user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (profile) {
      setCompanyId(profile.company_id);
      return profile.company_id;
    }
    return null;
  };

  const loadSessions = async (cid?: string) => {
    const id = cid || companyId;
    if (!id) return;
    const { data } = await supabase
      .from("whatsapp_sessions")
      .select("*")
      .eq("company_id", id)
      .order("created_at", { ascending: false });
    setSessions((data as Session[]) ?? []);
  };

  const loadLogs = async (sessionId: string) => {
    const { data } = await supabase
      .from("whatsapp_session_logs")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(50);
    setLogs((data as SessionLog[]) ?? []);
    setShowLogs(sessionId);
  };

  useEffect(() => {
    loadCompany().then((cid) => {
      if (cid) loadSessions(cid);
    });
  }, [user]);

  const createSession = async () => {
    if (!companyId || !newName) return;
    setLoading(true);
    const { error } = await supabase.from("whatsapp_sessions").insert({
      company_id: companyId,
      engine_type: newEngine,
      instance_name: newName,
      status: "connecting",
      qr_code: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=govchat-${newName}-${Date.now()}`,
    } as any);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      await logAction(null, "session_created", `Engine: ${newEngine}, Instance: ${newName}`);
      toast({ title: "Sessão criada! Escaneie o QR Code." });
      setShowCreate(false);
      setNewName("");
      loadSessions();
    }
    setLoading(false);
  };

  const logAction = async (sessionId: string | null, action: string, details?: string) => {
    if (!companyId) return;
    if (sessionId) {
      await supabase.from("whatsapp_session_logs").insert({
        session_id: sessionId,
        company_id: companyId,
        action,
        details,
        user_id: user?.id,
      } as any);
    }
  };

  const reconnect = async (session: Session) => {
    await supabase.from("whatsapp_sessions").update({
      status: "connecting",
      qr_code: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=govchat-reconnect-${Date.now()}`,
    } as any).eq("id", session.id);
    await logAction(session.id, "reconnect_attempt", "Manual reconnect triggered");
    toast({ title: "Reconectando..." });

    // Simulate connection after 2s
    setTimeout(async () => {
      await supabase.from("whatsapp_sessions").update({
        status: "connected",
        last_activity: new Date().toISOString(),
        qr_code: null,
      } as any).eq("id", session.id);
      await logAction(session.id, "connected", "Connection established");
      loadSessions();
    }, 2000);
    loadSessions();
  };

  const disconnect = async (session: Session) => {
    await supabase.from("whatsapp_sessions").update({ status: "disconnected", qr_code: null } as any).eq("id", session.id);
    await logAction(session.id, "disconnected", "Manual disconnect");
    toast({ title: "Desconectado" });
    loadSessions();
  };

  const deleteSession = async (session: Session) => {
    await supabase.from("whatsapp_sessions").delete().eq("id", session.id);
    toast({ title: "Sessão removida" });
    loadSessions();
  };

  const statusBadge = (status: string) => {
    const s = STATUS_MAP[status] ?? { label: status, variant: "outline" as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Conexões WhatsApp Não-Oficiais</CardTitle>
            <CardDescription>Gerencie sessões Baileys ou LibZapitu</CardDescription>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Conexão</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar Conexão</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Engine</Label>
                  <Select value={newEngine} onValueChange={setNewEngine}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baileys">Baileys</SelectItem>
                      <SelectItem value="libzapitu">LibZapitu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nome da Instância</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="ex: atendimento-01" />
                </div>
                <Button onClick={createSession} disabled={loading || !newName} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <QrCode className="h-4 w-4 mr-1" />}
                  Criar e Gerar QR Code
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          {sessions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Nenhuma sessão não-oficial configurada.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instância</TableHead>
                  <TableHead>Engine</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última Atividade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.instance_name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs capitalize">{s.engine_type}</Badge>
                    </TableCell>
                    <TableCell>
                      {s.phone_number ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" /> {s.phone_number}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>{statusBadge(s.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {s.last_activity ? new Date(s.last_activity).toLocaleString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {s.status === "connecting" && s.qr_code && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="icon" className="h-8 w-8" title="Ver QR Code">
                                <QrCode className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-xs">
                              <DialogHeader><DialogTitle>Escaneie o QR Code</DialogTitle></DialogHeader>
                              <div className="flex justify-center p-4">
                                <img src={s.qr_code} alt="QR Code" className="w-48 h-48" />
                              </div>
                              <p className="text-xs text-muted-foreground text-center">
                                Abra o WhatsApp no celular → Dispositivos conectados → Conectar dispositivo
                              </p>
                            </DialogContent>
                          </Dialog>
                        )}
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => reconnect(s)} title="Reconectar">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        {s.status === "connected" && (
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => disconnect(s)} title="Desconectar">
                            <WifiOff className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="outline" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => loadLogs(s.id)} title="Logs">
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteSession(s)} title="Excluir">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Logs Dialog */}
      <Dialog open={!!showLogs} onOpenChange={() => setShowLogs(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Logs da Sessão</DialogTitle></DialogHeader>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum log encontrado.</p>
            ) : logs.map((l) => (
              <div key={l.id} className="flex justify-between items-start border-b border-border pb-2 text-sm">
                <div>
                  <span className="font-medium">{l.action}</span>
                  {l.details && <p className="text-xs text-muted-foreground">{l.details}</p>}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                  {new Date(l.created_at).toLocaleString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
