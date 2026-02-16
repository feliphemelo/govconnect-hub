import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, CreditCard, Shield, Users, Plus, Eye, Trash2, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  plan: string | null;
  plan_id: string | null;
  credits_balance: number;
  max_users: number | null;
  max_ai_interactions: number | null;
  storage_used_gb: number;
  created_at: string;
}

interface Plan {
  id: string;
  name: string;
  max_users: number;
  max_sectors: number;
  max_ai_interactions: number;
  max_whatsapp_credits: number;
  storage_limit_gb: number;
  price: number;
  is_active: boolean;
}

interface ModulePerm {
  id: string;
  role_name: string;
  module_name: string;
  permission_level: string;
}

const MODULES = ["dashboard", "chat", "contacts", "chatbot", "groups", "broadcasts", "signatures", "reports", "credits", "webhooks", "settings"];
const ROLES = ["admin", "manager", "agent", "broadcaster", "referenced"];
const PERM_LEVELS = ["view", "edit", "admin"];

export default function SuperAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [permissions, setPermissions] = useState<ModulePerm[]>([]);
  const [newTenant, setNewTenant] = useState({ name: "", slug: "" });
  const [newPlan, setNewPlan] = useState({ name: "", max_users: 10, max_sectors: 5, max_ai_interactions: 2500, max_whatsapp_credits: 1000, storage_limit_gb: 10, price: 0 });
  const [showNewTenant, setShowNewTenant] = useState(false);
  const [showNewPlan, setShowNewPlan] = useState(false);

  const loadAll = async () => {
    const [{ data: t }, { data: p }, { data: mp }] = await Promise.all([
      supabase.from("companies").select("*"),
      supabase.from("plans").select("*"),
      supabase.from("module_permissions").select("*"),
    ]);
    setTenants((t as any[]) ?? []);
    setPlans((p as Plan[]) ?? []);
    setPermissions((mp as ModulePerm[]) ?? []);
  };

  useEffect(() => { if (user) loadAll(); }, [user]);

  const createTenant = async () => {
    if (!newTenant.name || !newTenant.slug) return;
    const { error } = await supabase.from("companies").insert({ name: newTenant.name, slug: newTenant.slug } as any);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Município criado" });
    setNewTenant({ name: "", slug: "" });
    setShowNewTenant(false);
    loadAll();
  };

  const toggleTenant = async (id: string, active: boolean) => {
    await supabase.from("companies").update({ is_active: !active }).eq("id", id);
    loadAll();
  };

  const assignPlan = async (tenantId: string, planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    await supabase.from("companies").update({
      plan_id: planId,
      max_users: plan.max_users,
      max_ai_interactions: plan.max_ai_interactions,
    } as any).eq("id", tenantId);
    toast({ title: "Plano atribuído" });
    loadAll();
  };

  const createPlan = async () => {
    if (!newPlan.name) return;
    await supabase.from("plans").insert(newPlan as any);
    toast({ title: "Plano criado" });
    setNewPlan({ name: "", max_users: 10, max_sectors: 5, max_ai_interactions: 2500, max_whatsapp_credits: 1000, storage_limit_gb: 10, price: 0 });
    setShowNewPlan(false);
    loadAll();
  };

  const setPermission = async (role: string, module: string, level: string) => {
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("user_id", user!.id).maybeSingle();
    if (!profile) return;
    const existing = permissions.find(p => p.role_name === role && p.module_name === module);
    if (existing) {
      await supabase.from("module_permissions").update({ permission_level: level } as any).eq("id", existing.id);
    } else {
      await supabase.from("module_permissions").insert({ company_id: profile.company_id, role_name: role, module_name: module, permission_level: level } as any);
    }
    loadAll();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Painel SuperAdmin</h1>
      <Tabs defaultValue="tenants">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="tenants" className="gap-1.5 text-xs"><Building2 className="h-3.5 w-3.5" /> Municípios</TabsTrigger>
          <TabsTrigger value="plans" className="gap-1.5 text-xs"><Package className="h-3.5 w-3.5" /> Planos</TabsTrigger>
          <TabsTrigger value="permissions" className="gap-1.5 text-xs"><Shield className="h-3.5 w-3.5" /> Permissões</TabsTrigger>
          <TabsTrigger value="usage" className="gap-1.5 text-xs"><CreditCard className="h-3.5 w-3.5" /> Uso</TabsTrigger>
        </TabsList>

        {/* TENANTS */}
        <TabsContent value="tenants">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Municípios (Tenants)</CardTitle>
              <Dialog open={showNewTenant} onOpenChange={setShowNewTenant}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Município</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Criar Município</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Nome</Label><Input value={newTenant.name} onChange={e => setNewTenant(p => ({ ...p, name: e.target.value }))} /></div>
                    <div><Label>Slug</Label><Input value={newTenant.slug} onChange={e => setNewTenant(p => ({ ...p, slug: e.target.value }))} /></div>
                    <Button onClick={createTenant} className="w-full">Criar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{t.slug}</TableCell>
                      <TableCell>
                        <Select value={t.plan_id ?? ""} onValueChange={v => assignPlan(t.id, v)}>
                          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                          <SelectContent>
                            {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Switch checked={t.is_active} onCheckedChange={() => toggleTenant(t.id, t.is_active)} /></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Impersonate">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PLANS */}
        <TabsContent value="plans">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Gerenciamento de Planos</CardTitle>
              <Dialog open={showNewPlan} onOpenChange={setShowNewPlan}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Plano</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Criar Plano</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Nome</Label><Input value={newPlan.name} onChange={e => setNewPlan(p => ({ ...p, name: e.target.value }))} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Max Usuários</Label><Input type="number" value={newPlan.max_users} onChange={e => setNewPlan(p => ({ ...p, max_users: +e.target.value }))} /></div>
                      <div><Label>Max Setores</Label><Input type="number" value={newPlan.max_sectors} onChange={e => setNewPlan(p => ({ ...p, max_sectors: +e.target.value }))} /></div>
                      <div><Label>Max IA/mês</Label><Input type="number" value={newPlan.max_ai_interactions} onChange={e => setNewPlan(p => ({ ...p, max_ai_interactions: +e.target.value }))} /></div>
                      <div><Label>Créditos WhatsApp</Label><Input type="number" value={newPlan.max_whatsapp_credits} onChange={e => setNewPlan(p => ({ ...p, max_whatsapp_credits: +e.target.value }))} /></div>
                      <div><Label>Storage (GB)</Label><Input type="number" value={newPlan.storage_limit_gb} onChange={e => setNewPlan(p => ({ ...p, storage_limit_gb: +e.target.value }))} /></div>
                      <div><Label>Preço (R$)</Label><Input type="number" value={newPlan.price} onChange={e => setNewPlan(p => ({ ...p, price: +e.target.value }))} /></div>
                    </div>
                    <Button onClick={createPlan} className="w-full">Criar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Usuários</TableHead>
                    <TableHead>Setores</TableHead>
                    <TableHead>IA/mês</TableHead>
                    <TableHead>Créditos</TableHead>
                    <TableHead>Storage</TableHead>
                    <TableHead>Preço</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.max_users}</TableCell>
                      <TableCell>{p.max_sectors}</TableCell>
                      <TableCell>{p.max_ai_interactions.toLocaleString("pt-BR")}</TableCell>
                      <TableCell>{p.max_whatsapp_credits.toLocaleString("pt-BR")}</TableCell>
                      <TableCell>{p.storage_limit_gb} GB</TableCell>
                      <TableCell>R$ {Number(p.price).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PERMISSIONS */}
        <TabsContent value="permissions">
          <Card>
            <CardHeader><CardTitle className="text-base">Permissões por Módulo</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-card">Módulo</TableHead>
                    {ROLES.map(r => <TableHead key={r} className="text-center text-xs capitalize">{r}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MODULES.map(mod => (
                    <TableRow key={mod}>
                      <TableCell className="font-medium capitalize sticky left-0 bg-card">{mod}</TableCell>
                      {ROLES.map(role => {
                        const perm = permissions.find(p => p.role_name === role && p.module_name === mod);
                        return (
                          <TableCell key={role} className="text-center">
                            <Select value={perm?.permission_level ?? "view"} onValueChange={v => setPermission(role, mod, v)}>
                              <SelectTrigger className="h-7 w-20 text-[10px] mx-auto"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {PERM_LEVELS.map(l => <SelectItem key={l} value={l} className="text-xs capitalize">{l}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* USAGE */}
        <TabsContent value="usage">
          <div className="grid gap-4">
            {tenants.map(t => (
              <Card key={t.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>{t.name}</span>
                    <Badge variant={t.is_active ? "default" : "destructive"}>{t.is_active ? "Ativo" : "Suspenso"}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><span className="text-muted-foreground">Créditos:</span> <span className="font-medium">{Number(t.credits_balance).toLocaleString("pt-BR")}</span></div>
                    <div><span className="text-muted-foreground">Max Usuários:</span> <span className="font-medium">{t.max_users ?? "—"}</span></div>
                    <div><span className="text-muted-foreground">Max IA:</span> <span className="font-medium">{t.max_ai_interactions?.toLocaleString("pt-BR") ?? "—"}</span></div>
                    <div><span className="text-muted-foreground">Storage:</span> <span className="font-medium">{Number(t.storage_used_gb ?? 0).toFixed(1)} GB</span></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
