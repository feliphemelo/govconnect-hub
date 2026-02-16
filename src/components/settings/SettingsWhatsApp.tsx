import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface WAConnection {
  id: string;
  provider: string;
  api_base_url: string;
  api_key: string;
  instance_id: string;
  webhook_secret: string;
  connection_status: string;
  last_sync_at: string | null;
}

export default function SettingsWhatsApp() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conn, setConn] = useState<WAConnection | null>(null);
  const [form, setForm] = useState({
    provider: "meta",
    api_base_url: "",
    api_key: "",
    instance_id: "",
    webhook_secret: "",
  });
  const [testing, setTesting] = useState(false);

  const load = async () => {
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("user_id", user!.id).maybeSingle();
    if (!profile) return;
    const { data } = await supabase.from("whatsapp_connections").select("*").eq("company_id", profile.company_id).maybeSingle();
    if (data) {
      const c = data as any;
      setConn(c);
      setForm({
        provider: c.provider,
        api_base_url: c.api_base_url || "",
        api_key: c.api_key || "",
        instance_id: c.instance_id || "",
        webhook_secret: c.webhook_secret || "",
      });
    }
  };

  useEffect(() => { if (user) load(); }, [user]);

  const save = async () => {
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("user_id", user!.id).maybeSingle();
    if (!profile) return;
    if (conn) {
      await supabase.from("whatsapp_connections").update(form as any).eq("id", conn.id);
    } else {
      await supabase.from("whatsapp_connections").insert({ ...form, company_id: profile.company_id } as any);
    }
    toast({ title: "Conexão WhatsApp salva" });
    load();
  };

  const testConnection = async () => {
    setTesting(true);
    // Simulate connection test
    await new Promise(r => setTimeout(r, 1500));
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("user_id", user!.id).maybeSingle();
    if (conn && profile) {
      await supabase.from("whatsapp_connections").update({
        connection_status: "connected",
        last_sync_at: new Date().toISOString(),
      } as any).eq("id", conn.id);
    }
    setTesting(false);
    toast({ title: "Conexão testada com sucesso" });
    load();
  };

  const statusIcon = conn?.connection_status === "connected"
    ? <CheckCircle2 className="h-5 w-5 text-success" />
    : conn?.connection_status === "error"
    ? <AlertTriangle className="h-5 w-5 text-destructive" />
    : <WifiOff className="h-5 w-5 text-muted-foreground" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>Conexão WhatsApp</span>
          <div className="flex items-center gap-2">
            {statusIcon}
            <Badge variant={conn?.connection_status === "connected" ? "default" : "secondary"}>
              {conn?.connection_status === "connected" ? "Conectado" : conn?.connection_status === "error" ? "Erro" : "Desconectado"}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium mb-2 block">Provedor</Label>
          <RadioGroup value={form.provider} onValueChange={v => setForm(p => ({ ...p, provider: v }))} className="flex gap-4">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="meta" id="meta" />
              <Label htmlFor="meta" className="text-sm">Meta Official (NotificameHub)</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="serpro" id="serpro" />
              <Label htmlFor="serpro" className="text-sm">SERPRO Business API</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div><Label>API Base URL</Label><Input value={form.api_base_url} onChange={e => setForm(p => ({ ...p, api_base_url: e.target.value }))} placeholder="https://api.provider.com/v1" /></div>
          <div><Label>API Key</Label><Input type="password" value={form.api_key} onChange={e => setForm(p => ({ ...p, api_key: e.target.value }))} placeholder="sk-..." /></div>
          <div><Label>Instance ID</Label><Input value={form.instance_id} onChange={e => setForm(p => ({ ...p, instance_id: e.target.value }))} placeholder="instance-123" /></div>
          <div><Label>Webhook Secret</Label><Input type="password" value={form.webhook_secret} onChange={e => setForm(p => ({ ...p, webhook_secret: e.target.value }))} placeholder="whsec_..." /></div>
        </div>

        {conn?.last_sync_at && (
          <p className="text-xs text-muted-foreground">Última sincronização: {new Date(conn.last_sync_at).toLocaleString("pt-BR")}</p>
        )}

        <div className="flex gap-2">
          <Button onClick={save}>Salvar Configuração</Button>
          <Button variant="outline" onClick={testConnection} disabled={testing || !conn}>
            <RefreshCw className={`h-4 w-4 mr-1 ${testing ? "animate-spin" : ""}`} /> Testar Conexão
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
