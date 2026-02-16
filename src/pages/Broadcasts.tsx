import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Broadcast {
  id: string;
  name: string;
  content: string;
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  recipient_count: number;
  created_at: string;
}

export default function Broadcasts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [targetType, setTargetType] = useState("all");
  const [scheduledAt, setScheduledAt] = useState("");

  const getCompanyId = async () => {
    const { data } = await supabase.from("profiles").select("company_id").eq("user_id", user!.id).maybeSingle();
    return data?.company_id;
  };

  const load = async () => {
    const { data } = await supabase.from("broadcasts").select("*").order("created_at", { ascending: false });
    setBroadcasts((data as Broadcast[]) ?? []);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const createBroadcast = async () => {
    if (!name || !content) return;
    const companyId = await getCompanyId();
    if (!companyId) return;
    const { count } = await supabase.from("contacts").select("id", { count: "exact", head: true }).eq("is_blocked", false);
    await supabase.from("broadcasts").insert({
      company_id: companyId, name, content, target_type: targetType,
      status: scheduledAt ? "scheduled" : "draft",
      scheduled_at: scheduledAt || null, recipient_count: count ?? 0, created_by: user!.id,
    });
    toast({ title: "Disparo criado" });
    setDialogOpen(false); setName(""); setContent(""); setScheduledAt("");
    load();
  };

  const sendNow = async (id: string) => {
    await supabase.from("broadcasts").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", id);
    toast({ title: "Disparo enviado (simulado)" });
    load();
  };

  const deleteBroadcast = async (id: string) => {
    await supabase.from("broadcasts").delete().eq("id", id);
    load();
  };

  const statusBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    draft: { label: "Rascunho", variant: "secondary" },
    scheduled: { label: "Agendado", variant: "outline" },
    sent: { label: "Enviado", variant: "default" },
    failed: { label: "Falha", variant: "destructive" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Disparos</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Disparo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Disparo</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nome *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="space-y-2"><Label>Mensagem *</Label><Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} /></div>
              <div className="space-y-2">
                <Label>Destino</Label>
                <Select value={targetType} onValueChange={setTargetType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os contatos</SelectItem><SelectItem value="group">Grupo específico</SelectItem></SelectContent></Select>
              </div>
              <div className="space-y-2"><Label>Agendar (opcional)</Label><Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} /></div>
              <Button onClick={createBroadcast} className="w-full">Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Status</TableHead><TableHead>Destinatários</TableHead><TableHead>Agendado</TableHead><TableHead className="w-[100px]">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {broadcasts.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum disparo.</TableCell></TableRow>
              ) : broadcasts.map((b) => {
                const badge = statusBadge[b.status] || statusBadge.draft;
                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell><Badge variant={badge.variant}>{badge.label}</Badge></TableCell>
                    <TableCell>{b.recipient_count}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{b.scheduled_at ? new Date(b.scheduled_at).toLocaleString("pt-BR") : "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {b.status === "draft" && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => sendNow(b.id)}><Send className="h-3.5 w-3.5 text-primary" /></Button>}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteBroadcast(b.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
