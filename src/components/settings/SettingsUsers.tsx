import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings2, UserPlus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface UserRow {
  id: string;
  user_id: string;
  full_name: string;
  status: string;
  is_active: boolean;
  role: string;
  role_id: string;
  sector_ids: string[];
}

interface Sector {
  id: string;
  name: string;
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  manager: "Gerente",
  agent: "Atendente",
  broadcaster: "Disparador",
  referenced: "Referenciado",
};

export default function SettingsUsers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // New user form
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", full_name: "", role: "agent" });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("user_id", user!.id).maybeSingle();
    if (!profile) return;
    setCompanyId(profile.company_id);

    const [{ data: profiles }, { data: sectorData }, { data: userSectors }] = await Promise.all([
      supabase.from("profiles").select("id, user_id, full_name, status, is_active"),
      supabase.from("sectors").select("id, name").eq("company_id", profile.company_id),
      supabase.from("user_sectors").select("user_id, sector_id"),
    ]);

    setSectors((sectorData as Sector[]) ?? []);

    if (!profiles) return;
    const rows: UserRow[] = [];
    for (const p of profiles) {
      const { data: roleData } = await supabase.from("user_roles").select("id, role").eq("user_id", p.user_id).maybeSingle();
      const uSectors = (userSectors ?? []).filter((us: any) => us.user_id === p.user_id).map((us: any) => us.sector_id);
      rows.push({
        ...p,
        is_active: p.is_active ?? true,
        status: p.status ?? "offline",
        role: roleData?.role ?? "agent",
        role_id: roleData?.id ?? "",
        sector_ids: uSectors,
      });
    }
    setUsers(rows);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const updateRole = async (roleId: string, newRole: string) => {
    await supabase.from("user_roles").update({ role: newRole as any }).eq("id", roleId);
    toast({ title: "Permissão atualizada" });
    load();
  };

  const toggleActive = async (profile: UserRow) => {
    await supabase.from("profiles").update({ is_active: !profile.is_active }).eq("id", profile.id);
    load();
  };

  const openSectorEditor = (u: UserRow) => {
    setEditingUser(u);
    setSelectedSectors(u.sector_ids);
  };

  const saveSectors = async () => {
    if (!editingUser || !companyId) return;
    await supabase.from("user_sectors").delete().eq("user_id", editingUser.user_id);
    if (selectedSectors.length > 0) {
      await supabase.from("user_sectors").insert(
        selectedSectors.map((sid) => ({
          user_id: editingUser.user_id,
          sector_id: sid,
          company_id: companyId,
        })) as any
      );
    }
    toast({ title: "Setores atualizados" });
    setEditingUser(null);
    load();
  };

  const toggleSector = (sectorId: string) => {
    setSelectedSectors((prev) =>
      prev.includes(sectorId) ? prev.filter((s) => s !== sectorId) : [...prev, sectorId]
    );
  };

  const createNewUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.full_name || !companyId) return;
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("create-user", {
      body: {
        email: newUser.email,
        password: newUser.password,
        full_name: newUser.full_name,
        company_id: companyId,
        role: newUser.role,
      },
    });
    if (error || data?.error) {
      toast({ title: "Erro ao criar usuário", description: error?.message || data?.error, variant: "destructive" });
    } else {
      toast({ title: "Usuário criado com sucesso" });
      setNewUser({ email: "", password: "", full_name: "", role: "agent" });
      setShowNewUser(false);
      load();
    }
    setCreating(false);
  };

  const statusColor: Record<string, string> = {
    online: "bg-success",
    offline: "bg-muted-foreground",
    busy: "bg-warning",
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Usuários e Permissões</CardTitle>
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
                  <Label>Perfil</Label>
                  <Select value={newUser.role} onValueChange={v => setNewUser(p => ({ ...p, role: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createNewUser} className="w-full" disabled={creating || !newUser.email || !newUser.password || !newUser.full_name}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <UserPlus className="h-4 w-4 mr-1" />}
                  Criar Usuário
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Permissão</TableHead>
                <TableHead>Setores</TableHead>
                <TableHead>Ativo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum usuário.</TableCell></TableRow>
              ) : users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${statusColor[u.status] ?? statusColor.offline}`} />
                      <span className="font-medium">{u.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{u.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Select value={u.role} onValueChange={(v) => updateRole(u.role_id, v)}>
                      <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(roleLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => openSectorEditor(u)}>
                      <Settings2 className="h-3 w-3" />
                      {u.sector_ids.length > 0 ? `${u.sector_ids.length} setor(es)` : "Nenhum"}
                    </Button>
                  </TableCell>
                  <TableCell><Switch checked={u.is_active} onCheckedChange={() => toggleActive(u)} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sector assignment dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setores de {editingUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {sectors.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum setor cadastrado.</p>
            ) : sectors.map((s) => (
              <label key={s.id} className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-muted/50">
                <Checkbox
                  checked={selectedSectors.includes(s.id)}
                  onCheckedChange={() => toggleSector(s.id)}
                />
                <span className="text-sm">{s.name}</span>
              </label>
            ))}
          </div>
          <Button onClick={saveSectors} className="w-full">Salvar Setores</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
