import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Webhook, Plus, Trash2, ArrowUpRight, ArrowDownLeft, ScrollText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface WebhookItem {
  id: string;
  name: string;
  url: string;
  method: string;
  direction: string;
  is_active: boolean;
}

interface WebhookLog {
  id: string;
  webhook_id: string;
  status_code: number | null;
  executed_at: string;
  webhook_name?: string;
}

export default function Webhooks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("POST");
  const [direction, setDirection] = useState("outgoing");

  const getCompanyId = async () => {
    const { data } = await supabase.from("profiles").select("company_id").eq("user_id", user!.id).maybeSingle();
    return data?.company_id;
  };

  const loadWebhooks = async () => {
    const { data } = await supabase.from("webhooks").select("id, name, url, method, direction, is_active").order("name");
    setWebhooks((data as WebhookItem[]) ?? []);
  };

  const loadLogs = async (wh: WebhookItem[]) => {
    const { data } = await supabase.from("webhook_logs").select("id, webhook_id, status_code, executed_at").order("executed_at", { ascending: false }).limit(50);
    if (data) {
      setLogs(data.map((l) => ({ ...l, webhook_name: wh.find((w) => w.id === l.webhook_id)?.name ?? "—" })));
    }
  };

  useEffect(() => { if (user) loadWebhooks(); }, [user]);
  useEffect(() => { if (webhooks.length > 0) loadLogs(webhooks); }, [webhooks]);

  const addWebhook = async () => {
    if (!name || !url) return;
    const companyId = await getCompanyId();
    if (!companyId) return;
    await supabase.from("webhooks").insert({ company_id: companyId, name, url, method, direction });
    toast({ title: "Webhook criado" });
    setDialogOpen(false); setName(""); setUrl("");
    loadWebhooks();
  };

  const toggleActive = async (w: WebhookItem) => {
    await supabase.from("webhooks").update({ is_active: !w.is_active }).eq("id", w.id);
    loadWebhooks();
  };

  const deleteWebhook = async (id: string) => {
    await supabase.from("webhooks").delete().eq("id", id);
    toast({ title: "Webhook removido" });
    loadWebhooks();
  };

  const testWebhook = async (w: WebhookItem) => {
    try {
      await fetch(w.url, {
        method: w.method, headers: { "Content-Type": "application/json" }, mode: "no-cors",
        body: w.method === "POST" ? JSON.stringify({ test: true, source: "govchat", timestamp: new Date().toISOString() }) : undefined,
      });
      await supabase.from("webhook_logs").insert({ webhook_id: w.id, status_code: 200 });
      toast({ title: "Webhook testado" });
    } catch {
      await supabase.from("webhook_logs").insert({ webhook_id: w.id, status_code: 500 });
      toast({ variant: "destructive", title: "Erro ao testar" });
    }
    loadLogs(webhooks);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Webhooks</h1>
      <Tabs defaultValue="config">
        <TabsList>
          <TabsTrigger value="config" className="gap-1.5"><Webhook className="h-3.5 w-3.5" /> Configuração</TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5"><ScrollText className="h-3.5 w-3.5" /> Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="config">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Webhooks</CardTitle>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Novo Webhook</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2"><Label>Nome *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                    <div className="space-y-2"><Label>URL *</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Método</Label><Select value={method} onValueChange={setMethod}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="POST">POST</SelectItem><SelectItem value="GET">GET</SelectItem></SelectContent></Select></div>
                      <div className="space-y-2"><Label>Direção</Label><Select value={direction} onValueChange={setDirection}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="outgoing">Saída</SelectItem><SelectItem value="incoming">Entrada</SelectItem></SelectContent></Select></div>
                    </div>
                    <Button onClick={addWebhook} className="w-full">Criar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>URL</TableHead><TableHead>Método</TableHead><TableHead>Dir.</TableHead><TableHead>Ativo</TableHead><TableHead className="w-[100px]">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {webhooks.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum webhook.</TableCell></TableRow>
                  ) : webhooks.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-medium">{w.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">{w.url}</TableCell>
                      <TableCell><Badge variant="outline">{w.method}</Badge></TableCell>
                      <TableCell>{w.direction === "outgoing" ? <ArrowUpRight className="h-4 w-4 text-info" /> : <ArrowDownLeft className="h-4 w-4 text-success" />}</TableCell>
                      <TableCell><Switch checked={w.is_active} onCheckedChange={() => toggleActive(w)} /></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => testWebhook(w)}>Testar</Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteWebhook(w.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="logs">
          <Card>
            <CardHeader><CardTitle className="text-base">Logs de Execução</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Webhook</TableHead><TableHead>Status</TableHead><TableHead>Data/Hora</TableHead></TableRow></TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Sem logs.</TableCell></TableRow>
                  ) : logs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.webhook_name}</TableCell>
                      <TableCell><Badge variant={l.status_code === 200 ? "default" : "destructive"}>{l.status_code ?? "?"}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(l.executed_at).toLocaleString("pt-BR")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
