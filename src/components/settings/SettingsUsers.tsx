import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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

  const load = async () => {
    const { data: profiles } = await supabase.from("profiles").select("id, user_id, full_name, status, is_active");
    if (!profiles) return;

    const rows: UserRow[] = [];
    for (const p of profiles) {
      const { data: roleData } = await supabase.from("user_roles").select("id, role").eq("user_id", p.user_id).maybeSingle();
      rows.push({
        ...p,
        is_active: p.is_active ?? true,
        status: p.status ?? "offline",
        role: roleData?.role ?? "agent",
        role_id: roleData?.id ?? "",
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

  const statusColor: Record<string, string> = {
    online: "bg-success",
    offline: "bg-muted-foreground",
    busy: "bg-warning",
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Usuários e Permissões</CardTitle></CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Permissão</TableHead>
              <TableHead>Ativo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum usuário.</TableCell></TableRow>
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
                <TableCell><Switch checked={u.is_active} onCheckedChange={() => toggleActive(u)} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
