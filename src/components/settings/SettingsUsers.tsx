import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Settings2 } from "lucide-react";
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
    // Remove existing
    await supabase.from("user_sectors").delete().eq("user_id", editingUser.user_id);
    // Insert new
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

  const statusColor: Record<string, string> = {
    online: "bg-success",
    offline: "bg-muted-foreground",
    busy: "bg-warning",
  };

  return (
    <>
      <Card>
        <CardHeader><CardTitle className="text-base">Usuários e Permissões</CardTitle></CardHeader>
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
