import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Building2, CreditCard, Shield, Users, Plus, Eye, Trash2, Package, Wifi, UserPlus,
} from "lucide-react";
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
  allow_unofficial_api: boolean;
  official_api_mandatory: boolean;
  allowed_unofficial_engines: string[];
  default_unofficial_engine: string | null;
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

const MODULES = ["dashboard", "chat", "contacts", "chatbot", "groups", "broadcasts", "polls", "signatures", "reports", "credits", "webhooks", "settings"];
const ROLES = ["admin", "manager", "agent", "broadcaster", "referenced"];
const PERM_LEVELS = ["view", "edit", "admin"];
const ENGINES = ["baileys", "libzapitu"];

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
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", full_name: "", company_id: "", role: "agent" });

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

  const deleteTenant = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este município? Esta ação é irreversível.")) return;
    await supabase.from("companies").delete().eq("id", id);
    toast({ title: "Município removido" });
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

  const deletePlan = async (id: string) => {
    await supabase.from("plans").delete().eq("id", id);
    toast({ title: "Plano removido" });
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

  const updateTenantEngine = async (tenantId: string, field: string, value: any) => {
    await supabase.from("companies").update({ [field]: value } as any).eq("id", tenantId);
    loadAll();
  };

  const impersonateTenant = async (companyId: string, companyName: string) => {
    // Find an admin user linked to this company
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .eq("company_id", companyId);
    
    if (!profiles || profiles.length === 0) {
      toast({ title: "Nenhum usuário encontrado nesta empresa", variant: "destructive" });
      return;
    }

    // Find admin role user
    let targetUserId: string | null = null;
    let targetName = "";
    for (const p of profiles) {
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", p.user_id).maybeSingle();
      if (roleData?.role === "admin") {
        targetUserId = p.user_id;
        targetName = p.full_name;
        break;
      }
    }

    if (!targetUserId) {
      // Fallback to first user
      targetUserId = profiles[0].user_id;
      targetName = profiles[0].full_name;
    }

    // Store impersonation info in sessionStorage
    sessionStorage.setItem("impersonate_company_id", companyId);
    sessionStorage.setItem("impersonate_company_name", companyName);
    sessionStorage.setItem("impersonate_user_name", targetName);
    
    toast({ title: `Acessando como ${targetName}`, description: `Empresa: ${companyName}. Navegue para /dashboard para ver como admin do tenant.` });
    window.location.href = "/dashboard";
  };

  const createUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.full_name || !newUser.company_id) return;
    const { data, error } = await supabase.auth.signUp({
      email: newUser.email,
      password: newUser.password,
      options: {
        data: {
          full_name: newUser.full_name,
          company_id: newUser.company_id,
        },
      },
    });
    if (error) {
      toast({ title: "Erro ao criar usuário", description: error.message, variant: "destructive" });
      return;
    }
    if (data.user && newUser.role !== "agent") {
      await supabase.from("user_roles").update({ role: newUser.role } as any).eq("user_id", data.user.id);
    }
    toast({ title: "Usuário criado com sucesso" });
    setNewUser({ email: "", password: "", full_name: "", company_id: "", role: "agent" });
    setShowNewUser(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Painel SuperAdmin</h1>
      <Tabs defaultValue="tenants">
        <TabsList className="flex w-full max-w-4xl flex-wrap gap-1">
          <TabsTrigger value="tenants" className="gap-1.5 text-xs"><Building2 className="h-3.5 w-3.5" /> Municípios</TabsTrigger>
          <TabsTrigger value="plans" className="gap-1.5 text-xs"><Package className="h-3.5 w-3.5" /> Planos</TabsTrigger>
          <TabsTrigger value="engines" className="gap-1.5 text-xs"><Wifi className="h-3.5 w-3.5" /> Engines WA</TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5 text-xs"><Users className="h-3.5 w-3.5" /> Usuários</TabsTrigger>
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
                    <div><Label>Slug</Label><Input value={newTenant.slug} onChange={e => setNewTenant(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))} /></div>
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
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Acessar como Admin" onClick={() => impersonateTenant(t.id, t.name)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Excluir" onClick={() => deleteTenant(t.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
                      <div><Label>Créditos WA</Label><Input type="number" value={newPlan.max_whatsapp_credits} onChange={e => setNewPlan(p => ({ ...p, max_whatsapp_credits: +e.target.value }))} /></div>
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
                    <TableHead></TableHead>
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
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deletePlan(p.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ENGINES */}
        <TabsContent value="engines">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuração Global de Engines WhatsApp</CardTitle>
              <CardDescription>Defina quais engines não-oficiais cada município pode usar e as regras de prioridade de envio.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Município</TableHead>
                    <TableHead>API Não-Oficial</TableHead>
                    <TableHead>API Oficial Obrigatória</TableHead>
                    <TableHead>Engines Permitidas</TableHead>
                    <TableHead>Engine Padrão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>
                        <Switch
                          checked={t.allow_unofficial_api ?? false}
                          onCheckedChange={(v) => updateTenantEngine(t.id, "allow_unofficial_api", v)}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={t.official_api_mandatory ?? true}
                          onCheckedChange={(v) => updateTenantEngine(t.id, "official_api_mandatory", v)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-3">
                          {ENGINES.map(eng => (
                            <label key={eng} className="flex items-center gap-1.5 text-xs">
                              <Checkbox
                                checked={(t.allowed_unofficial_engines ?? []).includes(eng)}
                                onCheckedChange={(checked) => {
                                  const current = t.allowed_unofficial_engines ?? [];
                                  const updated = checked
                                    ? [...current, eng]
                                    : current.filter((e: string) => e !== eng);
                                  updateTenantEngine(t.id, "allowed_unofficial_engines", updated);
                                }}
                              />
                              <span className="capitalize">{eng}</span>
                            </label>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={t.default_unofficial_engine ?? ""}
                          onValueChange={(v) => updateTenantEngine(t.id, "default_unofficial_engine", v)}
                        >
                          <SelectTrigger className="h-8 w-28 text-xs"><SelectValue placeholder="Nenhum" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="baileys">Baileys</SelectItem>
                            <SelectItem value="libzapitu">LibZapitu</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Priority Rules Info */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Regras de Prioridade de Envio</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <p><strong className="text-foreground">1.</strong> Se provedor oficial (Meta/Serpro) configurado → usa provedor oficial → aplica lógica de créditos (template = 1 crédito).</p>
              <p><strong className="text-foreground">2.</strong> Se provedor não-oficial selecionado → usa Baileys ou LibZapitu → sem dedução de crédito.</p>
              <p><strong className="text-foreground">3.</strong> Se "API Oficial Obrigatória" ativa → sempre usa oficial, ignora não-oficial.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* USERS */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Criar Usuários</CardTitle>
                <CardDescription>Crie usuários já vinculados a um município</CardDescription>
              </div>
              <Dialog open={showNewUser} onOpenChange={setShowNewUser}>
                <DialogTrigger asChild>
                  <Button size="sm"><UserPlus className="h-4 w-4 mr-1" /> Novo Usuário</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Criar Usuário</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Nome Completo</Label><Input value={newUser.full_name} onChange={e => setNewUser(p => ({ ...p, full_name: e.target.value }))} /></div>
                    <div><Label>E-mail</Label><Input type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} /></div>
                    <div><Label>Senha</Label><Input type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} minLength={6} /></div>
                    <div>
                      <Label>Município</Label>
                      <Select value={newUser.company_id} onValueChange={v => setNewUser(p => ({ ...p, company_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="Selecionar município" /></SelectTrigger>
                        <SelectContent>
                          {tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Perfil</Label>
                      <Select value={newUser.role} onValueChange={v => setNewUser(p => ({ ...p, role: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="manager">Gerente de Setor</SelectItem>
                          <SelectItem value="agent">Atendente</SelectItem>
                          <SelectItem value="broadcaster">Disparador</SelectItem>
                          <SelectItem value="referenced">Referenciado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={createUser} className="w-full" disabled={!newUser.email || !newUser.password || !newUser.company_id}>
                      Criar Usuário
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Usuários criados aqui são automaticamente vinculados ao município selecionado. O perfil e papel são atribuídos no momento da criação.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PERMISSIONS */}
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Matriz de Permissões por Módulo</CardTitle>
              <CardDescription>Define o nível de acesso de cada perfil em cada módulo do sistema.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-card z-10">Módulo</TableHead>
                    {ROLES.map(r => <TableHead key={r} className="text-center text-xs capitalize">{r}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MODULES.map(mod => (
                    <TableRow key={mod}>
                      <TableCell className="font-medium capitalize sticky left-0 bg-card z-10">{mod}</TableCell>
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
