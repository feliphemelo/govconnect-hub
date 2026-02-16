import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const MODELS: Record<string, { label: string; models: { value: string; label: string }[] }> = {
  lovable: {
    label: "Lovable AI (incluso)",
    models: [
      { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash" },
      { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { value: "openai/gpt-5-mini", label: "GPT-5 Mini" },
      { value: "openai/gpt-5", label: "GPT-5" },
    ],
  },
  openai: {
    label: "OpenAI (chave própria)",
    models: [
      { value: "gpt-4o-mini", label: "GPT-4o Mini" },
      { value: "gpt-4o", label: "GPT-4o" },
      { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
      { value: "o1", label: "GPT-o1" },
    ],
  },
  anthropic: {
    label: "Anthropic (chave própria)",
    models: [
      { value: "claude-3-haiku", label: "Claude 3 Haiku" },
      { value: "claude-3-sonnet", label: "Claude 3 Sonnet" },
      { value: "claude-3-opus", label: "Claude 3 Opus" },
      { value: "claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
    ],
  },
};

export default function SettingsAIProvider() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<any>(null);
  const [form, setForm] = useState({
    provider: "lovable",
    model: "google/gemini-3-flash-preview",
    api_key: "",
    monthly_limit: 2500,
    block_on_limit: true,
  });

  const load = async () => {
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("user_id", user!.id).maybeSingle();
    if (!profile) return;
    const { data } = await supabase.from("ai_provider_config").select("*").eq("company_id", profile.company_id).maybeSingle();
    if (data) {
      const c = data as any;
      setConfig(c);
      setForm({ provider: c.provider, model: c.model, api_key: c.api_key || "", monthly_limit: c.monthly_limit, block_on_limit: c.block_on_limit });
    }
  };

  useEffect(() => { if (user) load(); }, [user]);

  const save = async () => {
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("user_id", user!.id).maybeSingle();
    if (!profile) return;
    if (config) {
      await supabase.from("ai_provider_config").update(form as any).eq("id", config.id);
    } else {
      await supabase.from("ai_provider_config").insert({ ...form, company_id: profile.company_id } as any);
    }
    toast({ title: "Configuração de IA salva" });
    load();
  };

  const usagePercent = config ? Math.min((config.used_this_month / config.monthly_limit) * 100, 100) : 0;

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Configuração de IA</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {config && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Uso mensal</span>
              <span className="font-medium">{config.used_this_month?.toLocaleString("pt-BR")} / {config.monthly_limit?.toLocaleString("pt-BR")}</span>
            </div>
            <Progress value={usagePercent} className="h-2" />
          </div>
        )}

        <div>
          <Label>Provedor</Label>
          <Select value={form.provider} onValueChange={v => {
            setForm(p => ({ ...p, provider: v, model: MODELS[v].models[0].value }));
          }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(MODELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Modelo</Label>
          <Select value={form.model} onValueChange={v => setForm(p => ({ ...p, model: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MODELS[form.provider]?.models.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {form.provider !== "lovable" && (
          <div><Label>API Key</Label><Input type="password" value={form.api_key} onChange={e => setForm(p => ({ ...p, api_key: e.target.value }))} placeholder="sk-..." /></div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div><Label>Limite mensal de interações</Label><Input type="number" value={form.monthly_limit} onChange={e => setForm(p => ({ ...p, monthly_limit: +e.target.value }))} /></div>
          <div className="flex items-center gap-2 pt-6">
            <Switch checked={form.block_on_limit} onCheckedChange={v => setForm(p => ({ ...p, block_on_limit: v }))} />
            <Label className="text-sm">Bloquear ao atingir limite</Label>
          </div>
        </div>

        <Button onClick={save}>Salvar</Button>
      </CardContent>
    </Card>
  );
}
