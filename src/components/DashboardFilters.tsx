import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Filter, X, CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface FilterValues {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  timeFrom: string;
  timeTo: string;
  userId: string;
  sectorId: string;
  connectionType: string;
  chatbotOnly: boolean;
}

interface Props {
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
}

export const defaultFilters: FilterValues = {
  dateFrom: undefined,
  dateTo: undefined,
  timeFrom: "",
  timeTo: "",
  userId: "",
  sectorId: "",
  connectionType: "",
  chatbotOnly: false,
};

export function DashboardFilters({ filters, onChange }: Props) {
  const { user } = useAuth();
  const [agents, setAgents] = useState<{ user_id: string; full_name: string }[]>([]);
  const [sectors, setSectors] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      const [{ data: profileData }, { data: sectorData }] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name"),
        supabase.from("sectors").select("id, name").eq("is_active", true),
      ]);
      setAgents(profileData ?? []);
      setSectors(sectorData ?? []);
    };
    load();
  }, []);

  const activeCount = [
    filters.dateFrom, filters.dateTo, filters.timeFrom, filters.timeTo,
    filters.userId, filters.sectorId, filters.connectionType, filters.chatbotOnly,
  ].filter(Boolean).length;

  const clearFilters = () => onChange(defaultFilters);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Filter className="h-4 w-4" />
          Filtros
          {activeCount > 0 && <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{activeCount}</Badge>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold">Filtros</span>
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={clearFilters}>
              <X className="h-3 w-3" /> Limpar
            </Button>
          )}
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Data início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {filters.dateFrom ? format(filters.dateFrom, "dd/MM/yy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filters.dateFrom} onSelect={(d) => onChange({ ...filters, dateFrom: d })} locale={ptBR} /></PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Data fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {filters.dateTo ? format(filters.dateTo, "dd/MM/yy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filters.dateTo} onSelect={(d) => onChange({ ...filters, dateTo: d })} locale={ptBR} /></PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Hora início</Label>
              <Input type="time" value={filters.timeFrom} onChange={(e) => onChange({ ...filters, timeFrom: e.target.value })} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hora fim</Label>
              <Input type="time" value={filters.timeTo} onChange={(e) => onChange({ ...filters, timeTo: e.target.value })} className="h-8 text-xs" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Usuário</Label>
            <Select value={filters.userId} onValueChange={(v) => onChange({ ...filters, userId: v === "all" ? "" : v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {agents.map(a => <SelectItem key={a.user_id} value={a.user_id}>{a.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Setor/Fila</Label>
            <Select value={filters.sectorId} onValueChange={(v) => onChange({ ...filters, sectorId: v === "all" ? "" : v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {sectors.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Conexão</Label>
            <Select value={filters.connectionType} onValueChange={(v) => onChange({ ...filters, connectionType: v === "all" ? "" : v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="official">Oficial</SelectItem>
                <SelectItem value="unofficial">Não-oficial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">Somente chatbot</Label>
            <Button
              variant={filters.chatbotOnly ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => onChange({ ...filters, chatbotOnly: !filters.chatbotOnly })}
            >
              {filters.chatbotOnly ? "Sim" : "Não"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
