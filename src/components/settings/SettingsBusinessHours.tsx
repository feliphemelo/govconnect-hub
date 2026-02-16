import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

interface BHRow {
  id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_active: boolean;
}

export default function SettingsBusinessHours() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [hours, setHours] = useState<BHRow[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from("business_hours")
      .select("id, day_of_week, open_time, close_time, is_active")
      .order("day_of_week");
    setHours(data ?? []);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const getCompanyId = async () => {
    const { data } = await supabase.from("profiles").select("company_id").eq("user_id", user!.id).maybeSingle();
    return data?.company_id;
  };

  const initDefaults = async () => {
    const companyId = await getCompanyId();
    if (!companyId) return;
    const defaults = [1, 2, 3, 4, 5].map((day) => ({
      company_id: companyId,
      day_of_week: day,
      open_time: "08:00",
      close_time: "18:00",
      is_active: true,
    }));
    // Weekend
    defaults.push({ company_id: companyId, day_of_week: 0, open_time: "08:00", close_time: "18:00", is_active: false });
    defaults.push({ company_id: companyId, day_of_week: 6, open_time: "08:00", close_time: "18:00", is_active: false });
    await supabase.from("business_hours").insert(defaults);
    toast({ title: "Horários padrão criados" });
    load();
  };

  const update = async (row: BHRow, field: string, value: any) => {
    await supabase.from("business_hours").update({ [field]: value }).eq("id", row.id);
    load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Horário de Expediente</CardTitle>
        {hours.length === 0 && (
          <Button size="sm" onClick={initDefaults}>Criar padrão</Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dia</TableHead>
              <TableHead>Abertura</TableHead>
              <TableHead>Fechamento</TableHead>
              <TableHead>Ativo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hours.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Clique em "Criar padrão" para iniciar.</TableCell></TableRow>
            ) : hours.map((h) => (
              <TableRow key={h.id}>
                <TableCell className="font-medium">{DAYS[h.day_of_week]}</TableCell>
                <TableCell>
                  <Input type="time" value={h.open_time} onChange={(e) => update(h, "open_time", e.target.value)} className="h-8 w-28" />
                </TableCell>
                <TableCell>
                  <Input type="time" value={h.close_time} onChange={(e) => update(h, "close_time", e.target.value)} className="h-8 w-28" />
                </TableCell>
                <TableCell>
                  <Switch checked={h.is_active ?? false} onCheckedChange={(v) => update(h, "is_active", v)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
