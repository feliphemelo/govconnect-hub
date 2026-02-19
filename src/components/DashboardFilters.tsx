import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

export interface FilterValues {
  period: string;
  status: string;
  sector: string;
}

export const defaultFilters: FilterValues = {
  period: "7d",
  status: "all",
  sector: "all",
};

interface DashboardFiltersProps {
  onFilterChange?: (filters: FilterValues) => void;
}

export function DashboardFilters({ onFilterChange }: DashboardFiltersProps) {
  const [filters, setFilters] = useState<FilterValues>(defaultFilters);

  const handleFilterChange = (key: keyof FilterValues, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Filter className="w-4 h-4" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Período</label>
          <Select
            value={filters.period}
            onValueChange={(value) => handleFilterChange("period", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="all">Todo período</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Status</label>
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="closed">Fechados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            setFilters(defaultFilters);
            onFilterChange?.(defaultFilters);
          }}
        >
          Limpar Filtros
        </Button>
      </CardContent>
    </Card>
  );
}
