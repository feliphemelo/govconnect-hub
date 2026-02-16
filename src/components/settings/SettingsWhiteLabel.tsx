import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Palette, Upload, Globe, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface CompanySettings {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  lgpd_terms_url: string | null;
  plan: string | null;
  max_users: number | null;
  max_ai_interactions: number | null;
}

export default function SettingsWhiteLabel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [lgpdUrl, setLgpdUrl] = useState("");

  const load = async () => {
    if (!user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile?.company_id) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("companies")
      .select("id, name, slug, logo_url, primary_color, lgpd_terms_url, plan, max_users, max_ai_interactions")
      .eq("id", profile.company_id)
      .maybeSingle();

    if (data) {
      setCompany(data);
      setName(data.name);
      setSlug(data.slug);
      setLogoUrl(data.logo_url ?? "");
      setPrimaryColor(data.primary_color ?? "#3b82f6");
      setLgpdUrl(data.lgpd_terms_url ?? "");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const save = async () => {
    if (!company || !name || !slug) return;
    setSaving(true);

    const { error } = await supabase
      .from("companies")
      .update({
        name,
        slug,
        logo_url: logoUrl || null,
        primary_color: primaryColor || null,
        lgpd_terms_url: lgpdUrl || null,
      })
      .eq("id", company.id);

    setSaving(false);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Configurações salvas com sucesso" });
      load();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Carregando...
        </CardContent>
      </Card>
    );
  }

  if (!company) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Nenhuma empresa vinculada ao seu perfil.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Identidade Visual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4" /> Identidade Visual
          </CardTitle>
          <CardDescription>
            Personalize a aparência da plataforma para sua organização
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da Organização *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Prefeitura Municipal" />
          </div>

          <div className="space-y-2">
            <Label>Slug (identificador único) *</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="ex: prefeitura-sp" />
            <p className="text-xs text-muted-foreground">Usado na URL de acesso. Apenas letras minúsculas, números e hífens.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>URL do Logotipo</Label>
              <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://exemplo.com/logo.png" />
              {logoUrl && (
                <div className="mt-2 p-3 rounded-lg border bg-muted/50 flex items-center justify-center">
                  <img src={logoUrl} alt="Logo preview" className="max-h-16 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Cor Primária</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-14 rounded border cursor-pointer"
                />
                <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1" placeholder="#3b82f6" />
              </div>
              <div className="flex gap-2 mt-1">
                <div className="h-8 flex-1 rounded" style={{ backgroundColor: primaryColor }} />
                <div className="h-8 flex-1 rounded" style={{ backgroundColor: primaryColor, opacity: 0.7 }} />
                <div className="h-8 flex-1 rounded" style={{ backgroundColor: primaryColor, opacity: 0.4 }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LGPD */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" /> LGPD e Conformidade
          </CardTitle>
          <CardDescription>
            Configure os termos de uso e política de privacidade exibidos aos cidadãos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL dos Termos LGPD</Label>
            <Input value={lgpdUrl} onChange={(e) => setLgpdUrl(e.target.value)} placeholder="https://exemplo.com/termos-lgpd.pdf" />
            <p className="text-xs text-muted-foreground">
              Link para o documento de termos de aceite LGPD apresentado no primeiro atendimento.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Plano */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" /> Informações do Plano
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground mb-1">Plano Atual</p>
              <p className="text-lg font-semibold capitalize">{company.plan ?? "Básico"}</p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground mb-1">Limite de Usuários</p>
              <p className="text-lg font-semibold">{company.max_users ?? "Ilimitado"}</p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground mb-1">Interações IA / mês</p>
              <p className="text-lg font-semibold">{company.max_ai_interactions ?? "2.500"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving || !name || !slug}>
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
}
