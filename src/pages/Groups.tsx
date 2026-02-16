import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Users as UsersIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Group {
  id: string;
  name: string;
  description: string | null;
  is_open: boolean;
  invite_url: string | null;
  member_count?: number;
}

export default function Groups() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isOpen, setIsOpen] = useState(true);

  const getCompanyId = async () => {
    const { data } = await supabase.from("profiles").select("company_id").eq("user_id", user!.id).maybeSingle();
    return data?.company_id;
  };

  const load = async () => {
    const { data } = await supabase.from("groups").select("id, name, description, is_open, invite_url").order("name");
    if (data) {
      const withCounts: Group[] = [];
      for (const g of data) {
        const { count } = await supabase.from("group_members").select("id", { count: "exact", head: true }).eq("group_id", g.id);
        withCounts.push({ ...g, member_count: count ?? 0 });
      }
      setGroups(withCounts);
    }
  };

  useEffect(() => { if (user) load(); }, [user]);

  const addGroup = async () => {
    if (!name) return;
    const companyId = await getCompanyId();
    if (!companyId) return;
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    await supabase.from("groups").insert({
      company_id: companyId, name, description: description || null, is_open: isOpen,
      invite_url: `/g/${slug}-${Date.now().toString(36)}`,
    });
    toast({ title: "Grupo criado" });
    setDialogOpen(false); setName(""); setDescription("");
    load();
  };

  const deleteGroup = async (id: string) => {
    await supabase.from("groups").delete().eq("id", id);
    toast({ title: "Grupo removido" });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Grupos</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Grupo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Grupo</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nome *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="space-y-2"><Label>Descrição</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
              <div className="flex items-center justify-between"><Label>Grupo aberto</Label><Switch checked={isOpen} onCheckedChange={setIsOpen} /></div>
              <Button onClick={addGroup} className="w-full">Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Descrição</TableHead><TableHead>Membros</TableHead><TableHead>Tipo</TableHead><TableHead className="w-[60px]" /></TableRow></TableHeader>
            <TableBody>
              {groups.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum grupo.</TableCell></TableRow>
              ) : groups.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell className="text-muted-foreground">{g.description || "—"}</TableCell>
                  <TableCell><div className="flex items-center gap-1"><UsersIcon className="h-3.5 w-3.5" />{g.member_count}</div></TableCell>
                  <TableCell><Badge variant={g.is_open ? "secondary" : "outline"}>{g.is_open ? "Aberto" : "Fechado"}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteGroup(g.id)}><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
